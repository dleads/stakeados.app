'use client';

import React, { Suspense, ComponentType, useEffect, useState } from 'react';
import { useComponentPerformance } from '../performance/NavigationPerformanceProvider';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName: string;
  preloadOnHover?: boolean;
  preloadDelay?: number;
}

/**
 * Wrapper component for lazy-loaded navigation components
 * Provides loading states, error boundaries, and performance tracking
 */
export function LazyWrapper({
  children,
  fallback = <div className="animate-pulse bg-gray-200 h-8 w-24 rounded" />,
  componentName,
  preloadOnHover = false,
  preloadDelay = 200,
}: LazyWrapperProps) {
  const { startTracking, endTracking } = useComponentPerformance(componentName);
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    startTracking();
    return () => {
      endTracking();
    };
  }, [startTracking, endTracking]);

  const handlePreload = () => {
    if (!isPreloaded && preloadOnHover) {
      setTimeout(() => {
        setIsPreloaded(true);
      }, preloadDelay);
    }
  };

  return (
    <div
      onMouseEnter={handlePreload}
      onFocus={handlePreload}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}

/**
 * Higher-order component for creating lazy-loaded navigation components
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  componentName: string,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <LazyWrapper
        componentName={componentName}
        fallback={fallback}
        preloadOnHover={true}
      >
        <Component {...props} ref={ref} />
      </LazyWrapper>
    );
  });

  LazyComponent.displayName = `LazyLoaded(${componentName})`;
  
  return LazyComponent;
}

/**
 * Skeleton components for navigation loading states
 */
export const NavigationSkeletons = {
  UserMenu: () => (
    <div className="flex items-center space-x-2">
      <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full" />
      <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />
    </div>
  ),
  
  MobileMenu: () => (
    <div className="animate-pulse bg-gray-200 h-6 w-6 rounded" />
  ),
  
  SearchInterface: () => (
    <div className="animate-pulse bg-gray-200 h-10 w-64 rounded-md" />
  ),
  
  NavigationLinks: () => (
    <div className="flex space-x-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-4 w-20 rounded" />
      ))}
    </div>
  ),
  
  Breadcrumbs: () => (
    <div className="flex items-center space-x-2">
      <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />
      <div className="animate-pulse bg-gray-200 h-4 w-2 rounded" />
      <div className="animate-pulse bg-gray-200 h-4 w-20 rounded" />
      <div className="animate-pulse bg-gray-200 h-4 w-2 rounded" />
      <div className="animate-pulse bg-gray-200 h-4 w-24 rounded" />
    </div>
  ),
};

/**
 * Error boundary for lazy-loaded components
 */
interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; componentName: string },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode; componentName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in lazy-loaded component ${this.props.componentName}:`, error, errorInfo);
    
    // Track error for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `Lazy load error: ${this.props.componentName}`,
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-red-500 text-sm">
          Failed to load {this.props.componentName}
        </div>
      );
    }

    return this.props.children;
  }
}