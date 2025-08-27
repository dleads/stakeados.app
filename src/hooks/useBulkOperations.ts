import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
  processedIds: string[];
}

export interface BulkOperationProgress {
  id: string;
  operation_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_items: number;
  processed_items: number;
  success_count: number;
  error_count: number;
  errors: string[];
  started_at: string;
  completed_at?: string;
  estimated_completion?: string;
}

export function useBulkOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);
  const supabase = createClient();

  const executeArticleBulkOperation = useCallback(
    async (
      articleIds: string[],
      operation: 'publish' | 'archive' | 'categorize' | 'tag' | 'delete',
      data?: {
        categoryId?: string;
        tags?: string[];
        status?: string;
      }
    ): Promise<BulkOperationResult> => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/bulk/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleIds,
            operation,
            data,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to execute bulk operation');
        }

        const result = await response.json();
        return result.results;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeNewsBulkOperation = useCallback(
    async (
      newsIds: string[],
      operation: 'categorize' | 'process' | 'approve' | 'reject' | 'delete',
      data?: {
        categoryId?: string;
        processed?: boolean;
        status?: string;
      }
    ): Promise<BulkOperationResult> => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/bulk/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newsIds,
            operation,
            data,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to execute bulk operation');
        }

        const result = await response.json();
        return result.results;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeCategoryBulkOperation = useCallback(
    async (
      categoryIds: string[],
      operation: 'reorder' | 'merge' | 'delete' | 'update',
      data?: {
        newOrder?: Array<{ id: string; sort_order: number }>;
        targetCategoryId?: string;
        updates?: {
          color?: string;
          parent_id?: string | null;
        };
      }
    ): Promise<BulkOperationResult> => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/bulk/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categoryIds,
            operation,
            data,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to execute bulk operation');
        }

        const result = await response.json();
        return result.results;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeTagBulkOperation = useCallback(
    async (
      tagIds: string[],
      operation: 'merge' | 'delete',
      data?: {
        targetTagId?: string;
      }
    ): Promise<BulkOperationResult> => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/tags/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tagIds,
            operation,
            data,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to execute bulk operation');
        }

        const result = await response.json();
        return result.results;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getOperationProgress = useCallback(
    async (jobId: string): Promise<BulkOperationProgress | null> => {
      try {
        const response = await fetch(`/api/admin/bulk/progress/${jobId}`);

        if (!response.ok) {
          return null;
        }

        const progress = await response.json();
        setProgress(progress);
        return progress;
      } catch (error) {
        console.error('Failed to get operation progress:', error);
        return null;
      }
    },
    []
  );

  const pollProgress = useCallback(
    (jobId: string, onUpdate?: (progress: BulkOperationProgress) => void) => {
      const interval = setInterval(async () => {
        const progress = await getOperationProgress(jobId);

        if (progress) {
          onUpdate?.(progress);

          if (progress.status === 'completed' || progress.status === 'failed') {
            clearInterval(interval);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    },
    [getOperationProgress]
  );

  return {
    isLoading,
    progress,
    executeArticleBulkOperation,
    executeNewsBulkOperation,
    executeCategoryBulkOperation,
    executeTagBulkOperation,
    getOperationProgress,
    pollProgress,
  };
}
