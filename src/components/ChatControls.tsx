import React, { useState } from 'react';
import { Gender, Preference } from '../types/chat';

interface ChatControlsProps {
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onJoin: (gender: Gender, preference: Preference) => void;
  onNext: () => void;
  onSendMessage: (message: string) => void;
}

const ChatControls: React.FC<ChatControlsProps> = ({
  connected,
  onConnect,
  onDisconnect,
  onJoin,
  onNext,
  onSendMessage
}) => {
  const [gender, setGender] = useState<Gender>('MALE');
  const [preference, setPreference] = useState<Preference>('BOTH');
  const [message, setMessage] = useState('');

  const handleJoin = () => {
    onJoin(gender, preference);
  };

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
    <div className="chat-controls">
      <div className="control-row">
        <label>Gender:</label>
        <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
          <option value="MALE">MALE</option>
          <option value="FEMALE">FEMALE</option>
        </select>
        
        <label>Preference:</label>
        <select value={preference} onChange={(e) => setPreference(e.target.value as Preference)}>
          <option value="MALE">MALE</option>
          <option value="FEMALE">FEMALE</option>
          <option value="BOTH">BOTH</option>
        </select>
      </div>

      <div className="control-row">
        <button onClick={onConnect} disabled={connected}>
          Connect
        </button>
        <button onClick={onDisconnect} disabled={!connected}>
          Disconnect
        </button>
        <button onClick={handleJoin} disabled={!connected}>
          Join
        </button>
        <button onClick={onNext} disabled={!connected}>
          Next
        </button>
      </div>

      <div className="control-row">
        <label>Message:</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Say hi"
          disabled={!connected}
        />
        <button onClick={handleSendMessage} disabled={!connected || !message.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatControls;
