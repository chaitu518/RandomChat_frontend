import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import StatusBar from './StatusBar';
import { ChatBubble, ConnectionState } from '../types/chat';

interface ChatRoomViewProps {
  connectionState: ConnectionState;
  chatMessages: ChatBubble[];
  onSendMessage: (message: string) => void;
  onNext: () => void;
  onDisconnect: () => void;
}

const ChatRoomView: React.FC<ChatRoomViewProps> = ({
  connectionState,
  chatMessages,
  onSendMessage,
  onNext,
  onDisconnect
}) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && message.trim()) {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-room-view">
      <div className="chat-header">
        <h2>Chat Room</h2>
        <div className="chat-actions">
          <button className="next-btn" onClick={onNext}>
            Next Chat
          </button>
          <button className="disconnect-btn" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      </div>

      <StatusBar connectionState={connectionState} />

      <div className="chat-container">
        <ChatWindow messages={chatMessages} />
      </div>

      <div className="message-input-container">
        <input
          type="text"
          className="message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <button 
          className="send-btn" 
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoomView;
