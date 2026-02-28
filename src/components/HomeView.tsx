import React, { useState } from 'react';
import { Gender } from '../types/chat';

interface HomeViewProps {
  onConnect: (gender: Gender) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onConnect }) => {
  const [gender, setGender] = useState<Gender>('MALE');

  return (
    <div className="home-view">
      <div className="home-hero">
        <h1 className="home-headline">
          Meet someone<br />
          <span className="home-headline-gradient">new, right now.</span>
        </h1>
        <p className="home-sub">
          Anonymous one-on-one chats — no account, no history, no judgement.
        </p>
      </div>

      <div className="home-features">
        <div className="home-feature-pill"> Instant match</div>
        <div className="home-feature-pill"> 100% anonymous</div>
        <div className="home-feature-pill"> Free to talk</div>
      </div>

      <div className="home-card">
        <p className="home-card-label">I am</p>
        <div className="gender-toggle">
          <button
            className={`gender-toggle-btn ${gender === 'MALE' ? 'active' : ''}`}
            onClick={() => setGender('MALE')}
          >
            Male
          </button>
          <button
            className={`gender-toggle-btn ${gender === 'FEMALE' ? 'active' : ''}`}
            onClick={() => setGender('FEMALE')}
          >
            Female
          </button>
        </div>

        <button className="start-btn" onClick={() => onConnect(gender)}>
          <span>Start Chatting</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>

        <p className="home-safety-note">
          Never share personal info. Use Next or Disconnect if anything feels off.
        </p>
      </div>
    </div>
  );
};

export default HomeView;
