import React, { useState } from 'react';
import { Preference } from '../types/chat';

interface LobbyViewProps {
  onJoin: (preference: Preference) => void;
  onDisconnect: () => void;
  isSearching: boolean;
  noMatchFound: boolean;
}

const LobbyView: React.FC<LobbyViewProps> = ({
  onJoin,
  onDisconnect,
  isSearching,
  noMatchFound
}) => {
  const [preference, setPreference] = useState<Preference>('BOTH');

  return (
    <div className="lobby-view">
      <div className="lobby-card">

        {!isSearching && !noMatchFound && (
          <>
            <p className="lobby-eyebrow">Ready to connect?</p>
            <h2 className="lobby-title">Find a Chat Partner</h2>
            <p className="lobby-sub">Anonymous  kind  safe. Meet someone new in seconds.</p>

            <div className="lobby-prompts">
              <p className="lobby-prompts-label">Conversation starters</p>
              <div className="lobby-prompt-chips">
                <span className="lobby-chip">"How is your day going?"</span>
                <span className="lobby-chip">"What is on your mind?"</span>
                <span className="lobby-chip">"Tell me something good."</span>
              </div>
            </div>

            <div className="lobby-pref-section">
              <p className="lobby-pref-label">Chat with</p>
              <div className="pref-toggle">
                {(['MALE', 'FEMALE', 'BOTH'] as Preference[]).map(p => (
                  <button
                    key={p}
                    className={`pref-toggle-btn ${preference === p ? 'active' : ''}`}
                    onClick={() => setPreference(p)}
                  >
                    {p === 'MALE' ? 'Males' : p === 'FEMALE' ? 'Females' : 'Anyone'}
                  </button>
                ))}
              </div>
            </div>

            <button className="start-btn lobby-join-btn" onClick={() => onJoin(preference)}>
              <span>Find Partner</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
          </>
        )}

        {isSearching && (
          <div className="searching-state">
            <div className="search-pulse">
              <div className="pulse-ring" />
              <div className="pulse-ring pulse-ring-2" />
              <div className="pulse-core"></div>
            </div>
            <h3 className="searching-title">Finding your match...</h3>
            <p className="searching-subtitle">Hang tight, this usually takes a few seconds</p>
          </div>
        )}

        {noMatchFound && (
          <div className="no-match-state">
            <div className="no-match-icon"></div>
            <h3>No one around right now</h3>
            <p className="no-match-subtitle">Try again in a moment — someone might be waiting!</p>
            <button className="start-btn" onClick={() => onJoin(preference)} style={{ marginTop: '18px' }}>
              <span>Try Again</span>
            </button>
          </div>
        )}

        <button className="lobby-disconnect-btn" onClick={onDisconnect}>
          Leave
        </button>
      </div>
    </div>
  );
};

export default LobbyView;
