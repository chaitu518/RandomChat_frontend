import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import { ChatBubble as ChatBubbleType } from '../types/chat';

interface ChatWindowProps {
  messages: ChatBubbleType[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const handleScroll = () => {
    const container = chatWindowRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="chat-window" ref={chatWindowRef} onScroll={handleScroll}>
      {messages.map(message => (
        <ChatBubble key={message.id} bubble={message} />
      ))}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;
