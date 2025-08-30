'use client';

import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationPerformanceMetrics {
  navigationStartTime: number;
  navigationEndTime: number;
  renderTime: number;
  componentLoadTime: number;
  totalNavigationTime: number;
}

interface NavigationAnalyticsEvent {
  type: 'navigation' | 'component_load' | 'user_interaction' | 'performance';
  timestamp: number;
  data: Record<string, any>;
  pathname: string;
  userAgent?: string;
}

interface NavigationPerformanceContextType {
  // Performance tracking
  startNavigation: (destination: string) => void;
  endNavigation: () => void;
  trackComponentLoad: (componentName: string, loadTime: number) => void;
  trackUserInteraction: (action: string, target: string, metadata?: Record<string, any>) => void;
  
  // Analytics
  getMetrics: () => NavigationPerformanceMetrics | null;
  getAnalyticsEvents: () => NavigationAnalyticsEvent[];
  clearMetrics: () => void;
  
  // Performance optimization
  shouldPreload: (componentName: string) => boolean;
  markComponentAsLoaded: (componentName: string) => void;
}

const NavigationPerformanceContext = createContext<NavigationPerformanceContextType | undefined>(undefined);

export function useNavigationPerformance() {
  const context = useContext(NavigationPerformanceContext);
  if (!context) {
    throw new Error('useNavigationPerformance must be used within NavigationPerformanceProvider');
  }
  return context;
}

interface NavigationPerformanceProviderProps {
  children: React.ReactNode;
  enableAnalytics?: boolean;
  enablePerformanceTracking?: boolean;
}

