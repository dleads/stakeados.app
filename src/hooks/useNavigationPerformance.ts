'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface PerformanceMetrics {
  navigationStart: number;
  navigationEnd: number;
  renderStart: number;
  renderEnd: number;
  componentLoadTime: number;
  totalTime: number;
}

interface NavigationPerformanceHook {
  startNavigation: () => void;
  endNavigation: () => void;
  startRender: () => void;
  endRender: () => void;
  trackComponentLoad: (componentName: string, loadTime: number) => void;
  getMetrics: () => PerformanceMetrics | null;
  reportMetrics: () => void;
}

export function useNavigationPerformance(): NavigationPerformanceHook {
  const pathname = usePathname();
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  const componentLoadTimesRef = useRef<Record<string, number>>({});

  const startNavigation = useCallback(() => {
    const now = performance.now();
    metricsRef.current = {
      navigationStart: now,
      navigationEnd: 0,
      renderStart: 0,
      renderEnd: 0,
      componentLoadTime: 0,
      totalTime: 0,
    };
  }, []);

  const endNavigation = useCallback(() => {
    if (metricsRef.current) {
      const now = performance.now();
      metricsRef.current.navigationEnd = now;
      metricsRef.current.totalTime = now - metricsRef.current.navigationStart;
    }
  }, []);

  const startRender = useCallback(() => {
    if (metricsRef.current) {
      metricsRef.current.renderStart = performance.now();
    }
  }, []);

  const endRender = useCallback(() => {
    if (metricsRef.current) {
      metricsRef.current.renderEnd = performance.now();
    }
  }, []);

  const trackComponentLoad = useCallback((componentName: string, loadTime: number) => {
    componentLoadTimesRef.current[componentName] = loadTime;
    
    if (metricsRef.current) {
      metricsRef.current.componentLoadTime += loadTime;
    }

    // Log slow components in development
    if (process.env.NODE_ENV === 'development' && loadTime > 100) {
      console.warn(`Slow navigation component detected: ${componentName} took ${loadTime.toFixed(2)}ms to load`);
    }
  }, []);

  const getMetrics = useCallback(() => {
    return metricsRef.current;
  }, []);

  const reportMetrics = useCallback(() => {
    if (!metricsRef.current) return;

    const metrics = metricsRef.current;
    
    // Report to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'navigation_performance', {
        event_category: 'Performance',
        event_label: pathname,
        value: Math.round(metrics.totalTime),
        custom_parameter_1: Math.round(metrics.componentLoadTime),
        custom_parameter_2: Math.round(metrics.renderEnd - metrics.renderStart),
      });
    }

    // Report to custom analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/navigation-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pathname,
          metrics,
          componentLoadTimes: componentLoadTimesRef.current,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }),
      }).catch(error => {
        console.warn('Failed to report navigation performance:', error);
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Navigation Performance Report:', {
        pathname,
        totalTime: `${metrics.totalTime.toFixed(2)}ms`,
        navigationTime: `${(metrics.navigationEnd - metrics.navigationStart).toFixed(2)}ms`,
        renderTime: `${(metrics.renderEnd - metrics.renderStart).toFixed(2)}ms`,
        componentLoadTime: `${metrics.componentLoadTime.toFixed(2)}ms`,
        componentBreakdown: componentLoadTimesRef.current,
      });
    }
  }, [pathname]);

  // Auto-report metrics when navigation completes
  useEffect(() => {
    if (metricsRef.current && metricsRef.current.navigationEnd > 0) {
      // Delay reporting to ensure all components have loaded
      const timer = setTimeout(reportMetrics, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, reportMetrics]);

  // Clean up metrics on unmount
  useEffect(() => {
    return () => {
      metricsRef.current = null;
      componentLoadTimesRef.current = {};
    };
  }, []);

  return {
    startNavigation,
    endNavigation,
    startRender,
    endRender,
    trackComponentLoad,
    getMetrics,
    reportMetrics,
  };
}

// Hook for tracking individual component performance
export function useComponentPerformanceTracking(componentName: string) {
  const startTimeRef = useRef<number | null>(null);
  const { trackComponentLoad } = useNavigationPerformance();

  const startTracking = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endTracking = useCallback(() => {
    if (startTimeRef.current) {
      const loadTime = performance.now() - startTimeRef.current;
      trackComponentLoad(componentName, loadTime);
      startTimeRef.current = null;
    }
  }, [componentName, trackComponentLoad]);

  // Auto-track on mount/unmount
  useEffect(() => {
    startTracking();
    return endTracking;
  }, [startTracking, endTracking]);

  return {
    startTracking,
    endTracking,
  };
}

// Hook for monitoring bundle sizes
export function useBundlePerformance() {
  const reportBundleSize = useCallback((chunkName: string, size: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'bundle_size', {
        event_category: 'Performance',
        event_label: chunkName,
        value: size,
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Bundle size for ${chunkName}: ${(size / 1024).toFixed(2)}KB`);
    }
  }, []);

  const trackChunkLoad = useCallback((chunkName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'chunk_load', {
        event_category: 'Performance',
        event_label: chunkName,
      });
    }
  }, []);

  return {
    reportBundleSize,
    trackChunkLoad,
  };
}