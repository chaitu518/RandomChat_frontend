import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const isDev = import.meta.env.DEV;

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RandomChat crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="rgba(255,255,255,0.3)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Something went wrong</h2>

          {isDev && this.state.error && (
            <pre style={{
              background: 'rgba(255,0,0,0.15)',
              border: '1px solid rgba(255,80,80,0.4)',
              borderRadius: '10px',
              padding: '14px 18px',
              maxWidth: '640px',
              width: '100%',
              textAlign: 'left',
              fontSize: '0.78rem',
              color: '#ff8a8a',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowY: 'auto',
              maxHeight: '240px',
            }}>
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          )}

          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', maxWidth: '320px' }}>
            The app ran into an unexpected error. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '8px',
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

