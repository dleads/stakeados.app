'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface AnalyticsTrackingOptions {
  contentId: string;
  contentType: 'article' | 'news';
  trackReadingTime?: boolean;
  trackScrollDepth?: boolean;
}

interface ReadingSession {
  sessionId: string | null;
  startTime: number;
  readingTime: number;
  scrollDepth: number;
  interactions: Record<string, any>;
  isActive: boolean;
}

export function useAnalyticsTracking({
  contentId,
  contentType,
  trackReadingTime = true,
  trackScrollDepth = true,
}: AnalyticsTrackingOptions) {
  const { user } = useAuthContext();
  const [session, setSession] = useState<ReadingSession>({
    sessionId: null,
    startTime: Date.now(),
    readingTime: 0,
    scrollDepth: 0,
    interactions: {},
    isActive: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollRef = useRef(0);
  const maxScrollRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Track page view and start session
  const trackView = useCallback(async () => {
    if (!user || session.isActive) return;

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screen: {
          width: screen.width,
          height: screen.height,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const referrer = document.referrer || undefined;

      const response = await fetch(`/api/analytics/content/${contentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          interactionType: 'view',
          deviceInfo,
          referrer,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSession(prev => ({
          ...prev,
          sessionId: data.sessionId,
          isActive: true,
          startTime: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  }, [user, contentId, contentType, session.isActive]);

  // Track interaction (like, share, bookmark)
  const trackInteraction = useCallback(
    async (
      interactionType: 'like' | 'share' | 'bookmark',
      metadata?: Record<string, any>
    ) => {
      if (!user) return;

      try {
        await fetch(`/api/analytics/content/${contentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentType,
            interactionType,
            metadata,
          }),
        });

        // Update local interactions
        setSession(prev => ({
          ...prev,
          interactions: {
            ...prev.interactions,
            [interactionType]: (prev.interactions[interactionType] || 0) + 1,
          },
        }));
      } catch (error) {
        console.error('Failed to track interaction:', error);
      }
    },
    [user, contentId, contentType]
  );

  // Update reading session
  const updateSession = useCallback(async () => {
    if (!session.sessionId || !session.isActive) return;

    try {
      const currentTime = Date.now();
      const readingTime = Math.floor((currentTime - session.startTime) / 1000);

      await fetch(`/api/analytics/reading-session/${session.sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readingTime,
          scrollDepth: session.scrollDepth,
          interactions: session.interactions,
          completed: session.scrollDepth > 80, // Consider 80%+ scroll as completed
        }),
      });

      setSession(prev => ({
        ...prev,
        readingTime,
      }));
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }, [session]);

  // End reading session
  const endSession = useCallback(async () => {
    if (!session.sessionId || !session.isActive) return;

    try {
      // Final update before ending
      await updateSession();

      // End the session
      await fetch(`/api/analytics/reading-session/${session.sessionId}`, {
        method: 'DELETE',
      });

      setSession(prev => ({
        ...prev,
        isActive: false,
      }));
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [session, updateSession]);

  // Handle scroll tracking
  const handleScroll = useCallback(() => {
    if (!trackScrollDepth || !session.isActive) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent =
      documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;

    maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent);
    lastScrollRef.current = Date.now();

    setSession(prev => ({
      ...prev,
      scrollDepth: Math.min(100, Math.max(prev.scrollDepth, scrollPercent)),
    }));
  }, [trackScrollDepth, session.isActive]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = !document.hidden;

    if (document.hidden) {
      // Page became hidden, pause tracking
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Page became visible, resume tracking
      if (session.isActive && trackReadingTime) {
        intervalRef.current = setInterval(updateSession, 10000); // Update every 10 seconds
      }
    }
  }, [session.isActive, trackReadingTime, updateSession]);

  // Initialize tracking
  useEffect(() => {
    if (user) {
      trackView();
    }
  }, [user, trackView]);

  // Set up scroll tracking
  useEffect(() => {
    if (trackScrollDepth) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [trackScrollDepth, handleScroll]);

  // Set up visibility tracking
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Set up reading time tracking
  useEffect(() => {
    if (session.isActive && trackReadingTime && isVisibleRef.current) {
      intervalRef.current = setInterval(updateSession, 10000); // Update every 10 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session.isActive, trackReadingTime, updateSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (session.isActive) {
        endSession();
      }
    };
  }, [session.isActive, endSession]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session.isActive) {
        // Use sendBeacon for reliable tracking on page unload
        navigator.sendBeacon(
          `/api/analytics/reading-session/${session.sessionId}`,
          JSON.stringify({
            readingTime: Math.floor((Date.now() - session.startTime) / 1000),
            scrollDepth: session.scrollDepth,
            interactions: session.interactions,
            exitPoint: 'page_unload',
            completed: session.scrollDepth > 80,
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  return {
    session,
    trackInteraction,
    endSession,
    isTracking: session.isActive,
  };
}
