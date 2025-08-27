import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { z } from 'zod';

// Query parameters schema for status monitoring
const statusQuerySchema = z.object({
  job_id: z.string().uuid().optional(),
  status: z
    .enum(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  include_results: z.coerce.boolean().default(false),
});

// Mock job storage (in production, use Redis or database)
// This would be shared with the batch processing endpoint
const batchJobs = new Map<string, any>();

// Initialize with some mock jobs for demonstration
if (batchJobs.size === 0) {
  const mockJobs = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      status: 'completed',
      total_items: 25,
      processed_items: 25,
      failed_items: 0,
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      started_at: new Date(Date.now() - 3500000).toISOString(),
      completed_at: new Date(Date.now() - 3000000).toISOString(),
      processing_options: {
        generate_summary: true,
        extract_keywords: true,
        calculate_relevance: true,
        detect_duplicates: true,
      },
      results: {
        processed: Array.from({ length: 25 }, (_, i) => ({
          id: `news-${i + 1}`,
          title: `Processed News Item ${i + 1}`,
          processing_time_ms: Math.floor(Math.random() * 500) + 100,
          confidence_score: Math.floor(Math.random() * 30) + 70,
        })),
        failed: [],
        skipped: [],
      },
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      status: 'processing',
      total_items: 50,
      processed_items: 32,
      failed_items: 2,
      created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      started_at: new Date(Date.now() - 1700000).toISOString(),
      processing_options: {
        generate_summary: true,
        extract_keywords: true,
        calculate_relevance: true,
        detect_duplicates: true,
        translate: true,
        target_language: 'en',
      },
      results: {
        processed: Array.from({ length: 32 }, (_, i) => ({
          id: `news-${i + 1}`,
          title: `Processing News Item ${i + 1}`,
          processing_time_ms: Math.floor(Math.random() * 500) + 100,
        })),
        failed: [
          {
            id: 'news-15',
            error: 'Translation service timeout',
            timestamp: new Date(Date.now() - 900000).toISOString(),
          },
          {
            id: 'news-28',
            error: 'Content too short for processing',
            timestamp: new Date(Date.now() - 600000).toISOString(),
          },
        ],
        skipped: [],
      },
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      status: 'failed',
      total_items: 15,
      processed_items: 8,
      failed_items: 7,
      created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      started_at: new Date(Date.now() - 7100000).toISOString(),
      completed_at: new Date(Date.now() - 6900000).toISOString(),
      error_message: 'AI service rate limit exceeded',
      processing_options: {
        generate_summary: true,
        extract_keywords: true,
      },
      results: {
        processed: Array.from({ length: 8 }, (_, i) => ({
          id: `news-${i + 1}`,
          title: `Failed Batch News Item ${i + 1}`,
        })),
        failed: Array.from({ length: 7 }, (_, i) => ({
          id: `news-${i + 9}`,
          error: 'Rate limit exceeded',
          timestamp: new Date(Date.now() - 6900000).toISOString(),
        })),
        skipped: [],
      },
    },
  ];

  mockJobs.forEach(job => batchJobs.set(job.id, job));
}

function calculateJobProgress(job: any) {
  if (job.total_items === 0) return 0;
  return Math.round((job.processed_items / job.total_items) * 100);
}

function calculateProcessingRate(job: any) {
  if (!job.started_at || job.processed_items === 0) return 0;

  const startTime = new Date(job.started_at).getTime();
  const currentTime = job.completed_at
    ? new Date(job.completed_at).getTime()
    : Date.now();
  const elapsedMinutes = (currentTime - startTime) / (1000 * 60);

  return elapsedMinutes > 0
    ? Math.round(job.processed_items / elapsedMinutes)
    : 0;
}

function estimateRemainingTime(job: any) {
  if (
    job.status === 'completed' ||
    job.status === 'failed' ||
    job.status === 'cancelled'
  ) {
    return 0;
  }

  const rate = calculateProcessingRate(job);
  if (rate === 0) return null;

  const remainingItems = job.total_items - job.processed_items;
  return Math.round(remainingItems / rate); // minutes
}

