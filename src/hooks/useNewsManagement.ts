'use client';

import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '@/lib/services/categoryService';

export interface NewsStats {
  total: number;
  processed: number;
  unprocessed: number;
  by_language: {
    es: number;
    en: number;
  };
  trending: number;
  sources: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  description?: string | null;
  parent_id?: string | null;
  article_count: number;
  news_count: number;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  health_status: 'healthy' | 'warning' | 'error' | 'timeout';
  last_fetched_at?: string;
  articles_today: number;
  priority: number;
  source_type: 'rss' | 'api' | 'scraper';
  quality_score: number;
  consecutive_failures: number;
}

export interface AIProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total_items: number;
    processed_items: number;
    failed_items: number;
    skipped_items: number;
    percentage: number;
  };
  timing: {
    created_at: string;
    started_at?: string;
    completed_at?: string;
    processing_rate_per_minute: number;
    estimated_remaining_minutes?: number;
  };
  processing_options: {
    generate_summary?: boolean;
    extract_keywords?: boolean;
    calculate_relevance?: boolean;
    detect_duplicates?: boolean;
    translate?: boolean;
    target_language?: string;
  };
  error_message?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  source_name: string;
  source_url?: string;
  processed: boolean;
  trending_score: number;
  created_at: string;
  published_at?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  language: 'es' | 'en';
  ai_metadata?: {
    relevance_score?: number;
    keywords?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    duplicate_check?: {
      is_duplicate: boolean;
      similar_articles?: string[];
      similarity_score?: number;
    };
  };
}

export interface NewsFilters {
  processed?: boolean;
  category_id?: string;
  source_name?: string;
  language?: 'es' | 'en';
  search?: string;
  date_from?: string;
  date_to?: string;
  trending_min?: number;
}

export interface NewsManagementState {
  // Data
  stats: NewsStats;
  sources: NewsSource[];
  processingJobs: AIProcessingJob[];
  newsQueue: NewsItem[];
  categories: Category[];

  // Loading states
  loading: boolean;
  refreshing: boolean;
  sourcesLoading: boolean;
  jobsLoading: boolean;
  queueLoading: boolean;
  categoriesLoading: boolean;

  // Error states
  error: string | null;
  sourcesError: string | null;
  jobsError: string | null;
  queueError: string | null;
  categoriesError: string | null;

  // Filters and pagination
  filters: NewsFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // Real-time updates
  lastUpdated: Date | null;
  autoRefresh: boolean;
}

export interface NewsManagementActions {
  // Data fetching
  fetchDashboardData: () => Promise<void>;
  fetchSources: () => Promise<void>;
  fetchProcessingJobs: () => Promise<void>;
  fetchNewsQueue: (filters?: NewsFilters) => Promise<void>;
  fetchCategories: () => Promise<void>;

