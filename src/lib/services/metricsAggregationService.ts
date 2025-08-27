import { createClient } from '@/lib/supabase/server';

type MetricsAggregationJob = any;

export class MetricsAggregationService {
  private supabase = createClient();

  /**
   * Run daily metrics aggregation
   */
  async runDailyAggregation(targetDate?: Date): Promise<MetricsAggregationJob> {
    try {
      const date = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      // Call the database function to aggregate daily metrics
      const { error } = await this.supabase.rpc(
        'aggregate_daily_metrics' as any,
        {
          target_date: date.toISOString().split('T')[0],
        }
      );

      if (error) {
        console.error('Error running daily aggregation:', error);
        throw error;
      }

      // Get the latest job record
      const { data: job, error: jobError } = await this.supabase
        .from('metrics_aggregation_jobs' as any)
        .select('*')
        .eq('job_type', 'daily_aggregation')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (jobError) {
        console.error('Error fetching job record:', jobError);
        throw jobError;
      }

      return job as any;
    } catch (error) {
      console.error('Error in runDailyAggregation:', error);
      throw error;
    }
  }

  /**
   * Run weekly metrics aggregation
   */
  async runWeeklyAggregation(): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create job record
      const { data: job, error: jobError } = await this.supabase
        .from('metrics_aggregation_jobs' as any)
        .insert([
          {
            job_type: 'weekly_aggregation',
            status: 'running',
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (jobError) {
        console.error('Error creating weekly aggregation job:', jobError);
        throw jobError;
      }

      try {
        // Aggregate weekly performance snapshots
        const { error: aggregationError } = await this.supabase
          .from('content_performance_snapshots' as any)
          .insert([]).select(`
            content_id,
            content_type,
            'weekly' as period_type,
            ${startDate.toISOString().split('T')[0]} as snapshot_date,
            SUM(total_views) as total_views,
            SUM(unique_views) as unique_views,
            SUM(total_engagement) as total_engagement,
            AVG(average_rating) as average_rating
          `);

        if (aggregationError) {
          throw aggregationError;
        }

        // Update job status
        await this.supabase
          .from('metrics_aggregation_jobs' as any)
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', (job as any).id);
      } catch (error) {
        // Update job status on error
        await this.supabase
          .from('metrics_aggregation_jobs' as any)
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', (job as any).id);

        throw error;
      }
    } catch (error) {
      console.error('Error in runWeeklyAggregation:', error);
      throw error;
    }
  }

  /**
   * Run monthly metrics aggregation
   */
  async runMonthlyAggregation(): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth() - 1,
        1
      );

