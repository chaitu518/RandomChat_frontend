import React from 'react';
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
    connect,
    disconnect,
    join,
    next,
    sendMessage
  } = useWebSocket();

  const inChatRoom = connectionState.connected && !!connectionState.roomId;

  return (
    <div className="chat-page">
      {!inChatRoom && <Navbar />}
      {!connectionState.connected && (
        <HomeView onConnect={(gender: Gender) => connect(gender)} />
      )}
      {connectionState.connected && connectionState.roomId && (
        <ChatRoomView
          connectionState={connectionState}
          chatMessages={chatMessages}
          onSendMessage={sendMessage}
          onNext={next}
          onDisconnect={disconnect}
        />
      )}
      {connectionState.connected && !connectionState.roomId && (
        <LobbyView
          onJoin={(preference: Preference) => join(preference)}
          onDisconnect={disconnect}
          isSearching={isSearching}
          noMatchFound={noMatchFound}
        />
      )}
    </div>
  );
};

export default ChatPage;
