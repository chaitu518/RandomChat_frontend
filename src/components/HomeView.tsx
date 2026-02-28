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
        <p className="subtitle">Meet someone new, talk openly, and share your burden without revealing your identity.</p>

        <div className="benefits-grid">
          <div className="benefit-item">
            <h4>Meet Someone New</h4>
            <p>Get matched instantly with a random person for a fresh conversation.</p>
          </div>
          <div className="benefit-item">
            <h4>Share Your Burden</h4>
            <p>Sometimes talking to a stranger can help you feel lighter and heard.</p>
          </div>
        </div>

        <div className="happening-card">
          <h3>What is about to happen?</h3>
          <p>After you connect, you will enter the queue and be paired in a private anonymous chat room.</p>
        </div>

        <div className="warning-card">
          <h3>⚠ Safety & Caution</h3>
          <ul className="warning-list">
            <li>Use respectful and appropriate language at all times.</li>
            <li>Do not share personal details like phone, email, or address.</li>
            <li>If a chat feels unsafe, use Next or Disconnect immediately.</li>
            <li>Harassment, hate speech, and explicit content are not allowed.</li>
          </ul>
          <p className="warning-note">By continuing, you agree to follow these safety rules.</p>
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
