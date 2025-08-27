import { useEffect, useRef, useCallback } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { metricsService } from '../lib/services/metricsService';

interface UseMetricsCollectionOptions {
  contentId: string;
  contentType: 'article' | 'news';
  enableViewTracking?: boolean;
  enableScrollTracking?: boolean;
  enableEngagementTracking?: boolean;
  scrollThreshold?: number; // Percentage of content scrolled to trigger tracking
  viewTimeThreshold?: number; // Milliseconds to wait before tracking view
}

export function useMetricsCollection({
  contentId,
  contentType,
  enableViewTracking = true,
  enableScrollTracking = true,
  enableEngagementTracking = true,
  scrollThreshold = 25,
  viewTimeThreshold = 3000,
}: UseMetricsCollectionOptions) {
  const { user } = useAuthContext();
  const viewTracked = useRef(false);
  const viewTimer = useRef<NodeJS.Timeout | null>(null);
  const lastScrollDepth = useRef(0);

  // Track page view after threshold time
  useEffect(() => {
    if (!enableViewTracking || viewTracked.current) return;

    viewTimer.current = setTimeout(async () => {
      try {
        await metricsService.trackView(contentId, contentType, user?.id, {
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : null,
          title: typeof document !== 'undefined' ? document.title : null,
        });
        viewTracked.current = true;
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }, viewTimeThreshold);

    return () => {
      if (viewTimer.current) {
        clearTimeout(viewTimer.current);
      }
    };
  }, [contentId, contentType, user?.id, enableViewTracking, viewTimeThreshold]);

  // Track scroll depth
  useEffect(() => {
    if (!enableScrollTracking || typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);

      // Track significant scroll milestones
      if (
        scrollDepth >= scrollThreshold &&
        scrollDepth > lastScrollDepth.current
      ) {
        const milestone = Math.floor(scrollDepth / 25) * 25; // Track every 25%
        if (milestone > lastScrollDepth.current) {
          metricsService
            .trackScroll(contentId, contentType, milestone, user?.id, {
              timestamp: new Date().toISOString(),
              scrollTop,
              documentHeight,
              viewportHeight: window.innerHeight,
            })
            .catch(error => {
              console.error('Error tracking scroll:', error);
            });
          lastScrollDepth.current = milestone;
        }
      }
    };

    const throttledHandleScroll = throttle(handleScroll, 1000); // Throttle to once per second
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [contentId, contentType, user?.id, enableScrollTracking, scrollThreshold]);

  // Track engagement actions
  const trackEngagement = useCallback(
    async (
      engagementType: 'like' | 'share' | 'bookmark' | 'comment',
      metadata: Record<string, any> = {}
    ) => {
      if (!enableEngagementTracking) return;

      try {
        await metricsService.trackEngagement(
          contentId,
          contentType,
          engagementType,
          user?.id,
          {
            timestamp: new Date().toISOString(),
            ...metadata,
          }
        );
      } catch (error) {
        console.error('Error tracking engagement:', error);
      }
    },
    [contentId, contentType, user?.id, enableEngagementTracking]
  );

  // Track custom interaction
  const trackCustomInteraction = useCallback(
    async (
      interactionType: string,
      value: number = 1,
      metadata: Record<string, any> = {}
    ) => {
      try {
        await metricsService.trackInteraction({
          user_id: user?.id || null,
          content_id: contentId,
          content_type: contentType,
          interaction_type: interactionType as any, // Type assertion for custom types
          interaction_value: value,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata,
          },
          session_id: metricsService['getSessionId']?.() || null,
          device_info: metricsService['getDeviceInfo']?.() || {},
          referrer: typeof document !== 'undefined' ? document.referrer : null,
          user_agent:
            typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });
      } catch (error) {
        console.error('Error tracking custom interaction:', error);
      }
    },
    [contentId, contentType, user?.id]
  );

  return {
    trackEngagement,
    trackCustomInteraction,
    isViewTracked: viewTracked.current,
    currentScrollDepth: lastScrollDepth.current,
  };
}

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Hook for real-time metrics subscription
export function useMetricsSubscription(
  contentId: string,
  contentType: 'article' | 'news',
  callback: (metrics: any[]) => void
) {
  useEffect(() => {
    const unsubscribe = metricsService.subscribeToMetrics(
      contentId,
      contentType,
      callback
    );

    return unsubscribe;
  }, [contentId, contentType, callback]);
}

// Hook for fetching content metrics
export function useContentMetrics(
  contentId: string,
  contentType: 'article' | 'news',
  dateFrom?: Date,
  dateTo?: Date
) {
  const fetchMetrics = useCallback(async () => {
    try {
      return await metricsService.getContentMetrics(
        contentId,
        contentType,
        dateFrom,
        dateTo
      );
    } catch (error) {
      console.error('Error fetching content metrics:', error);
      return [];
    }
  }, [contentId, contentType, dateFrom, dateTo]);

  return { fetchMetrics };
}

// Hook for trending content
export function useTrendingContent(
  contentType?: 'article' | 'news',
  limit: number = 10,
  hours: number = 24
) {
  const fetchTrending = useCallback(async () => {
    try {
      return await metricsService.getTrendingContent(contentType, limit, hours);
    } catch (error) {
      console.error('Error fetching trending content:', error);
      return [];
    }
  }, [contentType, limit, hours]);

  return { fetchTrending };
}