      // Create job record
      const { data: job, error: jobError } = await this.supabase
        .from('metrics_aggregation_jobs' as any)
        .insert([
          {
            job_type: 'monthly_aggregation',
            status: 'running',
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (jobError) {
        console.error('Error creating monthly aggregation job:', jobError);
        throw jobError;
      }

      try {
        // Generate author analytics for the month
        const { error: authorAnalyticsError } = await this.supabase
          .from('author_analytics' as any)
          .upsert([]).select(`
            author_id,
            ${startDate.toISOString().split('T')[0]} as period_start,
            ${endDate.toISOString().split('T')[0]} as period_end,
            'monthly' as period_type,
            COUNT(DISTINCT a.id) as articles_published,
            SUM(ca.views) as total_views,
            SUM(ca.likes + ca.shares + ca.bookmarks + ca.comments) as total_engagement,
            AVG(ca.engagement_score) as engagement_rate
          `);

        if (authorAnalyticsError) {
          throw authorAnalyticsError;
        }

        // Update job status
        await this.supabase
          .from('metrics_aggregation_jobs' as any)
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', (job as any).id);
      } catch (error) {
        // Update job status on error
        await this.supabase
          .from('metrics_aggregation_jobs' as any)
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', (job as any).id);

        throw error;
      }
    } catch (error) {
      console.error('Error in runMonthlyAggregation:', error);
      throw error;
    }
  }

  /**
   * Clean up old metrics data
   */
  async runCleanup(retentionDays: number = 90): Promise<MetricsAggregationJob> {
    try {
      // Call the database function to clean up old data
      const { error } = await this.supabase.rpc('cleanup_old_metrics' as any, {
        retention_days: retentionDays,
      });

      if (error) {
        console.error('Error running cleanup:', error);
        throw error;
      }

      // Get the latest cleanup job record
      const { data: job, error: jobError } = await this.supabase
        .from('metrics_aggregation_jobs' as any)
        .select('*')
        .eq('job_type', 'cleanup')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (jobError) {
        console.error('Error fetching cleanup job record:', jobError);
        throw jobError;
      }

      return job as any;
    } catch (error) {
      console.error('Error in runCleanup:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<MetricsAggregationJob | null> {
    try {
      const { data, error } = await this.supabase
        .from('metrics_aggregation_jobs' as any)
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job status:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error in getJobStatus:', error);
      return null;
    }
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(limit: number = 10): Promise<MetricsAggregationJob[]> {
    try {
      const { data, error } = await this.supabase
        .from('metrics_aggregation_jobs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent jobs:', error);
        throw error;
      }

      return (data || []) as any;
    } catch (error) {
      console.error('Error in getRecentJobs:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic aggregation jobs
   */
  async scheduleAutomaticJobs(): Promise<void> {
    try {
      // This would typically be called by a cron job or scheduled task
      const now = new Date();
      const hour = now.getHours();

      // Run daily aggregation at 2 AM
      if (hour === 2) {
        await this.runDailyAggregation();
      }

      // Run weekly aggregation on Sundays at 3 AM
      if (now.getDay() === 0 && hour === 3) {
        await this.runWeeklyAggregation();
      }

      // Run monthly aggregation on the 1st of each month at 4 AM
      if (now.getDate() === 1 && hour === 4) {
        await this.runMonthlyAggregation();
      }

      // Run cleanup weekly on Saturdays at 1 AM
      if (now.getDay() === 6 && hour === 1) {
        await this.runCleanup();
      }
    } catch (error) {
      console.error('Error in scheduleAutomaticJobs:', error);
      throw error;
    }
  }

  /**
   * Update trending content scores
   */
  async updateTrendingScores(): Promise<void> {
    try {
      // Call the database function to update trending content
      const { error } = await this.supabase.rpc(
        'update_trending_content' as any
      );

      if (error) {
        console.error('Error updating trending scores:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateTrendingScores:', error);
      throw error;
    }
  }

  /**
   * Get aggregation statistics
   */
  async getAggregationStats(): Promise<{
    totalInteractions: number;
    totalMetrics: number;
    lastAggregation: string | null;
    pendingJobs: number;
  }> {
    try {
      // Get total interactions count
      const { count: interactionsCount, error: interactionsError } =
        await this.supabase
          .from('content_interactions' as any)
          .select('*', { count: 'exact', head: true });

      if (interactionsError) {
        throw interactionsError;
      }

      // Get total metrics count
      const { count: metricsCount, error: metricsError } = await this.supabase
        .from('content_metrics' as any)
        .select('*', { count: 'exact', head: true });

      if (metricsError) {
        throw metricsError;
      }

      // Get last successful aggregation
      const { data: lastJob, error: lastJobError } = await this.supabase
        .from('metrics_aggregation_jobs' as any)
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (lastJobError && lastJobError.code !== 'PGRST116') {
        throw lastJobError;
      }

      // Get pending jobs count
      const { count: pendingCount, error: pendingError } = await this.supabase
        .from('metrics_aggregation_jobs' as any)
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'running']);

      if (pendingError) {
        throw pendingError;
      }

      return {
        totalInteractions: interactionsCount || 0,
        totalMetrics: metricsCount || 0,
        lastAggregation: (lastJob as any)?.completed_at || null,
        pendingJobs: pendingCount || 0,
      };
    } catch (error) {
      console.error('Error in getAggregationStats:', error);
      throw error;
    }
  }
}

// Singleton instance
export const metricsAggregationService = new MetricsAggregationService();
