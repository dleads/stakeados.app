'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  realTimeService,
  AnalyticsUpdate,
} from '@/lib/services/realTimeService';

export interface RealTimeMetrics {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  activeUsers: number;
  articlesPublished: number;
  newsProcessed: number;
  lastUpdated: Date;
}

export interface ContentMetrics {
  contentId: string;
  contentType: 'article' | 'news';
  views: number;
  likes: number;
  shares: number;
  readTime: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

export function useRealTimeAnalytics() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    activeUsers: 0,
    articlesPublished: 0,
    newsProcessed: 0,
    lastUpdated: new Date(),
  });

  const [contentMetrics, setContentMetrics] = useState<
    Map<string, ContentMetrics>
  >(new Map());
  const [trends, setTrends] = useState<Map<string, TrendData[]>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const metricsCache = useRef<Map<string, any>>(new Map());

  // Load initial analytics data
  const loadInitialData = useCallback(async () => {
    try {
      const [dashboardResponse, trendsResponse] = await Promise.all([
        fetch('/api/admin/analytics/dashboard'),
        fetch('/api/admin/analytics/trends?period=24h'),
      ]);

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setMetrics({
          totalViews: dashboardData.totalViews || 0,
          totalLikes: dashboardData.totalLikes || 0,
          totalShares: dashboardData.totalShares || 0,
          activeUsers: dashboardData.activeUsers || 0,
          articlesPublished: dashboardData.articlesPublished || 0,
          newsProcessed: dashboardData.newsProcessed || 0,
          lastUpdated: new Date(),
        });
      }

      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        const trendsMap = new Map();
        Object.entries(trendsData.trends || {}).forEach(([key, value]) => {
          trendsMap.set(key, value);
        });
        setTrends(trendsMap);
      }
    } catch (error) {
      console.error('Error loading initial analytics data:', error);
    }
  }, []);

  // Handle analytics updates
  const handleAnalyticsUpdate = useCallback(
    (update: AnalyticsUpdate) => {
      setLastUpdate(new Date());

      switch (update.type) {
        case 'metrics_updated':
          if (update.contentId) {
            // Update specific content metrics
            const contentMetric: ContentMetrics = {
              contentId: update.contentId,
              contentType: update.contentType,
              views: update.metrics.views || 0,
              likes: update.metrics.likes || 0,
              shares: update.metrics.shares || 0,
              readTime: update.metrics.read_time || 0,
              engagement: calculateEngagement(update.metrics),
              trend: calculateTrend(update.contentId, update.metrics),
              lastUpdated: update.timestamp,
            };

            setContentMetrics(
              prev => new Map(prev.set(update.contentId!, contentMetric))
            );
          } else {
            // Update global metrics
            setMetrics(prev => ({
              ...prev,
              totalViews: update.metrics.total_views || prev.totalViews,
              totalLikes: update.metrics.total_likes || prev.totalLikes,
              totalShares: update.metrics.total_shares || prev.totalShares,
              activeUsers: update.metrics.active_users || prev.activeUsers,
              articlesPublished:
                update.metrics.articles_published || prev.articlesPublished,
              newsProcessed:
                update.metrics.news_processed || prev.newsProcessed,
              lastUpdated: update.timestamp,
            }));
          }
          break;

        case 'trend_changed':
          // Update trend data
          if (update.contentId) {
            const trendKey = `${update.contentType}_${update.contentId}`;
            const currentTrends = trends.get(trendKey) || [];
            const newTrend: TrendData = {
              period: new Date().toISOString(),
              value: update.metrics.value || 0,
              change: update.metrics.change || 0,
              changePercent: update.metrics.changePercent || 0,
            };

            setTrends(
              prev =>
                new Map(
                  prev.set(trendKey, [...currentTrends, newTrend].slice(-24))
                )
            );
          }
          break;

        case 'alert_triggered':
          // Handle analytics alerts
          console.log('Analytics alert:', update);
          break;
      }

      // Cache the update
      metricsCache.current.set(
        `${update.contentType}_${update.contentId || 'global'}`,
        update.metrics
      );
    },
    [trends]
  );

  // Calculate engagement score
  const calculateEngagement = useCallback((metrics: any): number => {
    const views = metrics.views || 0;
    const likes = metrics.likes || 0;
    const shares = metrics.shares || 0;
    const readTime = metrics.read_time || 0;

    if (views === 0) return 0;

    // Engagement formula: (likes + shares * 2 + readTime/60) / views * 100
    return Math.round(((likes + shares * 2 + readTime / 60) / views) * 100);
  }, []);

  // Calculate trend direction
  const calculateTrend = useCallback(
    (contentId: string, currentMetrics: any): 'up' | 'down' | 'stable' => {
      const cacheKey = `article_${contentId}`;
      const previousMetrics = metricsCache.current.get(cacheKey);

      if (!previousMetrics) return 'stable';

      const currentViews = currentMetrics.views || 0;
      const previousViews = previousMetrics.views || 0;
      const difference = currentViews - previousViews;

      if (difference > 0) return 'up';
      if (difference < 0) return 'down';
      return 'stable';
    },
    []
  );

  // Get metrics for specific content
  const getContentMetrics = useCallback(
    (contentId: string): ContentMetrics | undefined => {
      return contentMetrics.get(contentId);
    },
    [contentMetrics]
  );

  // Get trend data for specific content
  const getTrendData = useCallback(
    (contentType: string, contentId?: string): TrendData[] => {
      const key = contentId ? `${contentType}_${contentId}` : contentType;
      return trends.get(key) || [];
    },
    [trends]
  );

  // Refresh analytics data
  const refreshAnalytics = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Get real-time statistics
  const getRealTimeStats = useCallback(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Filter content metrics updated in the last 5 minutes
    const recentUpdates = Array.from(contentMetrics.values()).filter(
      metric => metric.lastUpdated > fiveMinutesAgo
    );

    return {
      recentUpdates: recentUpdates.length,
      totalContentTracked: contentMetrics.size,
      lastUpdateTime: lastUpdate,
      isRealTime: now.getTime() - lastUpdate.getTime() < 60000, // Updated within last minute
    };
  }, [contentMetrics, lastUpdate]);

  // Setup real-time subscription
  useEffect(() => {
    loadInitialData();

    const unsubscribe = realTimeService.subscribeToAnalyticsUpdates(
      handleAnalyticsUpdate
    );

    // Check connection status
    const checkConnection = () => {
      setIsConnected(realTimeService.getConnectionStatus());
    };

    checkConnection();
    const connectionInterval = setInterval(checkConnection, 10000);

    // Periodic refresh for fallback
    const refreshInterval = setInterval(() => {
      if (!realTimeService.getConnectionStatus()) {
        loadInitialData();
      }
    }, 30000); // Every 30 seconds if not connected

    return () => {
      unsubscribe();
      clearInterval(connectionInterval);
      clearInterval(refreshInterval);
    };
  }, [loadInitialData, handleAnalyticsUpdate]);

  return {
    metrics,
    contentMetrics: Array.from(contentMetrics.values()),
    trends,
    isConnected,
    lastUpdate,
    getContentMetrics,
    getTrendData,
    refreshAnalytics,
    getRealTimeStats,
  };
}
