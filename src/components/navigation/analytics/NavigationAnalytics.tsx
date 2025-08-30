'use client';

import React, { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationPerformance } from '../performance/NavigationPerformanceProvider';

interface NavigationAnalyticsProps {
  trackingId?: string;
  enableDebugMode?: boolean;
  sampleRate?: number;
}

export default function NavigationAnalytics({
  trackingId,
  enableDebugMode = false,
  sampleRate = 1.0,
}: NavigationAnalyticsProps) {
  const pathname = usePathname();
  const { trackUserInteraction, getMetrics, getAnalyticsEvents } = useNavigationPerformance();

  // Track page views
  useEffect(() => {
    // Only track if within sample rate
    if (Math.random() > sampleRate) return;

    const metrics = getMetrics();
    
    // Track page view with performance data
    if (typeof window !== 'undefined' && window.gtag && trackingId) {
      window.gtag('config', trackingId, {
        page_path: pathname,
        custom_map: {
          navigation_time: metrics?.totalNavigationTime || 0,
          component_load_time: metrics?.componentLoadTime || 0,
        },
      });
      
      window.gtag('event', 'page_view', {
        page_path: pathname,
        navigation_performance: metrics?.totalNavigationTime || 0,
      });
    }
    
    // Debug logging
    if (enableDebugMode) {
      console.log('Navigation Analytics - Page View:', {
        pathname,
        metrics,
        timestamp: Date.now(),
      });
    }
  }, [pathname, trackingId, sampleRate, enableDebugMode, getMetrics]);

  // Track navigation performance
  const trackNavigationPerformance = useCallback(() => {
    const metrics = getMetrics();
    if (!metrics) return;

    // Track performance metrics
    if (typeof window !== 'undefined' && window.gtag && trackingId) {
      window.gtag('event', 'navigation_performance', {
        event_category: 'Performance',
        event_label: pathname,
        value: Math.round(metrics.totalNavigationTime),
        custom_parameter_1: metrics.componentLoadTime,
        custom_parameter_2: metrics.renderTime,
      });
    }

    // Send to custom analytics endpoint (placeholder)
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'navigation_performance',
          pathname,
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }),
      }).catch(error => {
        console.warn('Failed to send navigation analytics:', error);
      });
    }

    if (enableDebugMode) {
      console.log('Navigation Performance Tracked:', metrics);
    }
  }, [pathname, trackingId, enableDebugMode, getMetrics]);

  // Track user interactions with navigation
  useEffect(() => {
    const handleNavigationClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const navElement = target.closest('[data-nav-item]');
      
      if (navElement) {
        const navItem = navElement.getAttribute('data-nav-item');
        const navType = navElement.getAttribute('data-nav-type') || 'link';
        
        trackUserInteraction('click', navItem || 'unknown', {
          navType,
          timestamp: Date.now(),
          position: {
            x: event.clientX,
            y: event.clientY,
          },
        });

        if (enableDebugMode) {
          console.log('Navigation Click Tracked:', {
            navItem,
            navType,
            position: { x: event.clientX, y: event.clientY },
          });
        }
      }
    };

    const handleKeyboardNavigation = (event: KeyboardEvent) => {
      if (['Tab', 'Enter', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const target = event.target as HTMLElement;
        const navElement = target.closest('[data-nav-item]');
        
        if (navElement) {
          const navItem = navElement.getAttribute('data-nav-item');
          
          trackUserInteraction('keyboard', navItem || 'unknown', {
            key: event.key,
            timestamp: Date.now(),
          });

          if (enableDebugMode) {
            console.log('Keyboard Navigation Tracked:', {
              navItem,
              key: event.key,
            });
          }
        }
      }
    };

    document.addEventListener('click', handleNavigationClick);
    document.addEventListener('keydown', handleKeyboardNavigation);

    return () => {
      document.removeEventListener('click', handleNavigationClick);
      document.removeEventListener('keydown', handleKeyboardNavigation);
    };
  }, [trackUserInteraction, enableDebugMode]);

  // Periodic performance reporting
  useEffect(() => {
    if (!enableDebugMode) return;

    const interval = setInterval(() => {
      const events = getAnalyticsEvents();
      const metrics = getMetrics();
      
      console.log('Navigation Analytics Summary:', {
        totalEvents: events.length,
        currentMetrics: metrics,
        recentEvents: events.slice(-5),
      });
    }, 30000); // Every 30 seconds in debug mode

    return () => clearInterval(interval);
  }, [enableDebugMode, getAnalyticsEvents, getMetrics]);

  // Track performance when component unmounts
  useEffect(() => {
    return () => {
      trackNavigationPerformance();
    };
  }, [trackNavigationPerformance]);

  return null; // This component doesn't render anything
}

// Hook for tracking custom navigation events
export function useNavigationAnalytics() {
  const { trackUserInteraction } = useNavigationPerformance();

  const trackCustomEvent = useCallback((
    eventName: string,
    properties?: Record<string, any>
  ) => {
    trackUserInteraction('custom', eventName, properties);
  }, [trackUserInteraction]);

  const trackSearchUsage = useCallback((query: string, resultsCount: number) => {
    trackUserInteraction('search', 'navigation_search', {
      query: query.length, // Don't track actual query for privacy
      resultsCount,
      timestamp: Date.now(),
    });
  }, [trackUserInteraction]);

  const trackMobileMenuUsage = useCallback((action: 'open' | 'close') => {
    trackUserInteraction('mobile_menu', action, {
      timestamp: Date.now(),
      screenWidth: window.innerWidth,
    });
  }, [trackUserInteraction]);

  const trackBreadcrumbUsage = useCallback((level: number, target: string) => {
    trackUserInteraction('breadcrumb', 'click', {
      level,
      target,
      timestamp: Date.now(),
    });
  }, [trackUserInteraction]);

  return {
    trackCustomEvent,
    trackSearchUsage,
    trackMobileMenuUsage,
    trackBreadcrumbUsage,
  };
}