export function NavigationPerformanceProvider({
  children,
  enableAnalytics = true,
  enablePerformanceTracking = true,
}: NavigationPerformanceProviderProps) {
  const pathname = usePathname();
  const metricsRef = useRef<NavigationPerformanceMetrics | null>(null);
  const analyticsEventsRef = useRef<NavigationAnalyticsEvent[]>([]);
  const loadedComponentsRef = useRef<Set<string>>(new Set());
  const navigationStartRef = useRef<number | null>(null);

  // Track route changes for performance
  useEffect(() => {
    if (enablePerformanceTracking) {
      const navigationEnd = performance.now();
      if (navigationStartRef.current) {
        const totalTime = navigationEnd - navigationStartRef.current;
        
        // Update metrics
        if (metricsRef.current) {
          metricsRef.current.navigationEndTime = navigationEnd;
          metricsRef.current.totalNavigationTime = totalTime;
        }
        
        // Track analytics event
        if (enableAnalytics) {
          trackAnalyticsEvent({
            type: 'navigation',
            timestamp: navigationEnd,
            data: {
              destination: pathname,
              navigationTime: totalTime,
              isInitialLoad: !navigationStartRef.current,
            },
            pathname,
          });
        }
        
        navigationStartRef.current = null;
      }
    }
  }, [pathname, enableAnalytics, enablePerformanceTracking]);

  const trackAnalyticsEvent = useCallback((event: Omit<NavigationAnalyticsEvent, 'userAgent'>) => {
    if (!enableAnalytics) return;
    
    const fullEvent: NavigationAnalyticsEvent = {
      ...event,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };
    
    analyticsEventsRef.current.push(fullEvent);
    
    // Keep only last 100 events to prevent memory issues
    if (analyticsEventsRef.current.length > 100) {
      analyticsEventsRef.current = analyticsEventsRef.current.slice(-100);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Navigation Analytics:', fullEvent);
    }
    
    // Send to analytics service (placeholder for future implementation)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.type, {
        custom_parameter: event.data,
        page_path: event.pathname,
      });
    }
  }, [enableAnalytics]);

  const startNavigation = useCallback((destination: string) => {
    if (!enablePerformanceTracking) return;
    
    const startTime = performance.now();
    navigationStartRef.current = startTime;
    
    metricsRef.current = {
      navigationStartTime: startTime,
      navigationEndTime: 0,
      renderTime: 0,
      componentLoadTime: 0,
      totalNavigationTime: 0,
    };
    
    if (enableAnalytics) {
      trackAnalyticsEvent({
        type: 'navigation',
        timestamp: startTime,
        data: {
          action: 'start',
          destination,
        },
        pathname,
      });
    }
  }, [enablePerformanceTracking, enableAnalytics, pathname, trackAnalyticsEvent]);

  const endNavigation = useCallback(() => {
    if (!enablePerformanceTracking || !metricsRef.current) return;
    
    const endTime = performance.now();
    metricsRef.current.navigationEndTime = endTime;
    metricsRef.current.totalNavigationTime = endTime - metricsRef.current.navigationStartTime;
  }, [enablePerformanceTracking]);

  const trackComponentLoad = useCallback((componentName: string, loadTime: number) => {
    if (!enablePerformanceTracking) return;
    
    loadedComponentsRef.current.add(componentName);
    
    if (metricsRef.current) {
      metricsRef.current.componentLoadTime += loadTime;
    }
    
    if (enableAnalytics) {
      trackAnalyticsEvent({
        type: 'component_load',
        timestamp: performance.now(),
        data: {
          componentName,
          loadTime,
        },
        pathname,
      });
    }
  }, [enablePerformanceTracking, enableAnalytics, pathname, trackAnalyticsEvent]);

  const trackUserInteraction = useCallback((
    action: string, 
    target: string, 
    metadata?: Record<string, any>
  ) => {
    if (!enableAnalytics) return;
    
    trackAnalyticsEvent({
      type: 'user_interaction',
      timestamp: performance.now(),
      data: {
        action,
        target,
        ...metadata,
      },
      pathname,
    });
  }, [enableAnalytics, pathname, trackAnalyticsEvent]);

  const getMetrics = useCallback(() => {
    return metricsRef.current;
  }, []);

  const getAnalyticsEvents = useCallback(() => {
    return [...analyticsEventsRef.current];
  }, []);

  const clearMetrics = useCallback(() => {
    metricsRef.current = null;
    analyticsEventsRef.current = [];
    loadedComponentsRef.current.clear();
  }, []);

  const shouldPreload = useCallback((componentName: string) => {
    // Don't preload if already loaded
    if (loadedComponentsRef.current.has(componentName)) {
      return false;
    }
    
    // Preload based on user behavior patterns (simplified logic)
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 9 && currentHour <= 17;
    
    // Preload more aggressively during business hours
    return isBusinessHours;
  }, []);

  const markComponentAsLoaded = useCallback((componentName: string) => {
    loadedComponentsRef.current.add(componentName);
  }, []);

  const contextValue: NavigationPerformanceContextType = {
    startNavigation,
    endNavigation,
    trackComponentLoad,
    trackUserInteraction,
    getMetrics,
    getAnalyticsEvents,
    clearMetrics,
    shouldPreload,
    markComponentAsLoaded,
  };

  return (
    <NavigationPerformanceContext.Provider value={contextValue}>
      {children}
    </NavigationPerformanceContext.Provider>
  );
}

// Performance monitoring hook for components
export function useComponentPerformance(componentName: string) {
  const { trackComponentLoad, markComponentAsLoaded, shouldPreload } = useNavigationPerformance();
  const startTimeRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endTracking = useCallback(() => {
    if (startTimeRef.current) {
      const loadTime = performance.now() - startTimeRef.current;
      trackComponentLoad(componentName, loadTime);
      markComponentAsLoaded(componentName);
      startTimeRef.current = null;
    }
  }, [componentName, trackComponentLoad, markComponentAsLoaded]);

  const shouldPreloadComponent = shouldPreload(componentName);

  return {
    startTracking,
    endTracking,
    shouldPreload: shouldPreloadComponent,
  };
}