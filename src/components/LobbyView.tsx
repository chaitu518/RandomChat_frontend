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

  const handleJoin = () => {
    onJoin(preference);
  };

  return (
    <div className="lobby-view">
      <div className="lobby-card">
        <h2>Find a Chat Partner</h2>
        
        {!isSearching && !noMatchFound && (
          <>
            <p className="lobby-subtitle">Choose who you'd like to chat with</p>
            
            <div className="preference-section">
              <h3>Chat Preference</h3>
              <div className="preference-selection">
                <label className={`preference-option ${preference === 'MALE' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="preference"
                    value="MALE"
                    checked={preference === 'MALE'}
                    onChange={(e) => setPreference(e.target.value as Preference)}
                  />
                  <span className="preference-label">Male</span>
                </label>
                
                <label className={`preference-option ${preference === 'FEMALE' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="preference"
                    value="FEMALE"
                    checked={preference === 'FEMALE'}
                    onChange={(e) => setPreference(e.target.value as Preference)}
                  />
                  <span className="preference-label">Female</span>
                </label>
                
                <label className={`preference-option ${preference === 'BOTH' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="preference"
                    value="BOTH"
                    checked={preference === 'BOTH'}
                    onChange={(e) => setPreference(e.target.value as Preference)}
                  />
                  <span className="preference-label">Both</span>
                </label>
              </div>
            </div>

            <button className="join-btn" onClick={handleJoin}>
              Join Chat
            </button>
          </>
        )}

        {isSearching && (
          <div className="searching-state">
            <div className="spinner"></div>
            <p>You joined the chat queue. Waiting for match...</p>
            <p className="searching-subtitle">This may take a few moments</p>
          </div>
        )}

        {noMatchFound && (
          <div className="no-match-state">
            <div className="no-match-icon">😞</div>
            <h3>No Match Found</h3>
            <p>We couldn't find a chat partner at the moment.</p>
            <p className="no-match-subtitle">Please try again in a few moments.</p>
            <button className="retry-btn" onClick={handleJoin}>
              Try Again
            </button>
          </div>
        )}

        <button className="disconnect-btn" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default LobbyView;
