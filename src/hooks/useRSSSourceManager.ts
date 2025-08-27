'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  NewsSource,
  SourceCategory,
  SourceTestResult,
} from '@/components/admin/news/RSSSourceManager';

export interface RSSSourceManagerState {
  sources: NewsSource[];
  categories: SourceCategory[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface RSSSourceManagerActions {
  fetchSources: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createSource: (
    source: Omit<NewsSource, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateSource: (id: string, updates: Partial<NewsSource>) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  testSource: (id: string) => Promise<SourceTestResult>;
  toggleSource: (id: string) => Promise<void>;
  fetchNow: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const initialState: RSSSourceManagerState = {
  sources: [],
  categories: [],
  loading: true,
  error: null,
  lastUpdated: null,
};

export function useRSSSourceManager(): RSSSourceManagerState &
  RSSSourceManagerActions {
  const [state, setState] = useState<RSSSourceManagerState>(initialState);

  // Fetch sources from API
  const fetchSources = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

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
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error('Error fetching sources:', error);
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to fetch sources',
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform categories to match SourceCategory interface
      const sourceCategories: SourceCategory[] =
        data.data?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          color: cat.color || '#00FF88',
          icon: cat.icon,
        })) || [];

      setState(prev => ({
        ...prev,
        categories: sourceCategories,
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Don't set error state for categories as it's not critical
    }
  }, []);

  // Create new source
  const createSource = useCallback(
    async (
      sourceData: Omit<NewsSource, 'id' | 'created_at' | 'updated_at'>
    ) => {
      try {
        const response = await fetch('/api/admin/news-sources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sourceData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const newSource = await response.json();

        setState(prev => ({
          ...prev,
          sources: [...prev.sources, newSource],
          lastUpdated: new Date(),
        }));
      } catch (error) {
        console.error('Error creating source:', error);
        throw error;
      }
    },
    []
  );

  // Update existing source
  const updateSource = useCallback(
    async (id: string, updates: Partial<NewsSource>) => {
      try {
        const response = await fetch(`/api/admin/news-sources/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const updatedSource = await response.json();

        setState(prev => ({
          ...prev,
          sources: prev.sources.map(source =>
            source.id === id ? { ...source, ...updatedSource } : source
          ),
          lastUpdated: new Date(),
        }));
      } catch (error) {
        console.error('Error updating source:', error);
        throw error;
      }
    },
    []
  );

  // Delete source
  const deleteSource = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/news-sources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      setState(prev => ({
        ...prev,
        sources: prev.sources.filter(source => source.id !== id),
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error deleting source:', error);
      throw error;
    }
  }, []);

  // Test source connection
  const testSource = useCallback(
    async (id: string): Promise<SourceTestResult> => {
      try {
        const response = await fetch(`/api/admin/news-sources/${id}/test`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return (
          result.test_result || {
            success: false,
            status: 'error',
            response_time: 0,
            articles_fetched: 0,
            error_message: 'Unknown error',
          }
        );
      } catch (error) {
        console.error('Error testing source:', error);
        return {
          success: false,
          status: 'error',
          response_time: 0,
          articles_fetched: 0,
          error_message: error instanceof Error ? error.message : 'Test failed',
        };
      }
    },
    []
  );

  // Toggle source active status
  const toggleSource = useCallback(
    async (id: string) => {
      const source = state.sources.find(s => s.id === id);
      if (!source) return;

      await updateSource(id, { is_active: !source.is_active });
    },
    [state.sources, updateSource]
  );

  // Trigger immediate fetch for source
  const fetchNow = useCallback(
    async (id: string) => {
      try {
        const response = await fetch('/api/admin/news-sources/fetch-now', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ source_id: id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        // Refresh sources to get updated data
        await fetchSources();
      } catch (error) {
        console.error('Error triggering fetch:', error);
        throw error;
      }
    },
    [fetchSources]
  );

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchSources(), fetchCategories()]);
  }, [fetchSources, fetchCategories]);

  // Initial data load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    fetchSources,
    fetchCategories,
    createSource,
    updateSource,
    deleteSource,
    testSource,
    toggleSource,
    fetchNow,
    refresh,
  };
}
