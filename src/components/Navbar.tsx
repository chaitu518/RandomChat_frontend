import React, { useState } from 'react';

type NavPage = 'home' | 'gamezone';

interface NavbarProps {
  anonId?: string | null;
  activePage?: NavPage;
  onNavigate?: (page: NavPage) => void;
}

const NAV_ITEMS: { page: NavPage; label: string; icon: React.ReactNode }[] = [
  {
    page: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    page: 'gamezone',
    label: 'Game Zone',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z" />
      </svg>
    ),
  },
];

const Navbar: React.FC<NavbarProps> = ({ anonId, activePage = 'home', onNavigate }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNav = (page: NavPage) => {
    onNavigate?.(page);
    setDrawerOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <span />
              <span />
              <span />
            </button>
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
          </div>
          <div className="navbar-badge">anonymous · free · real</div>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`drawer-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Side Drawer */}
      <aside className={`side-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Your Profile</span>
          <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {/* Navigation */}
          <nav className="drawer-nav">
            <p className="drawer-label">Navigate</p>
            {NAV_ITEMS.map(({ page, label, icon }) => (
              <button
                key={page}
                className={`drawer-nav-item ${activePage === page ? 'active' : ''}`}
                onClick={() => handleNav(page)}
              >
                <span className="drawer-nav-icon">{icon}</span>
                <span className="drawer-nav-label">{label}</span>
                {activePage === page && <span className="drawer-nav-active-dot" />}
              </button>
            ))}
          </nav>

          <div className="drawer-divider" />

          <div className="drawer-avatar">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>

          <div className="drawer-section">
            <p className="drawer-label">Anonymous ID</p>
            {anonId ? (
              <div className="drawer-anon-id">
                <span className="drawer-anon-value">{anonId}</span>
              </div>
            ) : (
              <div className="drawer-anon-id">
                <span className="drawer-anon-placeholder">Not connected yet</span>
              </div>
            )}
          </div>

          <div className="drawer-section">
            <p className="drawer-label">Session</p>
            <div className="drawer-status-row">
              <span className={`drawer-status-dot ${anonId ? 'active' : 'inactive'}`} />
              <span className="drawer-status-text">{anonId ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          <p className="drawer-note">Your identity is randomly assigned each session. No account required.</p>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
