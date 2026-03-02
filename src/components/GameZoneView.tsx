import React, { useState } from 'react';
import FloppyBird from '../games/floppy-bird/FloppyBird';

type GameId = 'floppybird' | 'tictactoe' | 'rps' | 'wordguess' | 'quiz';

interface GameZoneViewProps {
  onBack: () => void;
}

interface GameEntry {
  id: GameId;
  icon: string;
  name: string;
  desc: string;
  color: string;
  ready: boolean;
}

const GAMES: GameEntry[] = [
  {
    id: 'floppybird',
    icon: '🪽',
    name: 'Floppy Bird',
    desc: 'Dodge neon gates — tap to flap!',
    color: '#a78bfa',
    ready: true,
  },
  {
    id: 'tictactoe',
    icon: '⭕',
    name: 'Tic Tac Toe',
    desc: 'Classic 3×3 — you vs computer',
    color: '#4facfe',
    ready: false,
  },
  {
    id: 'rps',
    icon: '✊',
    name: 'Rock Paper Scissors',
    desc: 'Best of three vs computer',
    color: '#a18cd1',
    ready: false,
  },
  {
    id: 'wordguess',
    icon: '🔤',
    name: 'Word Guess',
    desc: 'Guess the hidden word letter by letter',
    color: '#f7971e',
    ready: false,
  },
];

const GameZoneView: React.FC<GameZoneViewProps> = ({ onBack }) => {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  // ── If a game is active, render it full-screen ───────────────────────────
  if (activeGame === 'floppybird') {
    return <FloppyBird onBack={() => setActiveGame(null)} />;
  }

  // ── Game grid ────────────────────────────────────────────────────────────
  return (
    <div className="gz-view">
      <div className="gz-header">
        <button className="gz-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
          </svg>
          Back to Home
        </button>
        <div className="gz-title-block">
          <h1 className="gz-title">🎮 Game Zone</h1>
          <p className="gz-subtitle">No people around? No problem — pick a game and chill.</p>
        </div>
      </div>

      <div className="gz-grid">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`gz-card ${!game.ready ? 'gz-card-soon' : ''}`}
            style={{ '--gz-accent': game.color } as React.CSSProperties}
          >
            <div className="gz-card-icon">{game.icon}</div>
            <div className="gz-card-body">
              <h3 className="gz-card-name">{game.name}</h3>
              <p className="gz-card-desc">{game.desc}</p>
            </div>
            {game.ready ? (
              <button className="gz-play-btn" onClick={() => setActiveGame(game.id)}>
                Play Now
              </button>
            ) : (
              <span className="gz-soon-badge">Coming Soon</span>
            )}
          </div>
        ))}
      </div>

      <p className="gz-coming-soon">More games dropping soon ✨</p>
    </div>
  );
};

export default GameZoneView;
