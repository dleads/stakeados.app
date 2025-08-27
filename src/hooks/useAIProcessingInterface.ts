'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DuplicateGroup {
  group_id: string;
  primary_item: {
    id: string;
    title: string;
    content: string;
    source_name: string;
    created_at: string;
    processed: boolean;
  };
  duplicate_items: Array<{
    id: string;
    title: string;
    content: string;
    source_name: string;
    created_at: string;
    processed: boolean;
  }>;
  detection_details: Array<{
    id: string;
    similarity: number;
    confidence: number;
    reasons: string[];
    title: string;
  }>;
  group_statistics: {
    total_items: number;
    avg_similarity: number;
    avg_confidence: number;
    min_similarity: number;
    max_similarity: number;
  };
  recommended_action: string;
  risk_level: 'low' | 'medium' | 'high';
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
    categorize?: boolean;
    translate?: boolean;
    target_language?: string;
  };
  error_message?: string;
}

export interface AIProcessingConfig {
  similarity_threshold: number;
  batch_size: number;
  processing_options: {
    generate_summary: boolean;
    extract_keywords: boolean;
    calculate_relevance: boolean;
    detect_duplicates: boolean;
    categorize: boolean;
    translate: boolean;
    target_language?: string;
  };
  duplicate_detection: {
    similarity_threshold: number;
    title_weight: number;
    content_weight: number;
    include_processed: boolean;
    date_range_days: number;
  };
  rate_limiting: {
    requests_per_minute: number;
    concurrent_jobs: number;
    retry_attempts: number;
  };
}

export interface ProcessingQueue {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total_items: number;
  estimated_completion: string;
}

export interface DuplicateFilters {
  similarity_threshold: number;
  include_processed: boolean;
  date_range_days: number;
  risk_level: 'all' | 'low' | 'medium' | 'high';
}

export interface AIProcessingInterfaceState {
  // Data
  duplicateGroups: DuplicateGroup[];
  processingJobs: AIProcessingJob[];
  processingConfig: AIProcessingConfig;
  processingQueue: ProcessingQueue;

  // UI State
  activeTab: 'monitor' | 'duplicates' | 'config' | 'queue';
  selectedDuplicates: Set<string>;
  duplicateFilters: DuplicateFilters;

  // Loading States
  loading: boolean;
  duplicatesLoading: boolean;
  jobsLoading: boolean;
  configLoading: boolean;

  // Error States
  error: string | null;
  duplicatesError: string | null;
  jobsError: string | null;
  configError: string | null;

  // Auto-refresh
  autoRefresh: boolean;
  lastUpdated: Date | null;
}

export interface AIProcessingInterfaceActions {
  // Tab Management
  setActiveTab: (tab: 'monitor' | 'duplicates' | 'config' | 'queue') => void;

  // Duplicate Management
  fetchDuplicates: () => Promise<void>;
  resolveDuplicates: (
    groupId: string,
    keepId: string,
    deleteIds: string[]
  ) => Promise<void>;
  setDuplicateFilters: (filters: Partial<DuplicateFilters>) => void;
  toggleDuplicateSelection: (groupId: string) => void;
  clearDuplicateSelection: () => void;

  // Processing Jobs
  fetchProcessingJobs: () => Promise<void>;
  startBatchProcessing: (
    options?: Partial<AIProcessingJob['processing_options']>
  ) => Promise<string>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;

  // Configuration
  updateConfig: (section: keyof AIProcessingConfig, updates: any) => void;
  saveConfig: () => Promise<void>;
  resetConfig: () => void;

  // Queue Management
  fetchProcessingQueue: () => Promise<void>;
  pauseQueue: () => Promise<void>;
  resumeQueue: () => Promise<void>;
  processAllPending: () => Promise<void>;
  retryFailedItems: () => Promise<void>;
  clearFailedQueue: () => Promise<void>;

