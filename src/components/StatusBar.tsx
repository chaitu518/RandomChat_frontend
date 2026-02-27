import React from 'react';
import { ConnectionState } from '../types/chat';

interface StatusBarProps {
  connectionState: ConnectionState;
}

const StatusBar: React.FC<StatusBarProps> = ({ connectionState }) => {
  return (
    <div className="status-bar">
      <div className="status-item">
        <strong>Status:</strong>{' '}
        <span className={connectionState.connected ? 'status-connected' : 'status-disconnected'}>
          {connectionState.connected ? 'connected' : 'disconnected'}
        </span>
      </div>
      <div className="status-item">
        <strong>Session:</strong> {connectionState.sessionId || '-'}
      </div>
      <div className="status-item">
        <strong>Room:</strong> {connectionState.roomId || '-'}
      </div>
      <div className="status-item">
        <strong>Anon ID:</strong> {connectionState.anonId || '-'}
      </div>
    </div>
  );
};

export default StatusBar;
