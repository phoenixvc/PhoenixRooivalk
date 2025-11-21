import React, { Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 *
 * This component implements React's error boundary pattern to gracefully handle
 * errors and display a fallback UI instead of crashing the entire application.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to log to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-content">
            <h2>⚠️ Something went wrong</h2>
            <p>
              We encountered an unexpected error. Please try refreshing the
              page.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReset}
                className="error-boundary-reset"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="error-boundary-reload"
              >
                Reload Page
              </button>
            </div>
          </div>

          <style jsx>{`
            .error-boundary-fallback {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 2rem;
              background: linear-gradient(135deg, #1e1e2e 0%, #0d0d15 100%);
              border-radius: 8px;
              color: #e0e0e0;
            }

            .error-boundary-content {
              max-width: 600px;
              text-align: center;
            }

            .error-boundary-content h2 {
              font-size: 1.5rem;
              margin-bottom: 1rem;
              color: #ff6b6b;
            }

            .error-boundary-content p {
              margin-bottom: 1.5rem;
              line-height: 1.6;
              color: #b0b0b0;
            }

            .error-boundary-details {
              margin: 1.5rem 0;
              text-align: left;
              background: #0a0a10;
              border: 1px solid #2a2a3a;
              border-radius: 4px;
              padding: 1rem;
            }

            .error-boundary-details summary {
              cursor: pointer;
              color: #7aa2f7;
              margin-bottom: 0.5rem;
              user-select: none;
            }

            .error-boundary-details summary:hover {
              color: #9dc1ff;
            }

            .error-boundary-stack {
              margin-top: 0.5rem;
              padding: 0.5rem;
              background: #000000;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.875rem;
              color: #ff6b6b;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-boundary-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              margin-top: 1.5rem;
            }

            .error-boundary-reset,
            .error-boundary-reload {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 4px;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .error-boundary-reset {
              background: #7aa2f7;
              color: #0d0d15;
            }

            .error-boundary-reset:hover {
              background: #9dc1ff;
              transform: translateY(-2px);
            }

            .error-boundary-reload {
              background: transparent;
              color: #7aa2f7;
              border: 1px solid #7aa2f7;
            }

            .error-boundary-reload:hover {
              background: rgba(122, 162, 247, 0.1);
              transform: translateY(-2px);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * WasmErrorFallback - Specialized error fallback for WASM component failures
 */
export const WasmErrorFallback: React.FC = () => {
  return (
    <div className="wasm-error-fallback">
      <div className="wasm-error-content">
        <h2>⚠️ Simulator Initialization Failed</h2>
        <p>The threat simulator could not be loaded. This may be due to:</p>
        <ul className="wasm-error-reasons">
          <li>Browser compatibility issues (WebAssembly not supported)</li>
          <li>Network connectivity problems</li>
          <li>Browser security settings blocking WASM execution</li>
        </ul>
        <div className="wasm-error-actions">
          <button
            onClick={() => window.location.reload()}
            className="wasm-error-reload"
          >
            Reload Page
          </button>
          <Link href="/" className="wasm-error-home">
            Return to Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        .wasm-error-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 600px;
          padding: 2rem;
          background: linear-gradient(135deg, #1e1e2e 0%, #0d0d15 100%);
          border-radius: 8px;
        }

        .wasm-error-content {
          max-width: 600px;
          text-align: center;
          color: #e0e0e0;
        }

        .wasm-error-content h2 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
          color: #ff6b6b;
        }

        .wasm-error-content p {
          margin-bottom: 1rem;
          line-height: 1.6;
          color: #b0b0b0;
        }

        .wasm-error-reasons {
          text-align: left;
          margin: 1.5rem auto;
          max-width: 400px;
          list-style: none;
          padding: 0;
        }

        .wasm-error-reasons li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          color: #9090a0;
        }

        .wasm-error-reasons li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #ff6b6b;
          font-weight: bold;
        }

        .wasm-error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .wasm-error-reload,
        .wasm-error-home {
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-block;
        }

        .wasm-error-reload {
          background: #7aa2f7;
          color: #0d0d15;
          border: none;
        }

        .wasm-error-reload:hover {
          background: #9dc1ff;
          transform: translateY(-2px);
        }

        .wasm-error-home {
          background: transparent;
          color: #7aa2f7;
          border: 1px solid #7aa2f7;
        }

        .wasm-error-home:hover {
          background: rgba(122, 162, 247, 0.1);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default ErrorBoundary;
