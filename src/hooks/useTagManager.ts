import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TagStatistics {
  totalTags: number;
  totalUsage: number;
  unusedTags: number;
  averageUsage: number;
}

export interface TagFilters {
  search?: string;
  minUsage?: number;
  maxUsage?: number;
  sortBy?: 'name' | 'usage_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface DuplicateGroup {
  id: string;
  tags: Tag[];
  similarity: number;
  totalUsage: number;
  suggestedTarget: Tag;
}

export interface BulkOperationResult {
  operation: string;
  processed: number;
  skipped: number;
  errors: string[];
  details: any[];
}

export function useTagManager() {
  const t = useTranslations('admin.tags');
  const [tags, setTags] = useState<Tag[]>([]);
  const [statistics, setStatistics] = useState<TagStatistics>({
    totalTags: 0,
    totalUsage: 0,
    unusedTags: 0,
    averageUsage: 0,
  });
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  // Fetch tags with filters and pagination
  const fetchTags = useCallback(
    async (filters: TagFilters = {}, offset = 0, limit = 20) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          sortBy: filters.sortBy || 'usage_count',
          sortOrder: filters.sortOrder || 'desc',
        });

        if (filters.search) params.append('search', filters.search);
        if (filters.minUsage !== undefined)
          params.append('minUsage', filters.minUsage.toString());
        if (filters.maxUsage !== undefined)
          params.append('maxUsage', filters.maxUsage.toString());

        const response = await fetch(`/api/admin/tags?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }

        const data = await response.json();

        if (offset === 0) {
          setTags(data.tags);
        } else {
          setTags(prev => [...prev, ...data.tags]);
        }

        setStatistics(data.statistics);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create a new tag
  const createTag = useCallback(
    async (tagData: {
      name: string;
      slug?: string;
      description?: string;
      color?: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tagData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create tag');
        }

        const data = await response.json();

        // Add the new tag to the list
        setTags(prev => [data.tag, ...prev]);
        setStatistics(prev => ({
          ...prev,
          totalTags: prev.totalTags + 1,
        }));

        return data.tag;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create tag';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update a tag
  const updateTag = useCallback(
    async (tagId: string, updates: Partial<Tag>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/tags/${tagId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update tag');
        }

        const data = await response.json();

        // Update the tag in the list
        setTags(prev =>
          prev.map(tag => (tag.id === tagId ? { ...tag, ...data.tag } : tag))
        );

        return data.tag;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update tag';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete a tag
  const deleteTag = useCallback(async (tagId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tag');
      }

      // Remove the tag from the list
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      setStatistics(prev => ({
        ...prev,
        totalTags: prev.totalTags - 1,
      }));

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete tag';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch duplicate tags
  const fetchDuplicates = useCallback(async (threshold = 0.8, minUsage = 0) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        threshold: threshold.toString(),
        minUsage: minUsage.toString(),
      });

      const response = await fetch(`/api/admin/tags/merge?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch duplicate tags');
      }

      const data = await response.json();
      setDuplicateGroups(data.duplicateGroups);

      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch duplicates'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Merge tags
  const mergeTags = useCallback(
    async (
      sourceTagIds: string[],
      targetTagId: string,
      deleteSourceTags = true
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/tags/merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceTagIds,
            targetTagId,
            deleteSourceTags,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to merge tags');
        }

        const data = await response.json();

        // Remove merged tags from the list if they were deleted
        if (deleteSourceTags) {
          setTags(prev => prev.filter(tag => !sourceTagIds.includes(tag.id)));
          setStatistics(prev => ({
            ...prev,
            totalTags: prev.totalTags - sourceTagIds.length,
          }));
        }

        return data.result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to merge tags';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Bulk operations
  const bulkOperation = useCallback(
    async (
      operation: 'delete' | 'update' | 'merge',
      tagIds: string[],
      data?: any
    ): Promise<BulkOperationResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/tags/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation,
            tagIds,
            data,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to perform bulk operation'
          );
        }

        const result = await response.json();

        // Update local state based on operation
        if (operation === 'delete' || operation === 'merge') {
          setTags(prev => prev.filter(tag => !tagIds.includes(tag.id)));
          setStatistics(prev => ({
            ...prev,
            totalTags: prev.totalTags - result.results.processed,
          }));
        } else if (operation === 'update' && data) {
          setTags(prev =>
            prev.map(tag =>
              tagIds.includes(tag.id) ? { ...tag, ...data } : tag
            )
          );
        }

        return result.results;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to perform bulk operation';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get tag details with usage information
  const getTagDetails = useCallback(async (tagId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tags/${tagId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tag details');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tag details'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more tags (for pagination)
  const loadMore = useCallback(
    async (filters: TagFilters = {}) => {
      if (!pagination.hasMore || loading) return;

      await fetchTags(
        filters,
        pagination.offset + pagination.limit,
        pagination.limit
      );
    },
    [fetchTags, pagination, loading]
  );

  // Initial load
  useEffect(() => {
    fetchTags();
  }, []);

  return {
    // State
    tags,
    statistics,
    duplicateGroups,
    loading,
    error,
    pagination,

    // Actions
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    fetchDuplicates,
    mergeTags,
    bulkOperation,
    getTagDetails,
    loadMore,

    // Utilities
    clearError: () => setError(null),
  };
}
