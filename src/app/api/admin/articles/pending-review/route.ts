import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Query parameters schema for review queue
const reviewQueueQuerySchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  author_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  days_pending: z.coerce.number().min(0).optional(),
  sort_by: z
    .enum(['created_at', 'updated_at', 'priority', 'author'])
    .default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('asc'), // Oldest first for review queue
  assigned_to: z.string().uuid().optional(),
  include_stats: z.coerce.boolean().default(true),
});

async function checkReviewQueuePermissions(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return false;
  }
  return true;
}

async function calculateArticlePriority(
  article: any
): Promise<'high' | 'medium' | 'low'> {
  const now = new Date();
  const updatedAt = new Date(article.updated_at);
  const daysPending = Math.floor(
    (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // High priority: articles pending for more than 3 days or from featured authors
  if (daysPending > 3) return 'high';

  // Medium priority: articles pending for 1-3 days
  if (daysPending > 1) return 'medium';

  // Low priority: recent submissions
  return 'low';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check review queue permissions
    const hasPermission = await checkReviewQueuePermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedParams = reviewQueueQuerySchema.parse(queryParams);

    // Build the base query for articles pending review
    let query = supabase
      .from('articles')
      .select(
        `
        *,
        author:profiles!author_id(
          id,
          display_name,
          username,
          avatar_url,
          email,
          role
        ),
        category:categories!category_id(
          id,
          name,
          slug,
          color
        )
      `
      )
      .eq('status', 'review');

    // Apply filters
    if (validatedParams.author_id) {
      query = query.eq('author_id', validatedParams.author_id);
    }

    if (validatedParams.category_id) {
      query = query.eq('category_id', validatedParams.category_id);
    }

    if (validatedParams.days_pending) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - validatedParams.days_pending);
      query = query.lte('updated_at', cutoffDate.toISOString());
    }

    // Apply sorting
    query = query.order(validatedParams.sort_by, {
      ascending: validatedParams.sort_order === 'asc',
    });

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'review');

    // Apply pagination
    const { data: articles, error } = await query.range(
      validatedParams.page * validatedParams.limit,
      (validatedParams.page + 1) * validatedParams.limit - 1
    );

    if (error) {
      console.error('Error fetching review queue:', error);
      return NextResponse.json(
        { error: 'Failed to fetch review queue' },
        { status: 500 }
      );
    }

    // Calculate priority for each article and add review metadata
    const articlesWithMetadata = await Promise.all(
      (articles || []).map(async article => {
        const priority = await calculateArticlePriority(article);

        // Calculate days in review
        const now = new Date();
        const updatedAt = new Date(
          article.updated_at || article.created_at || now
        );
        const daysInReview = Math.floor(
          (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...article,
          review_metadata: {
            priority,
            days_in_review: daysInReview,
            last_action: 'submitted',
            last_action_date: article.updated_at || article.created_at,
            last_action_by: article.author_id,
            estimated_read_time: article.reading_time || 5,
            word_count: article.content
              ? article.content.split(/\s+/).length
              : 0,
          },
        };
      })
    );

    // Filter by priority if specified
    const filteredArticles = validatedParams.priority
      ? articlesWithMetadata.filter(
          article =>
            article.review_metadata.priority === validatedParams.priority
        )
      : articlesWithMetadata;

    // Get review queue statistics if requested
    let stats = null;
    if (validatedParams.include_stats) {
      const allReviewArticles = await supabase
        .from('articles')
        .select('updated_at, created_at')
        .eq('status', 'review');

      if (allReviewArticles.data) {
        const now = new Date();
        const priorities = { high: 0, medium: 0, low: 0 };
        const ageGroups = { today: 0, this_week: 0, older: 0 };

        allReviewArticles.data.forEach(article => {
          const updatedAt = new Date(
            article.updated_at || article.created_at || now
          );
          const daysPending = Math.floor(
            (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Count by priority
          if (daysPending > 3) priorities.high++;
          else if (daysPending > 1) priorities.medium++;
          else priorities.low++;

          // Count by age
          if (daysPending === 0) ageGroups.today++;
          else if (daysPending <= 7) ageGroups.this_week++;
          else ageGroups.older++;
        });

        stats = {
          total_pending: allReviewArticles.data.length,
          by_priority: priorities,
          by_age: ageGroups,
          average_review_time: Math.round(
            allReviewArticles.data.reduce((sum, article) => {
              const daysPending = Math.floor(
                (now.getTime() -
                  new Date(
                    article.updated_at || article.created_at || now
                  ).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return sum + daysPending;
            }, 0) / allReviewArticles.data.length
          ),
        };
      }
    }

    return NextResponse.json({
      data: filteredArticles,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: totalCount || 0,
        hasMore:
          (totalCount || 0) >
          (validatedParams.page + 1) * validatedParams.limit,
      },
      stats,
      queue_info: {
        total_in_queue: filteredArticles.length,
        oldest_pending:
          filteredArticles.length > 0
            ? Math.max(
                ...filteredArticles.map(a => a.review_metadata.days_in_review)
              )
            : 0,
        newest_pending:
          filteredArticles.length > 0
            ? Math.min(
                ...filteredArticles.map(a => a.review_metadata.days_in_review)
              )
            : 0,
      },
    });
  } catch (error) {
    console.error('API error:', error);
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
