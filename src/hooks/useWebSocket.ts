import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import {
  ConnectionState,
  Gender,
  HelloResponse,
  MatchResponse,
  Preference,
  SystemMessage,
  ChatMessage,
  JoinRequest,
  MessageRequest,
  ChatBubble,
  OnlineCountMessage
} from '../types/chat';
import { WS_BROKER_URL } from '../config/env';

const generateLocalAnonId = () =>
  'anon-' + Math.random().toString(36).slice(2, 10);

export const useWebSocket = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    sessionId: null,
    roomId: null,
    anonId: generateLocalAnonId()
  });
  const [chatMessages, setChatMessages] = useState<ChatBubble[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [partnerAction, setPartnerAction] = useState<'left' | 'next' | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  const clientRef = useRef<Client | null>(null);
  const clientIdRef = useRef<string>('');
  const anonIdRef = useRef<string | null>(null);
  const noMatchTimeoutRef = useRef<number | null>(null);
  const onlineCountPollRef = useRef<number | null>(null);
  const systemMessageTimeoutsRef = useRef<Record<string, number>>({});
  // When backend sends PARTNER_NEXT or PARTNER_LEFT it may also push SEARCHING
  // to re-queue the user automatically. We ignore that until the user explicitly joins.
  const ignoreBackendSearchingRef = useRef(false);
  const subscriptionsRef = useRef<{
    hello?: StompSubscription;
    match?: StompSubscription;
    room?: StompSubscription;
    system?: StompSubscription;
    onlineCount?: StompSubscription;
  }>({});

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  }, []);

  const clearSystemMessageTimeouts = useCallback(() => {
    Object.values(systemMessageTimeoutsRef.current).forEach(timeoutId => {
      window.clearTimeout(timeoutId);
    });
    systemMessageTimeoutsRef.current = {};
  }, []);

  const addChatMessage = useCallback((text: string, type: 'me' | 'other' | 'system', sender?: string) => {
    const messageId = `${Date.now()}-${Math.random()}`;

    setChatMessages(prev => [...prev, {
      id: messageId,
      text,
      type,
      sender,
      timestamp: new Date()
    }]);

    if (type === 'system') {
      const timeoutId = window.setTimeout(() => {
        setChatMessages(prev => prev.filter(message => message.id !== messageId));
        delete systemMessageTimeoutsRef.current[messageId];
      }, 5000);

      systemMessageTimeoutsRef.current[messageId] = timeoutId;
    }
  }, []);

  const resetRoom = useCallback(() => {
    setConnectionState(prev => ({ ...prev, roomId: null }));
    setChatMessages([]);
    clearSystemMessageTimeouts();
    setIsSearching(false);
    setNoMatchFound(false);
    if (subscriptionsRef.current.room) {
      subscriptionsRef.current.room.unsubscribe();
      subscriptionsRef.current.room = undefined;
    }
  }, [clearSystemMessageTimeouts]);

  const startNoMatchTimeout = useCallback(() => {
    if (noMatchTimeoutRef.current) {
      window.clearTimeout(noMatchTimeoutRef.current);
    }

    noMatchTimeoutRef.current = window.setTimeout(() => {
      setConnectionState(prev => {
        if (prev.roomId === null && prev.connected) {
          setIsSearching(false);
          setNoMatchFound(true);
          addChatMessage('No match found. Please try joining again.', 'system', 'SYSTEM');
          return prev;
        }
        return prev;
      });
    }, 30000);
  }, [addChatMessage]);

  const connect = useCallback(() => {
    if (clientRef.current?.active) return; // already connecting or connected
    // clean up any stale deactivated client
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setIsConnecting(true);
    clientIdRef.current = `client-${Math.random().toString(36).slice(2)}`;
    const client = new Client({
      brokerURL: WS_BROKER_URL,
      reconnectDelay: 0,
      debug: (str) => {
        console.log('STOMP Debug:', str);
      }
    });

    client.onConnect = () => {
      if (clientRef.current !== client) return; // stale client, ignore
      setIsConnecting(false);
      setConnectionState(prev => ({ ...prev, connected: true }));
      addLog('CONNECTED');

      // Subscribe to hello response
      subscriptionsRef.current.hello = client.subscribe('/topic/hello', (msg: IMessage) => {
        const payload: HelloResponse = JSON.parse(msg.body);
        if (payload.clientId !== clientIdRef.current) {
          return;
        }
        const sessionId = payload.sessionId;
        setConnectionState(prev => ({ ...prev, sessionId }));
        addLog(`Session ID: ${sessionId}`);

        // Subscribe to match notifications
        subscriptionsRef.current.match = client.subscribe(`/topic/match/${sessionId}`, (matchMsg: IMessage) => {
          const matchPayload: MatchResponse = JSON.parse(matchMsg.body);
          addLog(`MATCH: ${matchMsg.body}`);

          if (matchPayload.type === 'MATCHED' && matchPayload.roomId) {
            // If we're ignoring backend-initiated matches (after PARTNER_NEXT/PARTNER_LEFT),
            // immediately leave the auto-matched room and don't update UI
            if (ignoreBackendSearchingRef.current) {
              console.log('MATCHED ignored — auto-match after partner disconnect, leaving room immediately');
              if (client.active) client.publish({ destination: '/app/leave' });
              return;
            }

            const roomId = matchPayload.roomId;
            setIsSearching(false);
            setNoMatchFound(false);
            if (noMatchTimeoutRef.current) {
              window.clearTimeout(noMatchTimeoutRef.current);
              noMatchTimeoutRef.current = null;
            }

            // Always unsubscribe from old room before subscribing to new one
            if (subscriptionsRef.current.room) {
              subscriptionsRef.current.room.unsubscribe();
              subscriptionsRef.current.room = undefined;
            }

            // Clear old messages and update room state for the new match
            clearSystemMessageTimeouts();
            setChatMessages([]);
            setPartnerAction(null);
            setConnectionState(prev => ({ ...prev, roomId }));
            addChatMessage('Connected to chat room!', 'system', 'SYSTEM');

            // Subscribe to new room messages
            subscriptionsRef.current.room = client.subscribe(`/topic/room/${roomId}`, (roomMsg: IMessage) => {
              const roomPayload: ChatMessage = JSON.parse(roomMsg.body);
              
              if (roomPayload.senderId) {
                const side = roomPayload.senderId === anonIdRef.current ? 'me' : 'other';
                addChatMessage(roomPayload.message, side, roomPayload.senderId);
              } else if (roomPayload.type && roomPayload.message) {
                addChatMessage(roomPayload.message, 'system', roomPayload.type);
              } else {
                addChatMessage(roomMsg.body, 'system');
              }
            });
          }

          if (matchPayload.type === 'SEARCHING') {
            if (ignoreBackendSearchingRef.current) {
              console.log('SEARCHING ignored — waiting for user to re-join manually');
              return;
            }
            setIsSearching(true);
            setNoMatchFound(false);
          }

          if (matchPayload.type === 'PARTNER_LEFT') {
            // Tell backend to remove B from queue immediately
            if (client.active) client.publish({ destination: '/app/leave' });
            // Add message first, then clear room — but don't wipe messages
            addChatMessage('Partner left the chat.', 'system', 'SYSTEM');
            ignoreBackendSearchingRef.current = true;
            setPartnerAction('left');
            setConnectionState(prev => ({ ...prev, roomId: null }));
            setIsSearching(false);
            setNoMatchFound(false);
            if (noMatchTimeoutRef.current) {
              window.clearTimeout(noMatchTimeoutRef.current);
              noMatchTimeoutRef.current = null;
            }
            if (subscriptionsRef.current.room) {
              subscriptionsRef.current.room.unsubscribe();
              subscriptionsRef.current.room = undefined;
            }
          }

          if (matchPayload.type === 'PARTNER_NEXT') {
            // Tell backend to remove B from queue immediately
            if (client.active) client.publish({ destination: '/app/leave' });
            addChatMessage('Partner skipped to next. Find a new match!', 'system', 'SYSTEM');
            ignoreBackendSearchingRef.current = true;
            setPartnerAction('next');
            setConnectionState(prev => ({ ...prev, roomId: null }));
            setIsSearching(false);
            setNoMatchFound(false);
            if (noMatchTimeoutRef.current) {
              window.clearTimeout(noMatchTimeoutRef.current);
              noMatchTimeoutRef.current = null;
            }
            if (subscriptionsRef.current.room) {
              subscriptionsRef.current.room.unsubscribe();
              subscriptionsRef.current.room = undefined;
            }
          }
        });

        // Subscribe to system messages
        subscriptionsRef.current.system = client.subscribe(`/topic/system/${sessionId}`, (systemMsg: IMessage) => {
          addLog(`SYSTEM: ${systemMsg.body}`);
          const systemPayload: SystemMessage = JSON.parse(systemMsg.body);
          
          if (systemPayload.type === 'IDENTITY') {
            anonIdRef.current = systemPayload.message;
            setConnectionState(prev => ({ ...prev, anonId: systemPayload.message }));
          }
        });

        // Unsubscribe from hello after receiving response
        if (subscriptionsRef.current.hello) {
          subscriptionsRef.current.hello.unsubscribe();
          subscriptionsRef.current.hello = undefined;
        }
      });

      // Send hello message
      client.publish({
        destination: '/app/hello',
        body: JSON.stringify({ clientId: clientIdRef.current })
      });

      // Subscribe to online user count and request immediately + poll every 8s
      subscriptionsRef.current.onlineCount = client.subscribe('/topic/online-count', (msg: IMessage) => {
        try {
          const payload: OnlineCountMessage = JSON.parse(msg.body);
          setOnlineCount(payload.count);
        } catch {
          // ignore malformed messages
        }
      });
      // Request the current count right away
      client.publish({ destination: '/app/online-count', body: '{}' });
      // Poll every 8 s so each tab keeps the count fresh (handles backends
      // that respond point-to-point instead of broadcasting to all subscribers)
      if (onlineCountPollRef.current) window.clearInterval(onlineCountPollRef.current);
      onlineCountPollRef.current = window.setInterval(() => {
        if (client.active) {
          client.publish({ destination: '/app/online-count', body: '{}' });
        }
      }, 8000);
    };

    client.onWebSocketClose = () => {
      if (clientRef.current !== client) return; // stale client, ignore
      if (onlineCountPollRef.current) {
        window.clearInterval(onlineCountPollRef.current);
        onlineCountPollRef.current = null;
      }
      setOnlineCount(null);
      anonIdRef.current = null;
      setIsConnecting(false);
      setConnectionState({
        connected: false,
        sessionId: null,
        roomId: null,
        anonId: generateLocalAnonId()
      });
      clientRef.current = null;
      resetRoom();
      addLog('DISCONNECTED');
    };

    client.onStompError = (frame) => {
      addLog(`ERROR: ${frame.body}`);
    };

    clientRef.current = client;
    client.activate();
  }, [addLog, addChatMessage, resetRoom, clearSystemMessageTimeouts]);

  // leave() — notifies backend with /app/leave (backend sends PARTNER_LEFT to partner B)
  const leave = useCallback(() => {
    setPartnerAction(null);
    if (clientRef.current?.active) {
      clientRef.current.publish({ destination: '/app/leave' });
    }
    resetRoom();
  }, [resetRoom]);

  // disconnect() — full WS teardown (used on unmount only)
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  const join = useCallback((preference: Preference, gender: Gender) => {
    if (!clientRef.current?.active || !gender) return;
    // User explicitly joining — allow backend SEARCHING events again
    ignoreBackendSearchingRef.current = false;
    
    const joinRequest: JoinRequest = { 
      gender,
      preference
    };
    
    setIsSearching(true);
    setNoMatchFound(false);
    
    clientRef.current.publish({
      destination: '/app/join',
      body: JSON.stringify(joinRequest)
    });
    addChatMessage('Joined queue. Waiting for match...', 'system', 'SYSTEM');
    addLog(`JOIN: ${gender}/${preference}`);
    startNoMatchTimeout();
  }, [addLog, addChatMessage, startNoMatchTimeout]);

  const next = useCallback(() => {
    if (!clientRef.current?.active) return;
    setPartnerAction(null);
    ignoreBackendSearchingRef.current = false; // user is explicitly searching
    resetRoom();
    setIsSearching(true);
    setNoMatchFound(false);
    clientRef.current.publish({ destination: '/app/next' });
    addChatMessage('Looking for your next chat partner...', 'system', 'SYSTEM');
    addLog('NEXT');
    startNoMatchTimeout();
  }, [addLog, addChatMessage, resetRoom, startNoMatchTimeout]);

  const sendMessage = useCallback((message: string) => {
    if (!clientRef.current?.active || !connectionState.roomId) {
      addLog('No active room.');
      return;
    }

    const messageRequest: MessageRequest = {
      roomId: connectionState.roomId,
      message
    };

    clientRef.current.publish({
      destination: '/app/message',
      body: JSON.stringify(messageRequest)
    });
  }, [connectionState.roomId, addLog]);

  useEffect(() => {
    return () => {
      clearSystemMessageTimeouts();
      if (noMatchTimeoutRef.current) {
        window.clearTimeout(noMatchTimeoutRef.current);
      }
      if (onlineCountPollRef.current) {
        window.clearInterval(onlineCountPollRef.current);
        onlineCountPollRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [clearSystemMessageTimeouts]);

  return {
    connectionState,
    chatMessages,
    logs,
    isSearching,
    noMatchFound,
    isConnecting,
    partnerAction,
    onlineCount,
    connect,
    disconnect,
    leave,
    join,
    next,
    sendMessage
  };
};
