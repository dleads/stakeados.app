import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  search_type: z
    .enum(['articles', 'news', 'categories', 'tags', 'global'])
    .optional(),
  user_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase as any;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      period: searchParams.get('period') || 'week',
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      search_type: searchParams.get('search_type'),
      user_id: searchParams.get('user_id'),
    };

    const validatedParams = analyticsQuerySchema.parse(params);

    // Calculate date range if not provided
    const endDate = validatedParams.end_date
      ? new Date(validatedParams.end_date)
      : new Date();
    let startDate: Date;

    if (validatedParams.start_date) {
      startDate = new Date(validatedParams.start_date);
    } else {
      startDate = new Date();
      switch (validatedParams.period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
    }

    // Build query
    let query = (supabase as any)
      .from('search_analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (validatedParams.search_type) {
      query = query.eq('search_type', validatedParams.search_type);
    }

    if (validatedParams.user_id) {
      query = query.eq('user_id', validatedParams.user_id);
    }

    const { data: analytics, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching search analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const totalSearches = analytics?.length || 0;
    const avgResultsCount =
      analytics?.reduce(
        (sum: number, item: any) => sum + (item.results_count || 0),
        0
      ) / totalSearches || 0;
    const avgDuration =
      analytics?.reduce(
        (sum: number, item: any) => sum + (item.search_duration_ms || 0),
        0
      ) / totalSearches || 0;

    // Get top search queries
    const queryFrequency =
      analytics?.reduce(
        (acc: Record<string, number>, item: any) => {
          const query = (item.search_query || '').toLowerCase().trim();
          if (query) {
            acc[query] = (acc[query] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const entries = Object.entries(queryFrequency) as Array<[string, number]>;
    const topQueries = entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Get search type distribution
    const typeDistribution =
      analytics?.reduce(
        (acc: Record<string, number>, item: any) => {
          const type = item.search_type || 'global';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Get searches with no results
    const noResultsSearches =
      analytics?.filter((item: any) => (item.results_count || 0) === 0)
        .length || 0;
    const noResultsRate =
      totalSearches > 0 ? (noResultsSearches / totalSearches) * 100 : 0;

    return NextResponse.json({
      summary: {
        total_searches: totalSearches,
        avg_results_count: Math.round(avgResultsCount * 100) / 100,
        avg_duration_ms: Math.round(avgDuration * 100) / 100,
        no_results_rate: Math.round(noResultsRate * 100) / 100,
      },
      top_queries: topQueries,
      type_distribution: typeDistribution,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        period: validatedParams.period,
      },
      raw_data: analytics || [],
    });
  } catch (error) {
    console.error('Search analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase as any;
    const user = (admin as any).user;

    const body = await request.json();
    const { result_id } = body;

    if (!result_id) {
      return NextResponse.json(
        { error: 'result_id is required' },
        { status: 400 }
      );
    }

    // Update the most recent search analytics entry for this user with the clicked result
    const { error } = await (supabase as any)
      .from('search_analytics')
      .update({ clicked_result_id: result_id })
      .eq('user_id', user?.id || null)
      .is('clicked_result_id', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error updating search analytics:', error);
      return NextResponse.json(
        { error: 'Failed to update analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Analytics updated successfully' });
  } catch (error) {
    console.error('Search analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
