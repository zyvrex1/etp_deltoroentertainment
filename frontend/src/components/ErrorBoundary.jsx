import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#e74c3c' }}>Something went wrong.</h2>
          <p>The application encountered an unexpected error.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
          >
            Refresh Page
          </button>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', textAlign: 'left', background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
