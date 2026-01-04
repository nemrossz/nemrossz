import React, { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary component to catch crashes
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare state to satisfy TypeScript
  public state: ErrorBoundaryState = { hasError: false, error: null };
  // Explicitly declare props to satisfy TypeScript
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#050505', 
          color: '#c10e6a', 
          padding: '20px', 
          fontFamily: 'monospace'
        }}>
          <h1 style={{fontSize: '24px', marginBottom: '10px'}}>Valami hiba történt! 😞</h1>
          <p style={{color: 'white', marginBottom: '20px'}}>Az alkalmazás váratlanul leállt.</p>
          <pre style={{
            backgroundColor: '#18181b', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #333', 
            maxWidth: '800px', 
            overflow: 'auto', 
            color: '#e5e5e5'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Újratöltés
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
            <App />
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}