function formatJobSummary(job: any, includeResults: boolean = false) {
  const summary = {
    id: job.id,
    status: job.status,
    progress: {
      total_items: job.total_items,
      processed_items: job.processed_items,
      failed_items: job.failed_items,
      skipped_items: job.results?.skipped?.length || 0,
      percentage: calculateJobProgress(job),
    },
    timing: {
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      processing_rate_per_minute: calculateProcessingRate(job),
      estimated_remaining_minutes: estimateRemainingTime(job),
    },
    processing_options: job.processing_options,
    error_message: job.error_message,
  };

  if (includeResults && job.results) {
    (summary as any).results = {
      processed_count: job.results.processed?.length || 0,
      failed_count: job.results.failed?.length || 0,
      skipped_count: job.results.skipped?.length || 0,
      recent_processed: job.results.processed?.slice(-5) || [],
      recent_failures: job.results.failed?.slice(-5) || [],
    };
  }

  return summary;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = statusQuerySchema.parse(queryParams);

    // If specific job ID requested
    if (validatedParams.job_id) {
      const job = batchJobs.get(validatedParams.job_id);

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        job: formatJobSummary(job, validatedParams.include_results),
      });
    }

    // Get all jobs with filtering
    let jobs = Array.from(batchJobs.values());

    // Filter by status if specified
    if (validatedParams.status) {
      jobs = jobs.filter(job => job.status === validatedParams.status);
    }

    // Sort by creation date (newest first)
    jobs.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination
    const totalJobs = jobs.length;
    const paginatedJobs = jobs.slice(
      validatedParams.offset,
      validatedParams.offset + validatedParams.limit
    );

    // Format jobs for response
    const formattedJobs = paginatedJobs.map(job =>
      formatJobSummary(job, validatedParams.include_results)
    );

    // Calculate overall statistics
    const stats = {
      total_jobs: totalJobs,
      by_status: jobs.reduce((acc: any, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {}),
      total_items_processed: jobs.reduce(
        (sum, job) => sum + job.processed_items,
        0
      ),
      total_items_failed: jobs.reduce((sum, job) => sum + job.failed_items, 0),
      active_jobs: jobs.filter(job =>
        ['pending', 'processing'].includes(job.status)
      ).length,
    };

    return NextResponse.json({
      jobs: formattedJobs,
      pagination: {
        total: totalJobs,
        offset: validatedParams.offset,
        limit: validatedParams.limit,
        has_more: validatedParams.offset + validatedParams.limit < totalJobs,
      },
      stats,
    });
  } catch (error) {
    console.error('Processing status API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
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

// POST endpoint to cancel or retry jobs
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { job_id, action } = body;

    if (!job_id || !action) {
      return NextResponse.json(
        {
          error: 'Missing required fields: job_id, action',
        },
        { status: 400 }
      );
    }

    const job = batchJobs.get(job_id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    switch (action) {
      case 'cancel':
        if (['pending', 'processing'].includes(job.status)) {
          job.status = 'cancelled';
          job.completed_at = new Date().toISOString();
          job.error_message = 'Cancelled by user';

          return NextResponse.json({
            message: 'Job cancelled successfully',
            job: formatJobSummary(job),
          });
        } else {
          return NextResponse.json(
            {
              error: 'Job cannot be cancelled in current status',
            },
            { status: 400 }
          );
        }

      case 'retry':
        if (job.status === 'failed') {
          job.status = 'pending';
          job.processed_items = 0;
          job.failed_items = 0;
          job.started_at = undefined;
          job.completed_at = undefined;
          job.error_message = undefined;
          job.results = { processed: [], failed: [], skipped: [] };

          return NextResponse.json({
            message: 'Job queued for retry',
            job: formatJobSummary(job),
          });
        } else {
          return NextResponse.json(
            {
              error: 'Only failed jobs can be retried',
            },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Supported actions: cancel, retry',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Processing status action API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
