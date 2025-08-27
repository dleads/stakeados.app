'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ArticleScheduleData {
  scheduled_at: string;
  timezone: string;
  recurring_pattern?: string;
  auto_publish: boolean;
  publish_channels: string[];
  notes?: string;
}

interface ScheduledArticle {
  id: string;
  title: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  scheduled_at: string;
  timezone: string;
  recurring_pattern?: string;
  auto_publish: boolean;
  publish_channels: string[];
  author: {
    display_name: string;
    username: string;
  };
  category?: {
    name: string;
    color?: string;
  };
  schedule_status: 'scheduled' | 'published' | 'cancelled' | 'failed';
}

interface UseArticleSchedulingReturn {
  loading: boolean;
  error: string | null;
  scheduleArticle: (
    articleId: string,
    scheduleData: ArticleScheduleData
  ) => Promise<boolean>;
  cancelSchedule: (articleId: string) => Promise<boolean>;
  getScheduledArticles: () => Promise<ScheduledArticle[]>;
  getArticleSchedule: (articleId: string) => Promise<any>;
  processScheduledPublications: () => Promise<boolean>;
  getUpcomingPublications: () => Promise<any[]>;
  getOverduePublications: () => Promise<any[]>;
}

export function useArticleScheduling(): UseArticleSchedulingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleError = useCallback((error: any, defaultMessage: string) => {
    console.error('Article scheduling error:', error);
    const message = error?.message || defaultMessage;
    setError(message);
    return false;
  }, []);

  const scheduleArticle = useCallback(
    async (
      articleId: string,
      scheduleData: ArticleScheduleData
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/articles/${articleId}/schedule`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(scheduleData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to schedule article');
        }

        const data = await response.json();
        console.log('Article scheduled successfully:', data);

        // Refresh the page to show updated data
        router.refresh();

        return true;
      } catch (error) {
        return handleError(error, 'Failed to schedule article');
      } finally {
        setLoading(false);
      }
    },
    [router, handleError]
  );

  const cancelSchedule = useCallback(
    async (articleId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/articles/${articleId}/schedule`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel schedule');
        }

        console.log('Schedule cancelled successfully');

        // Refresh the page to show updated data
        router.refresh();

        return true;
      } catch (error) {
        return handleError(error, 'Failed to cancel schedule');
      } finally {
        setLoading(false);
      }
    },
    [router, handleError]
  );

  const getScheduledArticles = useCallback(async (): Promise<
    ScheduledArticle[]
  > => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        '/api/admin/articles?status=scheduled&include_schedule=true'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch scheduled articles'
        );
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      handleError(error, 'Failed to fetch scheduled articles');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getArticleSchedule = useCallback(
    async (articleId: string): Promise<any> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/articles/${articleId}/schedule`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to fetch article schedule'
          );
        }

        const data = await response.json();
        return data.schedules || [];
      } catch (error) {
        handleError(error, 'Failed to fetch article schedule');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  const processScheduledPublications =
    useCallback(async (): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/articles/schedule/automatic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'process_due' }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to process scheduled publications'
          );
        }

        console.log('Scheduled publications processed successfully');

        // Refresh the page to show updated data
        router.refresh();

        return true;
      } catch (error) {
        return handleError(error, 'Failed to process scheduled publications');
      } finally {
        setLoading(false);
      }
    }, [router, handleError]);

  const getUpcomingPublications = useCallback(async (): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        '/api/admin/articles/schedule/automatic?type=upcoming'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch upcoming publications'
        );
      }

      const data = await response.json();
      return data.publications || [];
    } catch (error) {
      handleError(error, 'Failed to fetch upcoming publications');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getOverduePublications = useCallback(async (): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        '/api/admin/articles/schedule/automatic?type=overdue'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch overdue publications'
        );
      }

      const data = await response.json();
      return data.publications || [];
    } catch (error) {
      handleError(error, 'Failed to fetch overdue publications');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    scheduleArticle,
    cancelSchedule,
    getScheduledArticles,
    getArticleSchedule,
    processScheduledPublications,
    getUpcomingPublications,
    getOverduePublications,
  };
}
