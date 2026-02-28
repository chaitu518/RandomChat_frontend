import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
              <circle cx="11" cy="13" r="8" fill="url(#ng)" />
              <circle cx="21" cy="19" r="8" fill="url(#ng2)" opacity="0.85" />
              <defs>
                <linearGradient id="ng" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4facfe" />
                  <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>
                <linearGradient id="ng2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a18cd1" />
                  <stop offset="100%" stopColor="#fbc2eb" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="navbar-title">RandomChat</span>
        </div>
        <div className="navbar-badge">anonymous · free · real</div>
      </div>
    </nav>
  );
};

export default Navbar;
