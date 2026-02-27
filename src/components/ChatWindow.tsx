import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import { ChatBubble as ChatBubbleType } from '../types/chat';

interface ChatWindowProps {
  messages: ChatBubbleType[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map(message => (
        <ChatBubble key={message.id} bubble={message} />
      ))}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;
