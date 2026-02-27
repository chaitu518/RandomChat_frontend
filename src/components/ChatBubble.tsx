import React from 'react';
import { ChatBubble as ChatBubbleType } from '../types/chat';

interface ChatBubbleProps {
  bubble: ChatBubbleType;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ bubble }) => {
  const senderLabel =
    bubble.type === 'me'
      ? 'You'
      : bubble.type === 'other'
        ? 'Partner'
        : bubble.sender;

  return (
    <div className={`bubble ${bubble.type}`}>
      {senderLabel && (
        <div className="meta">{senderLabel}</div>
      )}
      <div className="text">{bubble.text}</div>
    </div>
  );
};

export default ChatBubble;
