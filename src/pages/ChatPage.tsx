import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import HomeView from '../components/HomeView';
import LobbyView from '../components/LobbyView';
import ChatRoomView from '../components/ChatRoomView';
import Navbar from '../components/Navbar';
import { Gender, Preference } from '../types/chat';
import '../styles/ChatPage.css';

const ChatPage: React.FC = () => {
  const {
    connectionState,
    chatMessages,
    isSearching,
    noMatchFound,
    partnerAction,
    onlineCount,
    connect,
    leave,
    join,
    next,
    sendMessage
  } = useWebSocket();

  const [inLobby, setInLobby] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender>('MALE');
  // Refs so effects always read the latest values without stale closures
  const selectedGenderRef = React.useRef<Gender>('MALE');
  const lastPreferenceRef = React.useRef<Preference>('BOTH');

  // Eagerly establish WebSocket connection as soon as the page loads,
  // so by the time the user clicks "Start Chatting" it's already ready.
  useEffect(() => {
    connect();
  }, []);

  const handleStartChatting = (gender: Gender) => {
    setSelectedGender(gender);
    selectedGenderRef.current = gender;
    setInLobby(true);
  };

  // Leave from chat room — notify backend + clear room, WS stays alive
  const handleLeaveRoom = () => {
    leave();
    setInLobby(false);
  };

  // Next — stay in lobby with searching state
  const handleNext = () => {
    next();
  };

  // Leave from lobby — just go back to home, WS stays alive
  const handleLeaveLobby = () => {
    setInLobby(false);
  };

  // React to partner disconnect events
  useEffect(() => {
    if (!partnerAction) return;

    if (partnerAction === 'left') {
      // Partner clicked Leave → auto-search so partner B stays in searching lobby
      setInLobby(true);
      join(lastPreferenceRef.current, selectedGenderRef.current);
    } else if (partnerAction === 'next') {
      // Partner clicked Next → show Find Partner lobby, let B decide manually
      setInLobby(true);
    }
  }, [partnerAction]);

  // Keep inLobby in sync: if WS drops entirely, go home
  useEffect(() => {
    if (!connectionState.connected && inLobby) {
      setInLobby(false);
    }
  }, [connectionState.connected]);

  const inChatRoom = connectionState.connected && !!connectionState.roomId;
  const showLobby = inLobby && !connectionState.roomId;

  return (
    <div className="chat-page">
      {!inChatRoom && <Navbar anonId={connectionState.anonId} />}
      {!inLobby && !inChatRoom && (
        <HomeView
          onConnect={handleStartChatting}
          onlineCount={onlineCount}
          isConnected={connectionState.connected}
        />
      )}
      {inChatRoom && (
        <ChatRoomView
          connectionState={connectionState}
          chatMessages={chatMessages}
          onSendMessage={sendMessage}
          onNext={handleNext}
          onDisconnect={handleLeaveRoom}
        />
      )}
      {showLobby && (
        <LobbyView
          onJoin={(preference: Preference) => {
            lastPreferenceRef.current = preference;
            join(preference, selectedGender);
          }}
          onDisconnect={handleLeaveLobby}
          isSearching={isSearching}
          noMatchFound={noMatchFound}
          isConnected={connectionState.connected}
        />
      )}
    </div>
  );
};

export default ChatPage;