  // General
  setAutoRefresh: (enabled: boolean) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const defaultConfig: AIProcessingConfig = {
  similarity_threshold: 0.8,
  batch_size: 10,
  processing_options: {
    generate_summary: true,
    extract_keywords: true,
    calculate_relevance: true,
    detect_duplicates: true,
    categorize: true,
    translate: false,
  },
  duplicate_detection: {
    similarity_threshold: 0.8,
    title_weight: 0.6,
    content_weight: 0.4,
    include_processed: true,
    date_range_days: 30,
  },
  rate_limiting: {
    requests_per_minute: 60,
    concurrent_jobs: 3,
    retry_attempts: 3,
  },
};

const defaultFilters: DuplicateFilters = {
  similarity_threshold: 0.8,
  include_processed: true,
  date_range_days: 30,
  risk_level: 'all',
};

const initialState: AIProcessingInterfaceState = {
  duplicateGroups: [],
  processingJobs: [],
  processingConfig: defaultConfig,
  processingQueue: {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total_items: 0,
    estimated_completion: '',
  },
  activeTab: 'monitor',
  selectedDuplicates: new Set(),
  duplicateFilters: defaultFilters,
  loading: false,
  duplicatesLoading: false,
  jobsLoading: false,
  configLoading: false,
  error: null,
  duplicatesError: null,
  jobsError: null,
  configError: null,
  autoRefresh: true,
  lastUpdated: null,
};

export function useAIProcessingInterface(): AIProcessingInterfaceState &
  AIProcessingInterfaceActions {
  const [state, setState] = useState<AIProcessingInterfaceState>(initialState);

  // Fetch duplicate groups
  const fetchDuplicates = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        duplicatesLoading: true,
        duplicatesError: null,
      }));

      const params = new URLSearchParams({
        similarity_threshold:
          state.duplicateFilters.similarity_threshold.toString(),
        include_processed: state.duplicateFilters.include_processed.toString(),
        date_range_days: state.duplicateFilters.date_range_days.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/news/duplicates?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let groups = data.duplicates || [];

      // Filter by risk level if specified
      if (state.duplicateFilters.risk_level !== 'all') {
        groups = groups.filter(
          (group: DuplicateGroup) =>
            group.risk_level === state.duplicateFilters.risk_level
        );
      }

      setState(prev => ({
        ...prev,
        duplicateGroups: groups,
        duplicatesError: null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      setState(prev => ({
        ...prev,
        duplicatesError:
          error instanceof Error ? error.message : 'Failed to fetch duplicates',
      }));
    } finally {
      setState(prev => ({ ...prev, duplicatesLoading: false }));
    }
  }, [state.duplicateFilters]);

  // Resolve duplicate group
  const resolveDuplicates = useCallback(
    async (groupId: string, keepId: string, deleteIds: string[]) => {
      try {
        const response = await fetch('/api/admin/news/duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resolve_duplicates',
            group_id: groupId,
            keep_id: keepId,
            delete_ids: deleteIds,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Remove resolved group from state
        setState(prev => ({
          ...prev,
          duplicateGroups: prev.duplicateGroups.filter(
            group => group.group_id !== groupId
          ),
          selectedDuplicates: new Set(
            [...prev.selectedDuplicates].filter(id => id !== groupId)
          ),
        }));
      } catch (error) {
        console.error('Error resolving duplicates:', error);
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to resolve duplicates',
        }));
      }
    },
    []
  );

  // Fetch processing jobs
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
        lastUpdated: new Date(),
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

  // Start batch processing
  const startBatchProcessing = useCallback(
    async (
      options?: Partial<AIProcessingJob['processing_options']>
    ): Promise<string> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const processingOptions = options
          ? { ...state.processingConfig.processing_options, ...options }
          : state.processingConfig.processing_options;

        const response = await fetch('/api/admin/ai/process-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            processing_options: processingOptions,
            batch_size: state.processingConfig.batch_size,
            priority: 'normal',
          }),
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
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to start batch processing',
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    },
    [state.processingConfig, fetchProcessingJobs]
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
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to cancel job',
        }));
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
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to retry job',
        }));
      }
    },
    [fetchProcessingJobs]
  );

  // Fetch processing queue
  const fetchProcessingQueue = useCallback(async () => {
    try {
      // This would fetch queue statistics from an API
      // For now, we'll use mock data
      const mockQueue: ProcessingQueue = {
        pending: 15,
        processing: 3,
        completed: 142,
        failed: 8,
        total_items: 168,
        estimated_completion: new Date(Date.now() + 1800000).toISOString(), // 30 minutes from now
      };

      setState(prev => ({
        ...prev,
        processingQueue: mockQueue,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching processing queue:', error);
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback(
    (section: keyof AIProcessingConfig, updates: any) => {
      setState(prev => ({
        ...prev,
        processingConfig: {
          ...prev.processingConfig,
          [section]: { ...prev.processingConfig[section], ...updates },
        },
      }));
    },
    []
  );

  // Save configuration
  const saveConfig = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, configLoading: true, configError: null }));

      // This would save configuration to an API
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Configuration saved:', state.processingConfig);

      setState(prev => ({
        ...prev,
        configError: null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error saving configuration:', error);
      setState(prev => ({
        ...prev,
        configError:
          error instanceof Error
            ? error.message
            : 'Failed to save configuration',
      }));
    } finally {
      setState(prev => ({ ...prev, configLoading: false }));
    }
  }, [state.processingConfig]);

  // Set active tab
  const setActiveTab = useCallback(
    (tab: 'monitor' | 'duplicates' | 'config' | 'queue') => {
      setState(prev => ({ ...prev, activeTab: tab }));
    },
    []
  );

  // Set duplicate filters
  const setDuplicateFilters = useCallback(
    (filters: Partial<DuplicateFilters>) => {
      setState(prev => ({
        ...prev,
        duplicateFilters: { ...prev.duplicateFilters, ...filters },
      }));
    },
    []
  );

  // Toggle duplicate selection
  const toggleDuplicateSelection = useCallback((groupId: string) => {
    setState(prev => {
      const newSet = new Set(prev.selectedDuplicates);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return { ...prev, selectedDuplicates: newSet };
    });
  }, []);

  // Clear duplicate selection
  const clearDuplicateSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedDuplicates: new Set() }));
  }, []);

  // Queue management functions
  const pauseQueue = useCallback(async () => {
    console.log('Pausing queue...');
  }, []);

  const resumeQueue = useCallback(async () => {
    console.log('Resuming queue...');
  }, []);

  const processAllPending = useCallback(async () => {
    console.log('Processing all pending items...');
  }, []);

  const retryFailedItems = useCallback(async () => {
    console.log('Retrying failed items...');
  }, []);

  const clearFailedQueue = useCallback(async () => {
    console.log('Clearing failed queue...');
  }, []);

  // Set auto refresh
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoRefresh: enabled }));
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchDuplicates(),
      fetchProcessingJobs(),
      fetchProcessingQueue(),
    ]);
  }, [fetchDuplicates, fetchProcessingJobs, fetchProcessingQueue]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      duplicatesError: null,
      jobsError: null,
      configError: null,
    }));
  }, []);

  // Reset config
  const resetConfig = useCallback(() => {
    setState(prev => ({ ...prev, processingConfig: defaultConfig }));
  }, []);

  // Initial data load
  useEffect(() => {
    fetchProcessingJobs();
    fetchProcessingQueue();
  }, [fetchProcessingJobs, fetchProcessingQueue]);

  // Load duplicates when filters change
  useEffect(() => {
    if (state.activeTab === 'duplicates') {
      fetchDuplicates();
    }
  }, [state.duplicateFilters, state.activeTab, fetchDuplicates]);

  // Auto refresh interval
  useEffect(() => {
    if (!state.autoRefresh) return;

    const interval = setInterval(() => {
      if (!state.loading && !state.duplicatesLoading && !state.jobsLoading) {
        refresh();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [
    state.autoRefresh,
    state.loading,
    state.duplicatesLoading,
    state.jobsLoading,
    refresh,
  ]);

  return {
    ...state,
    setActiveTab,
    fetchDuplicates,
    resolveDuplicates,
    setDuplicateFilters,
    toggleDuplicateSelection,
    clearDuplicateSelection,
    fetchProcessingJobs,
    startBatchProcessing,
    cancelJob,
    retryJob,
    updateConfig,
    saveConfig,
    resetConfig,
    fetchProcessingQueue,
    pauseQueue,
    resumeQueue,
    processAllPending,
    retryFailedItems,
    clearFailedQueue,
    setAutoRefresh,
    refresh,
    clearError,
  };
}
