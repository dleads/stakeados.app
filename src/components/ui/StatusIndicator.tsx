'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react';

export interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'pending' | 'loading';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function StatusIndicator({
  status,
  message,
  size = 'md',
  showIcon = true,
  className,
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-stakeados-primary',
          bgColor: 'bg-stakeados-primary/10',
          borderColor: 'border-stakeados-primary/30',
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-stakeados-red',
          bgColor: 'bg-stakeados-red/10',
          borderColor: 'border-stakeados-red/30',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-stakeados-yellow',
          bgColor: 'bg-stakeados-yellow/10',
          borderColor: 'border-stakeados-yellow/30',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-stakeados-blue',
          bgColor: 'bg-stakeados-blue/10',
          borderColor: 'border-stakeados-blue/30',
        };
      case 'loading':
        return {
          icon: Loader2,
          color: 'text-stakeados-gray-400',
          bgColor: 'bg-stakeados-gray-800',
          borderColor: 'border-stakeados-gray-600',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-sm p-2',
    md: 'text-base p-3',
    lg: 'text-lg p-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-gaming border',
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            config.color,
            status === 'loading' && 'animate-spin'
          )}
        />
      )}
      {message && <span className={config.color}>{message}</span>}
    </div>
  );
}

// Connection status indicator
export function ConnectionStatus({
  isConnected,
  isConnecting,
  className,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  className?: string;
}) {
  if (isConnecting) {
    return (
      <StatusIndicator
        status="loading"
        message="Connecting..."
        size="sm"
        className={className}
      />
    );
  }

  return (
    <StatusIndicator
      status={isConnected ? 'success' : 'error'}
      message={isConnected ? 'Connected' : 'Disconnected'}
      size="sm"
      className={className}
    />
  );
}

// Sync status indicator
export function SyncStatus({
  isSyncing,
  lastSync,
  className,
}: {
  isSyncing: boolean;
  lastSync?: Date;
  className?: string;
}) {
  if (isSyncing) {
    return (
      <StatusIndicator
        status="loading"
        message="Syncing..."
        size="sm"
        className={className}
      />
    );
  }

  const message = lastSync
    ? `Last sync: ${lastSync.toLocaleTimeString()}`
    : 'Not synced';

  return (
    <StatusIndicator
      status={lastSync ? 'success' : 'warning'}
      message={message}
      size="sm"
      className={className}
    />
  );
}

// Processing status indicator
export function ProcessingStatus({
  isProcessing,
  progress,
  message,
  className,
}: {
  isProcessing: boolean;
  progress?: number;
  message?: string;
  className?: string;
}) {
  if (!isProcessing) {
    return (
      <StatusIndicator
        status="success"
        message="Complete"
        size="sm"
        className={className}
      />
    );
  }

  const progressMessage =
    progress !== undefined
      ? `${message || 'Processing'} (${Math.round(progress)}%)`
      : message || 'Processing...';

  return (
    <StatusIndicator
      status="loading"
      message={progressMessage}
      size="sm"
      className={className}
    />
  );
}

// Validation status indicator
export function ValidationStatus({
  isValid,
  isValidating,
  message,
  className,
}: {
  isValid?: boolean;
  isValidating: boolean;
  message?: string;
  className?: string;
}) {
  if (isValidating) {
    return (
      <StatusIndicator
        status="loading"
        message="Validating..."
        size="sm"
        className={className}
      />
    );
  }

  if (isValid === undefined) {
    return null;
  }

  return (
    <StatusIndicator
      status={isValid ? 'success' : 'error'}
      message={message || (isValid ? 'Valid' : 'Invalid')}
      size="sm"
      className={className}
    />
  );
}
