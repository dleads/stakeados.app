'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ExternalLink,
  Bug,
} from 'lucide-react';
import { Button } from './button';

export interface ErrorDisplayProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'network' | 'notFound' | 'unauthorized';
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  details?: string;
  className?: string;
}

export default function ErrorDisplay({
  title,
  message,
  type = 'error',
  onRetry,
  onGoHome,
  showDetails = false,
  details,
  className,
}: ErrorDisplayProps) {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: '🌐',
          color: 'text-stakeados-blue',
          bgColor: 'bg-stakeados-blue/10',
          borderColor: 'border-stakeados-blue/30',
          defaultTitle: 'Network Error',
        };
      case 'notFound':
        return {
          icon: '🔍',
          color: 'text-stakeados-yellow',
          bgColor: 'bg-stakeados-yellow/10',
          borderColor: 'border-stakeados-yellow/30',
          defaultTitle: 'Not Found',
        };
      case 'unauthorized':
        return {
          icon: '🔒',
          color: 'text-stakeados-orange',
          bgColor: 'bg-stakeados-orange/10',
          borderColor: 'border-stakeados-orange/30',
          defaultTitle: 'Access Denied',
        };
      case 'warning':
        return {
          icon: '⚠️',
          color: 'text-stakeados-yellow',
          bgColor: 'bg-stakeados-yellow/10',
          borderColor: 'border-stakeados-yellow/30',
          defaultTitle: 'Warning',
        };
      default:
        return {
          icon: '❌',
          color: 'text-stakeados-red',
          bgColor: 'bg-stakeados-red/10',
          borderColor: 'border-stakeados-red/30',
          defaultTitle: 'Error',
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div
      className={cn(
        'card-primary border-2 text-center py-8',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Error icon */}
      <div className="text-6xl mb-4 animate-cyber-glitch">{config.icon}</div>

      {/* Error title */}
      <h3 className={cn('text-2xl font-bold mb-4', config.color)}>
        {title || config.defaultTitle}
      </h3>

      {/* Error message */}
      <p className="text-stakeados-gray-300 mb-6 max-w-md mx-auto">{message}</p>

      {/* Error details */}
      {showDetails && details && (
        <details className="mb-6 text-left max-w-md mx-auto">
          <summary className="cursor-pointer text-stakeados-gray-400 hover:text-stakeados-primary mb-2">
            <Bug className="w-4 h-4 inline mr-2" />
            Technical Details
          </summary>
          <pre className="text-xs bg-stakeados-gray-900 p-3 rounded overflow-auto text-stakeados-gray-300">
            {details}
          </pre>
        </details>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome} variant="secondary">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        )}
      </div>

      {/* Help link */}
      <div className="mt-6 text-sm text-stakeados-gray-400">
        <p>
          Need help?{' '}
          <a
            href="mailto:support@stakeados.com"
            className="text-stakeados-primary hover:text-stakeados-primary-light transition-colors inline-flex items-center gap-1"
          >
            Contact Support
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>
    </div>
  );
}

// Predefined error components
export function NetworkError({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      type="network"
      message="Unable to connect to our servers. Please check your internet connection and try again."
      onRetry={onRetry}
      onGoHome={() => (window.location.href = '/')}
      className={className}
    />
  );
}

export function NotFoundError({
  onGoHome,
  className,
}: {
  onGoHome?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      type="notFound"
      message="The page or content you're looking for doesn't exist or has been moved."
      onGoHome={onGoHome || (() => (window.location.href = '/'))}
      className={className}
    />
  );
}

export function UnauthorizedError({ className }: { className?: string }) {
  return (
    <ErrorDisplay
      type="unauthorized"
      message="You don't have permission to access this content. Please sign in or contact support."
      onGoHome={() => (window.location.href = '/login')}
      className={className}
    />
  );
}

export function GenericError({
  error,
  onRetry,
  className,
}: {
  error: Error;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      message={
        error.message || 'An unexpected error occurred. Please try again.'
      }
      onRetry={onRetry}
      onGoHome={() => (window.location.href = '/')}
      showDetails={process.env.NODE_ENV === 'development'}
      details={error.stack}
      className={className}
    />
  );
}

// Inline error component for forms and smaller areas
export function InlineError({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-stakeados-red/10 border border-stakeados-red/30 rounded-gaming text-stakeados-red',
        className
      )}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-sm">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-stakeados-red hover:text-stakeados-red/80 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
}

// Success message component
export function SuccessMessage({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming text-stakeados-primary',
        className
      )}
    >
      <div className="w-4 h-4 flex-shrink-0">✓</div>
      <span className="flex-1 text-sm">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-stakeados-primary hover:text-stakeados-primary/80 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
}
