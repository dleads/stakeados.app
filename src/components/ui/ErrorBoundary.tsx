'use client';

import React from 'react';
import { RefreshCw, Home } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo || undefined}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({
  error,
  resetError,
  errorInfo,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Error icon with glitch effect */}
        <div className="text-6xl mb-6 animate-cyber-glitch">⚠️</div>

        {/* Error title */}
        <h1 className="text-4xl font-bold text-stakeados-red mb-6">
          System Error
        </h1>

        {/* Error message */}
        <div className="notification-error mb-8">
          <h2 className="font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm opacity-90">
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-stakeados-yellow hover:text-stakeados-yellow/80">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-stakeados-gray-900 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\nStack Trace:\n'}
                    {error.stack}
                  </>
                )}
                {errorInfo && (
                  <>
                    {'\n\nComponent Stack:\n'}
                    {errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={resetError} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="secondary"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Additional help */}
        <div className="mt-8 text-sm text-stakeados-gray-400">
          <p>Error ID: {error.name || 'Unknown'}</p>
          <p className="mt-2">
            Need help? Contact{' '}
            <a
              href="mailto:support@stakeados.com"
              className="text-stakeados-primary hover:text-stakeados-primary-light transition-colors"
            >
              support@stakeados.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Specific error fallback components
export function NetworkErrorFallback({
  resetError,
}: {
  resetError: () => void;
}) {
  return (
    <div className="card-gaming text-center py-12">
      <div className="text-4xl mb-4">🌐</div>
      <h3 className="text-xl font-bold text-stakeados-red mb-4">
        Network Error
      </h3>
      <p className="text-stakeados-gray-300 mb-6">
        Unable to connect to our servers. Please check your internet connection.
      </p>
      <Button onClick={resetError} variant="default">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

export function NotFoundFallback() {
  return (
    <div className="card-gaming text-center py-12">
      <div className="text-4xl mb-4">🔍</div>
      <h3 className="text-xl font-bold text-stakeados-yellow mb-4">
        Content Not Found
      </h3>
      <p className="text-stakeados-gray-300 mb-6">
        The content you're looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => (window.location.href = '/')} variant="default">
        <Home className="w-4 h-4 mr-2" />
        Go Home
      </Button>
    </div>
  );
}

export function UnauthorizedFallback() {
  return (
    <div className="card-gaming text-center py-12">
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="text-xl font-bold text-stakeados-orange mb-4">
        Access Denied
      </h3>
      <p className="text-stakeados-gray-300 mb-6">
        You don't have permission to access this content.
      </p>
      <Button
        onClick={() => (window.location.href = '/login')}
        variant="default"
      >
        Sign In
      </Button>
    </div>
  );
}

// Hook for error handling
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);

    // Here you could integrate with error reporting services
    // like Sentry, LogRocket, etc.
  };

  return { handleError };
}
