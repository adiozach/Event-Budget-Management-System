import React from 'react';

// Catches render errors so a single broken component shows a friendly
// message instead of a blank white screen.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40 }}>
          <div className="panel" style={{ maxWidth: 560 }}>
            <h2 style={{ color: '#f87171', marginTop: 0 }}>Something went wrong</h2>
            <p className="muted">{String(this.state.error?.message || this.state.error)}</p>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <button className="btn btn-primary" onClick={() => { this.setState({ error: null }); }}>Try again</button>
              <button className="btn" onClick={() => window.location.reload()}>Reload app</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
