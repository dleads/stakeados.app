import { createClient } from '@/lib/supabase/client';

type ContentInteraction = any;
type ContentMetric = any;

export interface MetricsCollectionOptions {
  enableRealTime?: boolean;
  batchSize?: number;
  flushInterval?: number; // milliseconds
}

export class MetricsCollectionService {
  private supabase = createClient();
  private interactionQueue: ContentInteraction[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private options: Required<MetricsCollectionOptions>;

  constructor(options: MetricsCollectionOptions = {}) {
    this.options = {
      enableRealTime: true,
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      ...options,
    };

    // Start periodic flush if real-time is enabled
    if (this.options.enableRealTime) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Track a user interaction with content
   */
  async trackInteraction(
    interaction: Omit<ContentInteraction, 'id' | 'created_at'>
  ) {
    try {
      if (this.options.enableRealTime) {
        // Add to queue for batch processing
        this.interactionQueue.push({
          ...interaction,
          created_at: new Date().toISOString(),
        });

        // Flush immediately if queue is full
        if (this.interactionQueue.length >= this.options.batchSize) {
          await this.flushQueue();
        }
      } else {
        // Insert immediately
        const { error } = await this.supabase
          .from('content_interactions' as any)
          .insert([interaction]);

        if (error) {
          console.error('Error tracking interaction:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in trackInteraction:', error);
      throw error;
    }
  }

  /**
   * Track a page view
   */
  async trackView(
    contentId: string,
    contentType: 'article' | 'news',
    userId?: string,
    metadata: Record<string, any> = {}
  ) {
    return this.trackInteraction({
      user_id: userId || null,
      content_id: contentId,
      content_type: contentType,
      interaction_type: 'view',
      interaction_value: 1,
      metadata,
      session_id: this.getSessionId(),
      device_info: this.getDeviceInfo(),
      referrer: typeof window !== 'undefined' ? document.referrer : null,
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
    });
  }

  /**
   * Track engagement (like, share, bookmark, comment)
   */
  async trackEngagement(
    contentId: string,
    contentType: 'article' | 'news',
    engagementType: 'like' | 'share' | 'bookmark' | 'comment',
    userId?: string,
    metadata: Record<string, any> = {}
  ) {
    return this.trackInteraction({
      user_id: userId || null,
      content_id: contentId,
      content_type: contentType,
      interaction_type: engagementType,
      interaction_value: 1,
      metadata,
      session_id: this.getSessionId(),
      device_info: this.getDeviceInfo(),
      referrer: typeof window !== 'undefined' ? document.referrer : null,
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
    });
  }

  /**
   * Track scroll depth
   */
  async trackScroll(
    contentId: string,
    contentType: 'article' | 'news',
    scrollDepth: number,
    userId?: string,
    metadata: Record<string, any> = {}
  ) {
    return this.trackInteraction({
      user_id: userId || null,
      content_id: contentId,
      content_type: contentType,
      interaction_type: 'scroll',
      interaction_value: scrollDepth,
      metadata,
      session_id: this.getSessionId(),
      device_info: this.getDeviceInfo(),
      referrer: typeof window !== 'undefined' ? document.referrer : null,
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
    });
  }

  /**
   * Get real-time metrics for content
   */
  async getContentMetrics(
    contentId: string,
    contentType: 'article' | 'news',
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ContentMetric[]> {
    try {
      let query = this.supabase
        .from('content_metrics' as any)
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .order('recorded_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('date', dateFrom.toISOString().split('T')[0]);
      }

      if (dateTo) {
        query = query.lte('date', dateTo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching content metrics:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getContentMetrics:', error);
      throw error;
    }
  }

  /**
   * Get trending content
   */
  async getTrendingContent(
    contentType?: 'article' | 'news',
    limit: number = 10,
    hours: number = 24
  ) {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_trending_content' as any,
        {
          p_content_type: contentType || null,
          p_limit: limit,
          p_hours: hours,
        }
      );

      if (error) {
        console.error('Error fetching trending content:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrendingContent:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time metrics updates
   */
  subscribeToMetrics(
    contentId: string,
    contentType: 'article' | 'news',
    callback: (metrics: ContentMetric[]) => void
  ) {
    const channel = this.supabase
      .channel(`metrics:${contentType}:${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_metrics',
          filter: `content_id=eq.${contentId}`,
        },
        async () => {
          // Fetch updated metrics
          const metrics = await this.getContentMetrics(contentId, contentType);
          callback(metrics);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  /**
   * Flush the interaction queue
   */
  private async flushQueue() {
    if (this.interactionQueue.length === 0) return;

    const interactions = [...this.interactionQueue];
    this.interactionQueue = [];

    try {
      const { error } = await this.supabase
        .from('content_interactions' as any)
        .insert(interactions);

      if (error) {
        console.error('Error flushing interaction queue:', error);
        // Re-add failed interactions to queue
        this.interactionQueue.unshift(...interactions);
        throw error;
      }
    } catch (error) {
      console.error('Error in flushQueue:', error);
      // Re-add failed interactions to queue
      this.interactionQueue.unshift(...interactions);
      throw error;
    }
  }

  /**
   * Start periodic queue flushing
   */
  private startPeriodicFlush() {
    this.flushTimer = setInterval(async () => {
      if (this.interactionQueue.length > 0) {
        try {
          await this.flushQueue();
        } catch (error) {
          console.error('Error in periodic flush:', error);
        }
      }
    }, this.options.flushInterval);
  }

  /**
   * Stop periodic queue flushing
   */
  private stopPeriodicFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string | null {
    if (typeof window === 'undefined') return null;

    let sessionId = sessionStorage.getItem('metrics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('metrics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    return {
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      user_agent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopPeriodicFlush();
    // Flush any remaining interactions
    if (this.interactionQueue.length > 0) {
      this.flushQueue().catch(console.error);
    }
  }
}

// Singleton instance for global use
export const metricsService = new MetricsCollectionService();

// Hook for React components
export function useMetrics() {
  return {
    trackView: metricsService.trackView.bind(metricsService),
    trackEngagement: metricsService.trackEngagement.bind(metricsService),
    trackScroll: metricsService.trackScroll.bind(metricsService),
    getContentMetrics: metricsService.getContentMetrics.bind(metricsService),
    getTrendingContent: metricsService.getTrendingContent.bind(metricsService),
    subscribeToMetrics: metricsService.subscribeToMetrics.bind(metricsService),
  };
}
