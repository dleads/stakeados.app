'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface DashboardMetrics {
  articles: {
    total: number;
    published: number;
    draft: number;
    review: number;
    totalViews: number;
    totalLikes: number;
    avgViewsPerArticle: number;
  };
  news: {
    total: number;
    processed: number;
    pending: number;
    avgTrendingScore: number;
  };
  categories: {
    total: number;
    withContent: number;
    topCategories: Array<{
      id: string;
      name: string;
      articleCount: number;
      newsCount: number;
      totalContent: number;
    }>;
  };
  growth: {
    articlesGrowth: number;
    newsGrowth: number;
  };
  recentActivity: Array<{
    id: string;
    change_type: string;
    created_at: string;
    article?: { title: string };
    changed_by?: { full_name: string };
  }>;
  topPerformingContent: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    created_at: string;
  }>;
}

export interface DashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number; // in milliseconds
  enableRealTimeUpdates: boolean;
}

export function useAdminDashboard(
  initialSettings?: Partial<DashboardSettings>
) {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const [settings, setSettings] = useState<DashboardSettings>({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    enableRealTimeUpdates: true,
    ...initialSettings,
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Fetch dashboard metrics from API
  const fetchMetrics = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const response = await fetch('/api/admin/analytics/dashboard');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        metrics: data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }));

      return data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch metrics',
      }));
      return null;
    }
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchMetrics(true);
  }, [fetchMetrics]);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<DashboardSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
    },
    []
  );

  // Set up auto-refresh
  useEffect(() => {
    if (settings.autoRefresh && settings.refreshInterval > 0) {
      const scheduleNextRefresh = () => {
        refreshTimeoutRef.current = setTimeout(() => {
          fetchMetrics(false).then(() => {
            if (settings.autoRefresh) {
              scheduleNextRefresh();
            }
          });
        }, settings.refreshInterval);
      };

      scheduleNextRefresh();

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [settings.autoRefresh, settings.refreshInterval, fetchMetrics]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!settings.enableRealTimeUpdates) return;

    const subscriptions: Array<() => void> = [];

    // Subscribe to article changes
    const articleSubscription = supabase
      .channel('dashboard-articles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
        },
        payload => {
          console.log('Article change detected:', payload);
          // Debounce the refresh to avoid too many API calls
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          refreshTimeoutRef.current = setTimeout(() => {
            fetchMetrics(false);
          }, 2000);
        }
      )
      .subscribe();

    subscriptions.push(() => articleSubscription.unsubscribe());

    // Subscribe to news changes
    const newsSubscription = supabase
      .channel('dashboard-news')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news',
        },
        payload => {
          console.log('News change detected:', payload);
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          refreshTimeoutRef.current = setTimeout(() => {
            fetchMetrics(false);
          }, 2000);
        }
      )
      .subscribe();

    subscriptions.push(() => newsSubscription.unsubscribe());

    // Subscribe to article history for activity feed
    const historySubscription = supabase
      .channel('dashboard-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'article_history',
        },
        payload => {
          console.log('New activity detected:', payload);
          // Update activity feed immediately
          setState(prev => {
            if (!prev.metrics) return prev;

            const newActivity = {
              id: payload.new.id,
              change_type: payload.new.change_type,
              created_at: payload.new.created_at,
              article: payload.new.article,
              changed_by: payload.new.changed_by,
            };

            return {
              ...prev,
              metrics: {
                ...prev.metrics,
                recentActivity: [
                  newActivity,
                  ...prev.metrics.recentActivity.slice(0, 9),
                ],
              },
            };
          });
        }
      )
      .subscribe();

    subscriptions.push(() => historySubscription.unsubscribe());

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [settings.enableRealTimeUpdates, supabase, fetchMetrics]);

  // Initial load
  useEffect(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    settings,
    refresh,
    updateSettings,
    isRefreshing: state.loading,
  };
}

// Hook for dashboard customization
export function useDashboardCustomization() {
  const [layout, setLayout] = useState({
    widgets: [
      { id: 'metrics', enabled: true, order: 0 },
      { id: 'activity', enabled: true, order: 1 },
      { id: 'quickActions', enabled: true, order: 2 },
      { id: 'topContent', enabled: true, order: 3 },
      { id: 'systemStatus', enabled: true, order: 4 },
    ],
    compactMode: false,
    theme: 'dark',
  });

  const updateLayout = useCallback((updates: Partial<typeof layout>) => {
    setLayout(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleWidget = useCallback((widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, enabled: !widget.enabled }
          : widget
      ),
    }));
  }, []);

  const reorderWidgets = useCallback((widgetId: string, newOrder: number) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets
        .map(widget =>
          widget.id === widgetId ? { ...widget, order: newOrder } : widget
        )
        .sort((a, b) => a.order - b.order),
    }));
  }, []);

  return {
    layout,
    updateLayout,
    toggleWidget,
    reorderWidgets,
  };
}

// Hook for dashboard notifications
export function useDashboardNotifications() {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
      actionUrl?: string;
    }>
  >([]);

  const addNotification = useCallback(
    (
      notification: Omit<(typeof notifications)[0], 'id' | 'timestamp' | 'read'>
    ) => {
      const newNotification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
}
