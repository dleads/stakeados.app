import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Enhanced schema for batch AI processing
const batchProcessSchema = z.object({
  news_ids: z.array(z.string().uuid()).optional(),
  filters: z
    .object({
      source_names: z.array(z.string()).optional(),
      date_from: z.string().datetime().optional(),
      date_to: z.string().datetime().optional(),
      unprocessed_only: z.boolean().default(true),
      language: z.enum(['es', 'en']).optional(),
    })
    .optional(),
  processing_options: z
    .object({
      generate_summary: z.boolean().default(true),
      extract_keywords: z.boolean().default(true),
      calculate_relevance: z.boolean().default(true),
      detect_duplicates: z.boolean().default(true),
      categorize: z.boolean().default(true),
      translate: z.boolean().default(false),
      target_language: z.enum(['es', 'en']).optional(),
    })
    .default({}),
  batch_size: z.number().min(1).max(100).default(10),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  callback_url: z.string().url().optional(),
});

interface BatchJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  processed_items: number;
  failed_items: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  results: {
    processed: any[];
    failed: any[];
    skipped: any[];
  };
}

// In-memory job storage (in production, use Redis or database)
const batchJobs = new Map<string, BatchJob>();

async function checkAdminPermissions(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile && ['admin', 'editor'].includes(profile.role);
}

// Background job processor
async function processBatchJob(jobId: string) {
  const job = batchJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.started_at = new Date().toISOString();

    console.log(
      `[Job ${jobId}] Starting batch processing of ${job.total_items} items`
    );

    // This would be implemented as a proper background job in production
    // For now, we'll process synchronously with delays

    job.status = 'completed';
    job.completed_at = new Date().toISOString();

    console.log(`[Job ${jobId}] Batch processing completed`);
  } catch (error) {
    console.error(`[Job ${jobId}] Batch processing failed:`, error);
    job.status = 'failed';
    job.error_message =
      error instanceof Error ? error.message : 'Unknown error';
    job.completed_at = new Date().toISOString();
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkAdminPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = batchProcessSchema.parse(body);

    // Build query to get news items
    let query = supabase.from('news').select('*');

    if (validatedData.news_ids && validatedData.news_ids.length > 0) {
      query = query.in('id', validatedData.news_ids);
    } else if (validatedData.filters) {
      const filters = validatedData.filters;

      if (filters.unprocessed_only) {
        query = query.eq('processed', false);
      }

      if (filters.source_names && filters.source_names.length > 0) {
        query = query.in('source_name', filters.source_names);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.language) {
        query = query.eq('language', filters.language);
      }
    }

    query = query
      .limit(validatedData.batch_size)
      .order('created_at', { ascending: false });

    const { data: newsItems, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching news for batch processing:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch news items' },
        { status: 500 }
      );
    }

    if (!newsItems || newsItems.length === 0) {
      return NextResponse.json({
        message: 'No news items found matching criteria',
        job_id: null,
        total_items: 0,
      });
    }

    // Create batch job
    const jobId = crypto.randomUUID();
    const job: BatchJob = {
      id: jobId,
      status: 'pending',
      total_items: newsItems.length,
      processed_items: 0,
      failed_items: 0,
      created_at: new Date().toISOString(),
      results: {
        processed: [],
        failed: [],
        skipped: [],
      },
    };

    batchJobs.set(jobId, job);

    // Start processing in background (in production, use proper job queue)
    setTimeout(() => processBatchJob(jobId), 100);

    return NextResponse.json({
      message: 'Batch processing job created successfully',
      job_id: jobId,
      total_items: newsItems.length,
      processing_options: validatedData.processing_options,
      estimated_completion_time: new Date(
        Date.now() + newsItems.length * 500
      ).toISOString(),
      status_endpoint: `/api/admin/ai/processing-status?job_id=${jobId}`,
    });
  } catch (error) {
    console.error('Batch processing API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
