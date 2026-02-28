import React from 'react';
import { ChatBubble as ChatBubbleType } from '../types/chat';

interface ChatBubbleProps {
  bubble: ChatBubbleType;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ bubble }) => {
  if (bubble.type === 'system') {
    return (
      <div className="bubble-system">
        {bubble.text}
      </div>
    );
  }

  const isMe = bubble.type === 'me';
  const time = new Date(bubble.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`bubble-wrapper ${isMe ? 'bubble-wrapper-me' : 'bubble-wrapper-other'}`}>
      {!isMe && <div className="bubble-avatar">S</div>}
      <div className={`bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
        <div className="bubble-text">{bubble.text}</div>
        <div className="bubble-time">{time}</div>
      </div>
    </div>
  );
};

export default ChatBubble;
