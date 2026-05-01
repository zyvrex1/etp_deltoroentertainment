import React from 'react';
import './ErrorBoundary.css';
import { Icon } from '@iconify/react';

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
        <div className="error-boundary-wrapper">
          <img src="/logo/Logo1.png" alt="Company Logo" className="error-boundary-logo" />
          
          <img 
            src="/Computer troubleshooting-pana.svg" 
            alt="Troubleshooting" 
            className="error-boundary-image" 
          />

          <div className="error-boundary-content">
            <h1>Oops! Something went wrong</h1>
            <p className="regular-body-text">
              The application encountered an unexpected error. Don't worry, our team has been notified. 
              In the meantime, you can try refreshing the page.
            </p>
            
            <div className="error-boundary-actions">
              <button 
                className="primary-button"
                onClick={() => window.location.reload()} 
              >
                <Icon icon="mdi:refresh" style={{ marginRight: '8px' }} />
                Refresh Page
              </button>
              
              <button 
                className="outlined-button"
                onClick={() => window.location.href = '/'} 
              style={{color:'var(--color-black-primary)'}}>
                Return Home
              </button>
            </div>
          </div>

          {/* <div className="error-details-container">
            <details>
              <summary className="error-details-summary">
                <Icon icon="mdi:chevron-down" />
                Technical Details (For support)
              </summary>
              <div className="error-details-content">
                <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                <br /><br />
                <strong>Stack Trace:</strong>
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>
            </details>
          </div> */}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
