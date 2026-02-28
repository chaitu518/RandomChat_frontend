import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { ChatBubble, ConnectionState } from '../types/chat';

interface ChatRoomViewProps {
  connectionState: ConnectionState;
  chatMessages: ChatBubble[];
  onSendMessage: (message: string) => void;
  onNext: () => void;
  onDisconnect: () => void;
}

const ChatRoomView: React.FC<ChatRoomViewProps> = ({
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-room-view">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">A</div>
          <div className="chat-header-info">
            <span className="chat-header-name">Anonymous</span>
            <span className="chat-header-status">
              <span className="status-dot" />
              Connected
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="header-next-btn" onClick={onNext}>
            Next
          </button>
          <button className="header-leave-btn" onClick={onDisconnect}>
            Leave
          </button>
        </div>
      </div>

      <div className="chat-container">
        <ChatWindow messages={chatMessages} />
      </div>

      <div className="message-input-container">
        <input
          type="text"
          className="message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          autoComplete="off"
        />
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!message.trim()}
          aria-label="Send"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatRoomView;
