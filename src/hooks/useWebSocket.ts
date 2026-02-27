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
  ChatBubble
} from '../types/chat';
import { WS_BROKER_URL } from '../config/env';

export const useWebSocket = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    sessionId: null,
    roomId: null,
    anonId: null
  });
  const [chatMessages, setChatMessages] = useState<ChatBubble[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [userGender, setUserGender] = useState<string>('');

  const clientRef = useRef<Client | null>(null);
  const clientIdRef = useRef<string>('');
  const anonIdRef = useRef<string | null>(null);
  const noMatchTimeoutRef = useRef<number | null>(null);
  const subscriptionsRef = useRef<{
    hello?: StompSubscription;
    match?: StompSubscription;
    room?: StompSubscription;
    system?: StompSubscription;
  }>({});

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  }, []);

  const addChatMessage = useCallback((text: string, type: 'me' | 'other' | 'system', sender?: string) => {
    setChatMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text,
      type,
      sender,
      timestamp: new Date()
    }]);
  }, []);

  const resetRoom = useCallback(() => {
    setConnectionState(prev => ({ ...prev, roomId: null }));
    setChatMessages([]);
    setIsSearching(false);
    setNoMatchFound(false);
    if (subscriptionsRef.current.room) {
      subscriptionsRef.current.room.unsubscribe();
      subscriptionsRef.current.room = undefined;
    }
  }, []);

  const connect = useCallback((gender: Gender) => {
    setUserGender(gender);
    clientIdRef.current = `client-${Math.random().toString(36).slice(2)}`;
    const client = new Client({
      brokerURL: WS_BROKER_URL,
      reconnectDelay: 0,
      debug: (str) => {
        console.log('STOMP Debug:', str);
      }
    });

    client.onConnect = () => {
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
            const roomId = matchPayload.roomId;
            setIsSearching(false);
            setNoMatchFound(false);
            setConnectionState(prev => ({ ...prev, roomId }));
            addChatMessage('Connected to chat room!', 'system', 'SYSTEM');
            if (noMatchTimeoutRef.current) {
              window.clearTimeout(noMatchTimeoutRef.current);
              noMatchTimeoutRef.current = null;
            }

            // Subscribe to room messages
            if (!subscriptionsRef.current.room) {
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
          }

          if (matchPayload.type === 'PARTNER_LEFT') {
            addChatMessage('Partner left the chat.', 'system', 'SYSTEM');
            resetRoom();
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
    };

    client.onWebSocketClose = () => {
      anonIdRef.current = null;
      setConnectionState({
        connected: false,
        sessionId: null,
        roomId: null,
        anonId: null
      });
      resetRoom();
      addLog('DISCONNECTED');
    };

    client.onStompError = (frame) => {
      addLog(`ERROR: ${frame.body}`);
    };

    client.activate();
    clientRef.current = client;
  }, [addLog, addChatMessage, resetRoom]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  const join = useCallback((preference: Preference) => {
    if (!clientRef.current || !userGender) return;
    
    const joinRequest: JoinRequest = { 
      gender: userGender as Gender,
      preference
    };
    
    setIsSearching(true);
    setNoMatchFound(false);
    
    clientRef.current.publish({
      destination: '/app/join',
      body: JSON.stringify(joinRequest)
    });
    addChatMessage('Joined queue. Waiting for match...', 'system', 'SYSTEM');
    addLog(`JOIN: ${userGender}/${preference}`);

    // Set timeout for no match found (e.g., 30 seconds)
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
  }, [addLog, addChatMessage, userGender]);

  const next = useCallback(() => {
    if (!clientRef.current) return;
    resetRoom();
    clientRef.current.publish({ destination: '/app/next' });
    addLog('NEXT');
  }, [addLog, resetRoom]);

  const sendMessage = useCallback((message: string) => {
    if (!clientRef.current || !connectionState.roomId) {
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
      if (noMatchTimeoutRef.current) {
        window.clearTimeout(noMatchTimeoutRef.current);
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  return {
    connectionState,
    chatMessages,
    logs,
    isSearching,
    noMatchFound,
    connect,
    disconnect,
    join,
    next,
    sendMessage
  };
};
