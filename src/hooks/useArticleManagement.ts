'use client';

import { useState, useEffect, useCallback } from 'react';

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  author: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  status: 'draft' | 'review' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  reading_time: number;
  views?: number;
  likes?: number;
  language: 'es' | 'en';
  slug: string;
}

interface ArticleStats {
  total: number;
  draft: number;
  review: number;
  published: number;
  archived: number;
  totalViews?: number;
  avgReadingTime?: number;
  publishedThisWeek?: number;
}

interface ArticleFilters {
  page?: number;
  limit?: number;
  status?: 'draft' | 'review' | 'published' | 'archived';
  author_id?: string;
  category_id?: string;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'published_at' | 'title';
  sort_order?: 'asc' | 'desc';
  date_from?: string;
  date_to?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface UseArticleManagementReturn {
  articles: Article[];
  stats: ArticleStats;
  loading: boolean;
  error: string | null;
  filters: ArticleFilters;
  pagination: Pagination;
  updateFilters: (newFilters: Partial<ArticleFilters>) => void;
  refreshData: () => void;
  deleteArticle: (articleId: string) => Promise<void>;
  updateArticleStatus: (
    articleId: string,
    status: Article['status']
  ) => Promise<void>;
}

export function useArticleManagement(): UseArticleManagementReturn {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<ArticleStats>({
    total: 0,
    draft: 0,
    review: 0,
    published: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ArticleFilters>({
    page: 0,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 0,
    limit: 20,
    total: 0,
    hasMore: false,
  });

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `/api/admin/articles?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch articles');
      }

      const data = await response.json();

      setArticles(data.data || []);
      setStats(
        data.stats || {
          total: 0,
          draft: 0,
          review: 0,
          published: 0,
          archived: 0,
        }
      );
      setPagination(
        data.pagination || {
          page: 0,
          limit: 20,
          total: 0,
          hasMore: false,
        }
      );
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setArticles([]);
      setStats({
        total: 0,
        draft: 0,
        review: 0,
        published: 0,
        archived: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<ArticleFilters>) => {
    setFilters(prev => {
      // If changing filters other than page, reset to page 0
      const shouldResetPage = Object.keys(newFilters).some(
        key => key !== 'page'
      );

      return {
        ...prev,
        ...newFilters,
        ...(shouldResetPage && !newFilters.hasOwnProperty('page')
          ? { page: 0 }
          : {}),
      };
    });
  }, []);

  const refreshData = useCallback(() => {
    fetchArticles();
  }, [fetchArticles]);

  const deleteArticle = useCallback(
    async (articleId: string) => {
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete article');
        }

        // Remove article from local state
        setArticles(prev => prev.filter(article => article.id !== articleId));

        // Update stats
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          archived: prev.archived + 1,
        }));

        // Refresh data to get accurate counts
        await fetchArticles();
      } catch (err) {
        console.error('Error deleting article:', err);
        throw err;
      }
    },
    [fetchArticles]
  );

  const updateArticleStatus = useCallback(
    async (articleId: string, status: Article['status']) => {
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update article status');
        }

        const updatedArticle = await response.json();

        // Update article in local state
        setArticles(prev =>
          prev.map(article =>
            article.id === articleId
              ? { ...article, ...updatedArticle }
              : article
          )
        );

        // Refresh data to get accurate stats
        await fetchArticles();
      } catch (err) {
        console.error('Error updating article status:', err);
        throw err;
      }
    },
    [fetchArticles]
  );

  // Fetch articles when filters change
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    articles,
    stats,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    refreshData,
    deleteArticle,
    updateArticleStatus,
  };
}
