'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { errorHandler } from '@/lib/errors/ErrorHandler';
import { AdminErrorCodes } from '@/lib/errors/AdminErrorCodes';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to monitoring system
    const adminError = errorHandler.handleError(error, {
      operation: 'component_error',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorId: this.state.errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      // Create a detailed error report
      const errorReport = {
        errorId: this.state.errorId,
        message: this.state.error.message,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      // Send error report (you can implement this based on your error reporting service)
      console.log('Error Report:', errorReport);

      // You could also copy to clipboard or open email client
      navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2));
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred in the admin interface.
                {this.state.errorId && (
                  <span className="block mt-1 font-mono text-xs">
                    Error ID: {this.state.errorId}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong>{' '}
                  {this.state.error?.message || 'Unknown error'}
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' &&
                this.state.error?.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground mb-2">
                      Show technical details
                    </summary>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40 mt-2">
                        Component Stack:{this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </details>
                )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/admin')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleReportError}
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Report Error
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>
                  If this problem persists, please contact the system
                  administrator.
                </p>
                <p>
                  The error has been automatically logged for investigation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <AdminErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AdminErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for error boundary context
export function useErrorHandler() {
  return {
    handleError: (error: Error, context?: Record<string, any>) => {
      return errorHandler.handleError(error, context);
    },
    createRetryAction: (operation: () => Promise<void>, label?: string) => {
      return errorHandler.createRetryAction(operation, label);
    },
  };
}
