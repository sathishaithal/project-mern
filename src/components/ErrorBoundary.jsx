import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // appError is flag-gated in appConfig; safe to import here but keep lightweight
    if (typeof window !== 'undefined') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = 'This section' } = this.props;
    const dark = localStorage.getItem('themeMode') === 'dark';

    return (
      <div style={{
        margin: '2rem auto', maxWidth: 480, padding: '2rem',
        borderRadius: 12,
        background: dark ? '#1e1215' : '#fff5f5',
        border: `1px solid ${dark ? '#7f1d1d' : '#fecaca'}`,
        textAlign: 'center', fontFamily: 'inherit',
      }}>
        <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '2rem', color: '#ef4444', display: 'block', marginBottom: '0.75rem' }} />
        <div style={{ fontWeight: 700, color: dark ? '#fca5a5' : '#991b1b', marginBottom: '0.4rem' }}>
          {label} encountered an error
        </div>
        <div style={{ fontSize: '0.8rem', color: dark ? '#f87171' : '#b91c1c', marginBottom: '1.25rem', wordBreak: 'break-word' }}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </div>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{
            background: '#ef4444', color: 'white', border: 'none',
            borderRadius: 7, padding: '0.45rem 1.2rem',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <i className="bi bi-arrow-clockwise" style={{ marginRight: 5 }} />
          Try again
        </button>
      </div>
    );
  }
}
