'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface DashboardData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
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

interface TrendsData {
  timeSeries: Array<{
    date: string;
    articles: {
      created: number;
      published: number;
      views: number;
      likes: number;
    };
    news: { created: number; processed: number; trending: number };
    engagement: { totalViews: number; totalLikes: number; totalShares: number };
  }>;
  categoryTrends: Array<{
    id: string;
    name: string;
    articles: number;
    news: number;
    totalViews: number;
    avgTrendingScore: number;
  }>;
  growthRates: {
    articlesCreated: number;
    articlesPublished: number;
    newsCreated: number;
    totalViews: number;
    totalLikes: number;
  };
  trendingTopics: Array<{
    keyword: string;
    mentions: number;
    avgRelevance: number;
  }>;
  engagementPatterns: {
    hourlyDistribution: number[];
    weeklyDistribution: number[];
    peakEngagementHours: number[];
    engagementRate: number;
  };
  summary: {
    totalArticles: number;
    totalNews: number;
    totalViews: number;
    totalEngagement: number;
    periodDays: number;
    granularity: string;
    contentType: string;
  };
}

interface ExportConfig {
  exportType: 'articles' | 'news' | 'authors' | 'categories' | 'analytics';
  format: 'csv' | 'json';
  dateRange: { days: number };
  filters: Record<string, any>;
  includeMetrics: boolean;
}

interface UseAnalyticsDashboardProps {
  period: number;
  granularity: string;
}

export function useAnalyticsDashboard({
  period,
  granularity,
}: UseAnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/admin/analytics/dashboard?days=${period}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch dashboard data'
      );
      toast.error('Failed to load dashboard data');
    }
  }, [period]);

  // Fetch trends data
  const fetchTrendsData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/admin/analytics/trends?days=${period}&granularity=${granularity}&content_type=all`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch trends data');
      }

      const data = await response.json();
      setTrendsData(data);
    } catch (err) {
      console.error('Trends data fetch error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch trends data'
      );
      toast.error('Failed to load trends data');
    }
  }, [period, granularity]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchDashboardData(), fetchTrendsData()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDashboardData, fetchTrendsData]);

  // Refresh data
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Export data
  const exportData = useCallback(async (config: ExportConfig) => {
    try {
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export_${Date.now()}.${config.format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export completed successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed');
      throw err;
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dashboardData,
    trendsData,
    isLoading,
    error,
    refreshData,
    exportData,
  };
}
