import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import HomeView from '../components/HomeView';
import LobbyView from '../components/LobbyView';
import ChatRoomView from '../components/ChatRoomView';
import { Gender, Preference } from '../types/chat';
import '../styles/ChatPage.css';

const ChatPage: React.FC = () => {
  const {
    connectionState,
    chatMessages,
    isSearching,
    noMatchFound,
    connect,
    disconnect,
    join,
    next,
    sendMessage
  } = useWebSocket();

  const handleConnect = (gender: Gender) => {
    connect(gender);
  };

  const handleJoin = (preference: Preference) => {
    join(preference);
  };

  // Determine which view to show
  const getCurrentView = () => {
    // Home view - not connected
    if (!connectionState.connected) {
      return <HomeView onConnect={handleConnect} />;
    }
    
    // Chat room view - connected and in a room
    if (connectionState.roomId) {
      return (
        <ChatRoomView
          connectionState={connectionState}
          chatMessages={chatMessages}
          onSendMessage={sendMessage}
          onNext={next}
          onDisconnect={disconnect}
        />
      );
    }
    
    // Lobby view - connected but not in a room
    return (
      <LobbyView
        onJoin={handleJoin}
        onDisconnect={disconnect}
        isSearching={isSearching}
        noMatchFound={noMatchFound}
      />
    );
  };

  return (
    <div className="chat-page">
      {getCurrentView()}
    </div>
  );
};

export default ChatPage;
