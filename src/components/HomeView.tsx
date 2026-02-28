import React, { useState } from 'react';
import { Gender } from '../types/chat';

interface HomeViewProps {
  onConnect: (gender: Gender) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onConnect }) => {
  const [gender, setGender] = useState<Gender>('MALE');

  const handleConnect = () => {
    onConnect(gender);
  };

  return (
    <div className="home-view">
      <div className="welcome-card">
        <p className="hero-tag">Anonymous • Safe • Supportive</p>
        <h1>Welcome to RandomChat</h1>
        <p className="subtitle">Meet someone new in a calm anonymous chat. Share what’s on your mind and feel a little lighter.</p>

        <p className="home-friendly-note">You’ll be matched with a random partner in seconds. Be kind, stay respectful, and take your time.</p>

        <div className="warning-card">
          <h3>⚠ Quick Safety Note</h3>
          <ul className="warning-list">
            <li>Don’t share personal details like phone, email, or address.</li>
            <li>If a chat feels uncomfortable, use Next or Disconnect right away.</li>
          </ul>
          <p className="warning-note">Keep it friendly and safe for everyone.</p>
        </div>
        
        <div className="connect-section">
          <h3>Select Your Gender</h3>
          <div className="gender-selection">
            <label className={`gender-option ${gender === 'MALE' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="gender"
                value="MALE"
                checked={gender === 'MALE'}
                onChange={(e) => setGender(e.target.value as Gender)}
              />
              <span className="gender-label">Male</span>
            </label>
            
            <label className={`gender-option ${gender === 'FEMALE' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="gender"
                value="FEMALE"
                checked={gender === 'FEMALE'}
                onChange={(e) => setGender(e.target.value as Gender)}
              />
              <span className="gender-label">Female</span>
            </label>
          </div>
          
          <button className="connect-btn" onClick={handleConnect}>
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
