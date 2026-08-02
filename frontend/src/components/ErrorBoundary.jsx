import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#fff'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '32px', border: '1px solid var(--accent-primary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>Dashboard Error</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              An error occurred while loading this dashboard view: <br />
              <code style={{ fontSize: '0.8rem', color: 'var(--color-absent)', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px', marginTop: '8px', display: 'inline-block' }}>
                {this.state.error?.message || 'Unknown render error'}
              </code>
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Re-login to Teacher Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
