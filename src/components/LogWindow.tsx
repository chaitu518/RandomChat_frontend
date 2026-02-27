import React, { useEffect, useRef } from 'react';

interface LogWindowProps {
  logs: string[];
}

const LogWindow: React.FC<LogWindowProps> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="log-window">
      {logs.map((log, index) => (
        <div key={index}>{log}</div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
};

export default LogWindow;
