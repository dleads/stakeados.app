import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export interface SearchFilters {
  category_id?: string;
  author_id?: string;
  status?: 'draft' | 'review' | 'published' | 'archived';
  date_from?: string;
  date_to?: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  content_type: 'article' | 'news';
  summary?: string;
  author_name?: string;
  category_name?: string;
  published_at?: string;
  rank: number;
  highlight: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  search_query?: string;
  search_type: 'articles' | 'news' | 'categories' | 'tags' | 'global';
  filters: SearchFilters;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchAnalytics {
  summary: {
    total_searches: number;
    avg_results_count: number;
    avg_duration_ms: number;
    no_results_rate: number;
  };
  top_queries: Array<{ query: string; count: number }>;
  type_distribution: Record<string, number>;
  period: {
    start_date: string;
    end_date: string;
    period: string;
  };
}

interface UseAdvancedSearchOptions {
  initialQuery?: string;
  initialContentTypes?: Array<'articles' | 'news' | 'categories' | 'tags'>;
  initialFilters?: SearchFilters;
  autoSearch?: boolean;
  debounceMs?: number;
}

export function useAdvancedSearch(options: UseAdvancedSearchOptions = {}) {
  const {
    initialQuery = '',
    initialContentTypes = ['articles', 'news'],
    initialFilters = {},
    autoSearch = true,
    debounceMs = 300,
  } = options;

  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [contentTypes, setContentTypes] = useState(initialContentTypes);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    has_more: false,
  });

  // Saved searches state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoadingSavedSearches, setIsLoadingSavedSearches] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Debounced query for auto-search
  const debouncedQuery = useDebounce(query, debounceMs);

  // Search function
  const performSearch = useCallback(
    async (
      searchQuery: string = query,
      searchContentTypes: typeof contentTypes = contentTypes,
      searchFilters: SearchFilters = filters,
      offset: number = 0,
      trackAnalytics: boolean = true
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          query: searchQuery,
          content_types: searchContentTypes.join(','),
          filters: JSON.stringify(searchFilters),
          limit: pagination.limit.toString(),
          offset: offset.toString(),
          track_analytics: trackAnalytics.toString(),
        });

        const response = await fetch(`/api/admin/search?${searchParams}`);

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();

        if (offset === 0) {
          setResults(data.results);
        } else {
          setResults(prev => [...prev, ...data.results]);
        }

        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [query, contentTypes, filters, pagination.limit]
  );

  // Load more results
  const loadMore = useCallback(() => {
    if (pagination.has_more && !isLoading) {
      performSearch(
        query,
        contentTypes,
        filters,
        pagination.offset + pagination.limit,
        false
      );
    }
  }, [performSearch, query, contentTypes, filters, pagination, isLoading]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setPagination(prev => ({ ...prev, total: 0, offset: 0, has_more: false }));
    setError(null);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Saved searches functions
  const loadSavedSearches = useCallback(async () => {
    setIsLoadingSavedSearches(true);
    try {
      const response = await fetch('/api/admin/search/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.saved_searches);
      }
    } catch (err) {
      console.error('Error loading saved searches:', err);
    } finally {
      setIsLoadingSavedSearches(false);
    }
  }, []);

  const saveSearch = useCallback(
    async (name: string, isDefault: boolean = false) => {
      try {
        const response = await fetch('/api/admin/search/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            search_query: query,
            search_type: contentTypes.length === 1 ? contentTypes[0] : 'global',
            filters,
            is_default: isDefault,
          }),
        });

        if (response.ok) {
          await loadSavedSearches();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error saving search:', err);
        return false;
      }
    },
    [query, contentTypes, filters, loadSavedSearches]
  );

  const deleteSavedSearch = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/search/saved/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedSearches(prev => prev.filter(search => search.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting saved search:', err);
      return false;
    }
  }, []);

  const applySavedSearch = useCallback((savedSearch: SavedSearch) => {
    setQuery(savedSearch.search_query || '');
    setContentTypes(
      savedSearch.search_type === 'global'
        ? ['articles', 'news']
        : [savedSearch.search_type as any]
    );
    setFilters(savedSearch.filters);
  }, []);

  // Analytics functions
  const loadAnalytics = useCallback(async (period: string = 'week') => {
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch(
        `/api/admin/search/analytics?period=${period}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  const trackResultClick = useCallback(async (resultId: string) => {
    try {
      await fetch('/api/admin/search/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result_id: resultId }),
      });
    } catch (err) {
      console.error('Error tracking result click:', err);
    }
  }, []);

  // Auto-search effect
  useEffect(() => {
    if (autoSearch && (debouncedQuery || Object.keys(filters).length > 0)) {
      performSearch(debouncedQuery, contentTypes, filters, 0);
    }
  }, [debouncedQuery, contentTypes, filters, autoSearch, performSearch]);

  // Load saved searches on mount
  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  return {
    // Search state
    query,
    setQuery,
    contentTypes,
    setContentTypes,
    filters,
    updateFilters,
    clearFilters,
    results,
    isLoading,
    error,
    pagination,

    // Search actions
    performSearch,
    loadMore,
    clearSearch,

    // Saved searches
    savedSearches,
    isLoadingSavedSearches,
    saveSearch,
    deleteSavedSearch,
    applySavedSearch,
    loadSavedSearches,

    // Analytics
    analytics,
    isLoadingAnalytics,
    loadAnalytics,
    trackResultClick,
  };
}
