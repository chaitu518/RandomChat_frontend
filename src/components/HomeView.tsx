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
        <h1>Welcome to RandomChat</h1>
        <p className="subtitle">Connect with random people anonymously</p>
        
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
