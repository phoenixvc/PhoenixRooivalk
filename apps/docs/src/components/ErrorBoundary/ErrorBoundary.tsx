/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child component tree and displays
 * a fallback UI instead of crashing the whole app.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Component name for error reporting */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              {this.props.componentName
                ? `There was an error loading ${this.props.componentName}.`
                : "An unexpected error occurred."}
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error details</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              className="error-boundary-retry"
              onClick={this.handleRetry}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary componentName={componentName || WrappedComponent.displayName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithErrorBoundary;
}

/**
 * Minimal error boundary for analytics/non-critical features
 * Silently catches errors without showing UI
 */
export class SilentErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log silently, don't disrupt user
    console.warn("SilentErrorBoundary caught error:", error.message);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null; // Render nothing on error
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
