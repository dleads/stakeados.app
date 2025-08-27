'use client';

import { useState, useCallback } from 'react';
import {
  processAndStoreNewsArticle,
  batchProcessRSSFeed,
  reprocessExistingArticles,
  getProcessingStatistics,
  cleanupLowQualityArticles,
  type RSSFeedItem,
} from '@/lib/ai/newsProcessor';
import {
  fetchAllRSSFeeds,
  getFeedHealthStatus,
  testRSSFeedConnectivity,
  RSS_FEEDS,
} from '@/lib/ai/rssAggregator';
import { isOpenAIConfigured, testOpenAIConnection } from '@/lib/ai/openai';

interface NewsProcessingState {
  isProcessing: boolean;
  isFetching: boolean;
  isConfigured: boolean;
  connectionStatus: 'unknown' | 'connected' | 'error';
  error: string | null;
  success: string | null;
  statistics: {
    totalArticles: number;
    processedArticles: number;
    averageRelevanceScore: number;
    topCategories: Array<{ category: string; count: number }>;
    processingRate: number;
  };
  lastProcessingResult: {
    processed: number;
    stored: number;
    duplicates: number;
    lowRelevance: number;
    errors: number;
  } | null;
  feedHealth: Array<{
    feedName: string;
    status: 'healthy' | 'warning' | 'error';
    lastSuccessfulFetch?: Date;
    errorCount: number;
    avgItemsPerFetch: number;
  }>;
}

export function useNewsProcessing() {
  const [state, setState] = useState<NewsProcessingState>({
    isProcessing: false,
    isFetching: false,
    isConfigured: isOpenAIConfigured(),
    connectionStatus: 'unknown',
    error: null,
    success: null,
    statistics: {
      totalArticles: 0,
      processedArticles: 0,
      averageRelevanceScore: 0,
      topCategories: [],
      processingRate: 0,
    },
    lastProcessingResult: null,
    feedHealth: [],
  });

  // Test OpenAI connection
  const testConnection = useCallback(async () => {
    setState(prev => ({ ...prev, connectionStatus: 'unknown' }));

    try {
      const isConnected = await testOpenAIConnection();
      setState(prev => ({
        ...prev,
        connectionStatus: isConnected ? 'connected' : 'error',
        error: isConnected ? null : 'Failed to connect to OpenAI API',
      }));
      return isConnected;
    } catch (error) {
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error:
          error instanceof Error ? error.message : 'Connection test failed',
      }));
      return false;
    }
  }, []);

  // Fetch and process RSS feeds
  const fetchAndProcessFeeds = useCallback(async () => {
    if (!state.isConfigured) {
      setState(prev => ({ ...prev, error: 'OpenAI API key not configured' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isFetching: true,
      isProcessing: true,
      error: null,
      success: null,
    }));

    try {
      // Fetch RSS feeds
      const { items, feedResults } = await fetchAllRSSFeeds();

      setState(prev => ({
        ...prev,
        isFetching: false,
        success: `Fetched ${items.length} articles from ${feedResults.length} feeds`,
      }));

      // Process articles with AI
      const processingResult = await batchProcessRSSFeed(items);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastProcessingResult: processingResult,
        success: `Processing complete: ${processingResult.stored} articles stored, ${processingResult.duplicates} duplicates filtered`,
      }));

      // Update statistics
      await loadStatistics();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isFetching: false,
        isProcessing: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch and process feeds',
      }));
    }
  }, [state.isConfigured]);

  // Process single article
  const processSingleArticle = useCallback(
    async (feedItem: RSSFeedItem) => {
      if (!state.isConfigured) {
        setState(prev => ({ ...prev, error: 'OpenAI API key not configured' }));
        return { success: false };
      }

      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        success: null,
      }));

      try {
        const result = await processAndStoreNewsArticle(feedItem);

        if (result.success) {
          setState(prev => ({
            ...prev,
            isProcessing: false,
            success: 'Article processed and stored successfully',
          }));
          await loadStatistics();
        } else {
          setState(prev => ({
            ...prev,
            isProcessing: false,
            error: result.error || 'Failed to process article',
          }));
        }

        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to process article',
        }));
        return { success: false };
      }
    },
    [state.isConfigured]
  );

  // Reprocess existing articles
  const reprocessArticles = useCallback(
    async (limit: number = 10) => {
      if (!state.isConfigured) {
        setState(prev => ({ ...prev, error: 'OpenAI API key not configured' }));
        return;
      }

      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        success: null,
      }));

      try {
        const result = await reprocessExistingArticles(limit);

        setState(prev => ({
          ...prev,
          isProcessing: false,
          success: `Reprocessed ${result.updated} articles (${result.errors} errors)`,
        }));

        await loadStatistics();
      } catch (error) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to reprocess articles',
        }));
      }
    },
    [state.isConfigured]
  );

  // Load processing statistics
  const loadStatistics = useCallback(async () => {
    try {
      const statistics = await getProcessingStatistics();
      setState(prev => ({ ...prev, statistics }));
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  // Load feed health status
  const loadFeedHealth = useCallback(async () => {
    try {
      const feedHealth = await getFeedHealthStatus();
      setState(prev => ({ ...prev, feedHealth }));
    } catch (error) {
      console.error('Error loading feed health:', error);
    }
  }, []);

  // Test RSS feed connectivity
  const testFeedConnectivity = useCallback(async (feedUrl: string) => {
    try {
      return await testRSSFeedConnectivity(feedUrl);
    } catch (error) {
      console.error('Error testing feed connectivity:', error);
      return {
        success: false,
        responseTime: 0,
        itemCount: 0,
        error: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }, []);

  // Cleanup low-quality articles
  const cleanupLowQuality = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      success: null,
    }));

    try {
      const result = await cleanupLowQualityArticles();

      setState(prev => ({
        ...prev,
        isProcessing: false,
        success: `Cleaned up ${result.deleted} low-quality articles`,
      }));

      await loadStatistics();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error:
          error instanceof Error ? error.message : 'Failed to cleanup articles',
      }));
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Get available RSS feeds
  const getAvailableFeeds = useCallback(() => {
    return RSS_FEEDS.map(feed => ({
      ...feed,
      enabled: true,
      errorCount: 0,
    }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    testConnection,
    fetchAndProcessFeeds,
    processSingleArticle,
    reprocessArticles,
    loadStatistics,
    loadFeedHealth,
    testFeedConnectivity,
    cleanupLowQuality,
    clearMessages,

    // Utilities
    getAvailableFeeds,

    // Status
    canProcess: state.isConfigured && state.connectionStatus === 'connected',
  };
}
