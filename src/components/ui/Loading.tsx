'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  text?: string;
  className?: string;
}

const loadingSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export default function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  className,
}: LoadingProps) {
  if (variant === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)}>
        <Loader2
          className={cn(
            'animate-spin text-stakeados-primary',
            loadingSizes[size]
          )}
        />
        {text && <span className="text-stakeados-gray-300">{text}</span>}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)}>
        <div className="flex space-x-1">
          <div
            className="w-2 h-2 bg-stakeados-primary rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-2 h-2 bg-stakeados-primary rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-2 h-2 bg-stakeados-primary rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        {text && <span className="text-stakeados-gray-300">{text}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)}>
        <div
          className={cn(
            'bg-stakeados-primary rounded-full animate-pulse',
            loadingSizes[size]
          )}
        />
        {text && <span className="text-stakeados-gray-300">{text}</span>}
      </div>
    );
  }

  // Skeleton variant
  return (
    <div className={cn('space-y-3', className)}>
      <div className="h-4 bg-stakeados-gray-600 rounded animate-pulse" />
      <div className="h-4 bg-stakeados-gray-600 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-stakeados-gray-600 rounded animate-pulse w-1/2" />
    </div>
  );
}

// Full page loading component
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto" />
          <div
            className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-stakeados-blue rounded-full animate-spin mx-auto"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          />
        </div>

        <h2 className="text-2xl font-bold text-neon mb-4">
          {message}
          <span className="loading-dots"></span>
        </h2>

        <p className="text-stakeados-gray-300 text-lg">
          Preparing your Web3 learning experience
        </p>
      </div>
    </div>
  );
}

// Skeleton components
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-stakeados-gray-800 rounded-gaming p-6 animate-pulse',
        className
      )}
    >
      <div className="h-6 bg-stakeados-gray-600 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-stakeados-gray-600 rounded" />
        <div className="h-4 bg-stakeados-gray-600 rounded w-3/4" />
        <div className="h-4 bg-stakeados-gray-600 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-stakeados-gray-600 rounded animate-pulse',
            i === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  );
}