  // Filters and pagination
  setFilters: (filters: Partial<NewsFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;

  // Source management
  toggleSourceStatus: (sourceId: string) => Promise<void>;
  testSourceConnection: (sourceId: string) => Promise<boolean>;

  // Processing management
  startBatchProcessing: (
    options: AIProcessingJob['processing_options']
  ) => Promise<string>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;

  // News management
  approveNews: (newsId: string) => Promise<void>;
  rejectNews: (newsId: string, reason: string) => Promise<void>;
  categorizeNews: (newsId: string, categoryId: string) => Promise<void>;

  // Settings
  setAutoRefresh: (enabled: boolean) => void;
  refresh: () => Promise<void>;
}

const initialState: NewsManagementState = {
  stats: {
    total: 0,
    processed: 0,
    unprocessed: 0,
    by_language: { es: 0, en: 0 },
    trending: 0,
    sources: 0,
  },
  sources: [],
  processingJobs: [],
  newsQueue: [],
  categories: [],
  loading: true,
  refreshing: false,
  sourcesLoading: false,
  jobsLoading: false,
  queueLoading: false,
  categoriesLoading: false,
  error: null,
  sourcesError: null,
  jobsError: null,
  queueError: null,
  categoriesError: null,
  filters: {},
  pagination: {
    page: 0,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  lastUpdated: null,
  autoRefresh: true,
};

export function useNewsManagement(): NewsManagementState &
  NewsManagementActions {
  const [state, setState] = useState<NewsManagementState>(initialState);

  // Fetch dashboard overview data
  const fetchDashboardData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, refreshing: true, error: null }));

      const response = await fetch(
        '/api/admin/news?include_analytics=true&limit=10'
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        stats: data.stats || initialState.stats,
        newsQueue: data.data || [],
        pagination: {
          ...prev.pagination,
          total: data.pagination?.total || 0,
          hasMore: data.pagination?.hasMore || false,
        },
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard data',
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false, refreshing: false }));
    }
  }, []);

  // Fetch categories with counts
  const fetchCategories = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        categoriesLoading: true,
        categoriesError: null,
      }));
      const data = await categoryService.getCategoriesWithCounts();
      // Mapear a nuestro tipo Category explícito
      const categories: Category[] = data.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        color: c.color ?? undefined,
        description: c.description ?? undefined,
        parent_id: c.parent_id ?? undefined,
        article_count: (c as any).article_count ?? 0,
        news_count: (c as any).news_count ?? 0,
      }));
      setState(prev => ({ ...prev, categories }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setState(prev => ({
        ...prev,
        categoriesError:
          error instanceof Error ? error.message : 'Failed to fetch categories',
      }));
    } finally {
      setState(prev => ({ ...prev, categoriesLoading: false }));
    }
  }, []);

  // Fetch news sources
  const fetchSources = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, sourcesLoading: true, sourcesError: null }));

      const response = await fetch(
        '/api/admin/news-sources?include_health=true'
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        sources: data.data || [],
        sourcesError: null,
      }));
    } catch (error) {
      console.error('Error fetching sources:', error);
      setState(prev => ({
        ...prev,
        sourcesError:
          error instanceof Error ? error.message : 'Failed to fetch sources',
      }));
    } finally {
      setState(prev => ({ ...prev, sourcesLoading: false }));
    }
  }, []);

  // Fetch AI processing jobs
  const fetchProcessingJobs = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, jobsLoading: true, jobsError: null }));

      const response = await fetch('/api/admin/ai/processing-status?limit=10');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        processingJobs: data.jobs || [],
        jobsError: null,
      }));
    } catch (error) {
      console.error('Error fetching processing jobs:', error);
      setState(prev => ({
        ...prev,
        jobsError:
          error instanceof Error
            ? error.message
            : 'Failed to fetch processing jobs',
      }));
    } finally {
      setState(prev => ({ ...prev, jobsLoading: false }));
    }
  }, []);

  // Fetch news queue with filters
  const fetchNewsQueue = useCallback(
    async (filters?: NewsFilters) => {
      try {
        setState(prev => ({ ...prev, queueLoading: true, queueError: null }));

        const searchParams = new URLSearchParams();
        if (filters?.processed !== undefined)
          searchParams.set('processed', filters.processed.toString());
        if (filters?.category_id)
          searchParams.set('category_id', filters.category_id);
        if (filters?.source_name)
          searchParams.set('source_name', filters.source_name);
        if (filters?.language) searchParams.set('language', filters.language);
        if (filters?.search) searchParams.set('search', filters.search);
        if (filters?.date_from)
          searchParams.set('date_from', filters.date_from);
        if (filters?.date_to) searchParams.set('date_to', filters.date_to);
        if (filters?.trending_min !== undefined)
          searchParams.set('trending_min', filters.trending_min.toString());

        searchParams.set('page', state.pagination.page.toString());
        searchParams.set('limit', state.pagination.limit.toString());

        const response = await fetch(
          `/api/admin/news?${searchParams.toString()}`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        setState(prev => ({
          ...prev,
          newsQueue: data.data || [],
          pagination: {
            ...prev.pagination,
            total: data.pagination?.total || 0,
            hasMore: data.pagination?.hasMore || false,
          },
          queueError: null,
        }));
      } catch (error) {
        console.error('Error fetching news queue:', error);
        setState(prev => ({
          ...prev,
          queueError:
            error instanceof Error
              ? error.message
              : 'Failed to fetch news queue',
        }));
      } finally {
        setState(prev => ({ ...prev, queueLoading: false }));
      }
    },
    [state.pagination.page, state.pagination.limit]
  );

  // Set filters
  const setFilters = useCallback((newFilters: Partial<NewsFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 0 }, // Reset to first page
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      pagination: { ...prev.pagination, page: 0 },
    }));
  }, []);

  // Set page
  const setPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  }, []);

  // Toggle source status
  const toggleSourceStatus = useCallback(
    async (sourceId: string) => {
      try {
        const source = state.sources.find(s => s.id === sourceId);
        if (!source) return;

        const response = await fetch(`/api/admin/news-sources/${sourceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !source.is_active }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Update local state
        setState(prev => ({
          ...prev,
          sources: prev.sources.map(s =>
            s.id === sourceId ? { ...s, is_active: !s.is_active } : s
          ),
        }));
      } catch (error) {
        console.error('Error toggling source status:', error);
        throw error;
      }
    },
    [state.sources]
  );

  // Test source connection
  const testSourceConnection = useCallback(
    async (sourceId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/admin/news-sources/${sourceId}/test`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result.success || false;
      } catch (error) {
        console.error('Error testing source connection:', error);
        return false;
      }
    },
    []
  );

  // Start batch processing
  const startBatchProcessing = useCallback(
    async (options: AIProcessingJob['processing_options']): Promise<string> => {
      try {
        const response = await fetch('/api/admin/ai/process-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ processing_options: options }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Refresh processing jobs
        await fetchProcessingJobs();

        return result.job_id;
      } catch (error) {
        console.error('Error starting batch processing:', error);
        throw error;
      }
    },
    [fetchProcessingJobs]
  );

  // Cancel job
  const cancelJob = useCallback(
    async (jobId: string) => {
      try {
        const response = await fetch('/api/admin/ai/processing-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId, action: 'cancel' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Refresh processing jobs
        await fetchProcessingJobs();
      } catch (error) {
        console.error('Error cancelling job:', error);
        throw error;
      }
    },
    [fetchProcessingJobs]
  );

  // Retry job
  const retryJob = useCallback(
    async (jobId: string) => {
      try {
        const response = await fetch('/api/admin/ai/processing-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId, action: 'retry' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Refresh processing jobs
        await fetchProcessingJobs();
      } catch (error) {
        console.error('Error retrying job:', error);
        throw error;
      }
    },
    [fetchProcessingJobs]
  );

  // Approve news
  const approveNews = useCallback(async (newsId: string) => {
    try {
      const response = await fetch(`/api/admin/news/${newsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processed: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update local state
      setState(prev => ({
        ...prev,
        newsQueue: prev.newsQueue.map(item =>
          item.id === newsId ? { ...item, processed: true } : item
        ),
      }));
    } catch (error) {
      console.error('Error approving news:', error);
      throw error;
    }
  }, []);

  // Reject news
  const rejectNews = useCallback(async (newsId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/news/${newsId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove from local state
      setState(prev => ({
        ...prev,
        newsQueue: prev.newsQueue.filter(item => item.id !== newsId),
      }));
    } catch (error) {
      console.error('Error rejecting news:', error);
      throw error;
    }
  }, []);

  // Categorize news
  const categorizeNews = useCallback(
    async (newsId: string, categoryId: string) => {
      try {
        const response = await fetch(`/api/admin/news/${newsId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: categoryId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Refresh news queue to get updated category info
        await fetchNewsQueue(state.filters);
      } catch (error) {
        console.error('Error categorizing news:', error);
        throw error;
      }
    },
    [fetchNewsQueue, state.filters]
  );

  // Set auto refresh
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoRefresh: enabled }));
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchSources(),
      fetchProcessingJobs(),
      fetchCategories(),
    ]);
  }, [fetchDashboardData, fetchSources, fetchProcessingJobs, fetchCategories]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
    fetchSources();
    fetchProcessingJobs();
    fetchCategories();
  }, [fetchDashboardData, fetchSources, fetchProcessingJobs, fetchCategories]);

  // Auto refresh interval
  useEffect(() => {
    if (!state.autoRefresh) return;

    const interval = setInterval(() => {
      if (!state.loading && !state.refreshing) {
        refresh();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [state.autoRefresh, state.loading, state.refreshing, refresh]);

  // Fetch news queue when filters or pagination change
  useEffect(() => {
    if (Object.keys(state.filters).length > 0 || state.pagination.page > 0) {
      fetchNewsQueue(state.filters);
    }
  }, [state.filters, state.pagination.page, fetchNewsQueue]);

  return {
    ...state,
    fetchDashboardData,
    fetchSources,
    fetchProcessingJobs,
    fetchNewsQueue,
    fetchCategories,
    setFilters,
    clearFilters,
    setPage,
    toggleSourceStatus,
    testSourceConnection,
    startBatchProcessing,
    cancelJob,
    retryJob,
    approveNews,
    rejectNews,
    categorizeNews,
    setAutoRefresh,
    refresh,
  };
}
