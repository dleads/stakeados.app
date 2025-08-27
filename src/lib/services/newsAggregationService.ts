import { createClient } from '@/lib/supabase/client';
import { newsFetchingService } from './newsFetchingService';
import { newsProcessingService } from './newsProcessingService';

type NewsAggregationJob = any;

export class NewsAggregationService {
  private supabase = createClient();

  // Create a new aggregation job
  async createAggregationJob(
    jobType: 'fetch' | 'process' | 'cleanup',
    sourceId?: string,
    metadata?: Record<string, any>
  ): Promise<NewsAggregationJob> {
    const { data, error } = await this.supabase
      .from('news_aggregation_jobs' as any)
      .insert({
        job_type: jobType,
        source_id: sourceId,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create aggregation job: ${error.message}`);
    }

    return data as NewsAggregationJob;
  }

  // Update job status
  async updateJobStatus(
    jobId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    updates?: {
      articles_fetched?: number;
      articles_processed?: number;
      articles_published?: number;
      error_message?: string;
      metadata?: Record<string, any>;
      started_at?: string;
    }
  ): Promise<void> {
    const updateData: any = { status };

    if (status === 'running' && !updates?.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (updates) {
      Object.assign(updateData, updates);
    }

    const { error } = await this.supabase
      .from('news_aggregation_jobs' as any)
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  // Run news fetching job
  async runFetchJob(): Promise<{
    jobId: string;
    totalArticles: number;
    successfulSources: number;
    failedSources: number;
    errors: Array<{ sourceId: string; sourceName: string; error: string }>;
  }> {
    const job = await this.createAggregationJob('fetch');

    try {
      await this.updateJobStatus(job.id, 'running');

      // Fetch news from all ready sources
      const results = await newsFetchingService.fetchNewsFromAllSources();

      // Update job with results
      await this.updateJobStatus(job.id, 'completed', {
        articles_fetched: results.totalArticles,
        metadata: {
          successful_sources: results.successfulSources,
          failed_sources: results.failedSources,
          errors: results.errors,
        },
      });

      return {
        jobId: job.id,
        ...results,
      };
    } catch (error) {
      await this.updateJobStatus(job.id, 'failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Run processing job (AI processing of raw articles)
  async runProcessingJob(): Promise<{
    jobId: string;
    articlesProcessed: number;
    articlesPublished: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const job = await this.createAggregationJob('process');

    try {
      await this.updateJobStatus(job.id, 'running');

      // Process raw articles with AI
      const results = await newsProcessingService.processRawArticles(50);

      await this.updateJobStatus(job.id, 'completed', {
        articles_processed: results.processed,
        articles_published: results.published,
        metadata: {
          errors: results.errors,
        },
      });

      return {
        jobId: job.id,
        articlesProcessed: results.processed,
        articlesPublished: results.published,
        errors: results.errors,
      };
    } catch (error) {
      await this.updateJobStatus(job.id, 'failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Run cleanup job
  async runCleanupJob(): Promise<{
    jobId: string;
    deletedArticles: number;
  }> {
    const job = await this.createAggregationJob('cleanup');

    try {
      await this.updateJobStatus(job.id, 'running');

      // Cleanup old processed articles
      const { data: deletedCount, error } = await this.supabase.rpc(
        'cleanup_old_raw_articles' as any
      );

      if (error) {
        throw new Error(`Failed to cleanup articles: ${error.message}`);
      }

      await this.updateJobStatus(job.id, 'completed', {
        metadata: {
          deleted_articles: deletedCount,
        },
      });

      return {
        jobId: job.id,
        deletedArticles: deletedCount || 0,
      };
    } catch (error) {
      await this.updateJobStatus(job.id, 'failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Get job history
  async getJobHistory(limit: number = 50): Promise<NewsAggregationJob[]> {
    const { data, error } = await this.supabase
      .from('news_aggregation_jobs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get job history: ${error.message}`);
    }

    return data || [];
  }

  // Get aggregation statistics
  async getAggregationStats(daysBack: number = 7): Promise<{
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    total_articles_fetched: number;
    total_articles_processed: number;
    avg_processing_time: string | null;
  }> {
    const { data, error } = await this.supabase.rpc(
      'get_aggregation_stats' as any,
      { days_back: daysBack }
    );

    if (error) {
      throw new Error(`Failed to get aggregation stats: ${error.message}`);
    }

    return (
      data?.[0] || {
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        total_articles_fetched: 0,
        total_articles_processed: 0,
        avg_processing_time: null,
      }
    );
  }

  // Run full aggregation pipeline
  async runFullPipeline(): Promise<{
    fetchResults: any;
    processResults: any;
    cleanupResults: any;
  }> {
    console.log('Starting full news aggregation pipeline...');

    // Step 1: Fetch news from sources
    console.log('Step 1: Fetching news from sources...');
    const fetchResults = await this.runFetchJob();
    console.log(
      `Fetched ${fetchResults.totalArticles} articles from ${fetchResults.successfulSources} sources`
    );

    // Step 2: Process and validate articles
    console.log('Step 2: Processing and validating articles...');
    const processResults = await this.runProcessingJob();
    console.log(
      `Processed ${processResults.articlesProcessed} articles, published ${processResults.articlesPublished} articles`
    );

    // Step 3: Cleanup old articles
    console.log('Step 3: Cleaning up old articles...');
    const cleanupResults = await this.runCleanupJob();
    console.log(`Cleaned up ${cleanupResults.deletedArticles} old articles`);

    console.log('Full aggregation pipeline completed successfully');

    return {
      fetchResults,
      processResults,
      cleanupResults,
    };
  }

  // Schedule periodic aggregation (this would typically be called by a cron job)
  async schedulePeriodicAggregation(): Promise<void> {
    try {
      // Check if there's already a running job
      const { data: runningJobs, error } = await this.supabase
        .from('news_aggregation_jobs' as any)
        .select('id')
        .eq('status', 'running')
        .limit(1);

      if (error) {
        throw new Error(`Failed to check running jobs: ${error.message}`);
      }

      if (runningJobs && runningJobs.length > 0) {
        console.log('Aggregation job already running, skipping...');
        return;
      }

      // Run the full pipeline
      await this.runFullPipeline();
    } catch (error) {
      console.error('Scheduled aggregation failed:', error);
      throw error;
    }
  }
}

export const newsAggregationService = new NewsAggregationService();
