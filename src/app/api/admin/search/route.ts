import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().optional().default(''),
  content_types: z
    .array(z.enum(['articles', 'news', 'categories', 'tags']))
    .optional()
    .default(['articles', 'news']),
  filters: z
    .object({
      category_id: z.string().uuid().optional(),
      author_id: z.string().uuid().optional(),
      status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
      date_from: z.string().datetime().optional(),
      date_to: z.string().datetime().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional()
    .default({}),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  track_analytics: z.boolean().optional().default(true),
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
    const user = (admin as any).user;

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      query: searchParams.get('query') || '',
      content_types: searchParams.get('content_types')?.split(',') || [
        'articles',
        'news',
      ],
      filters: searchParams.get('filters')
        ? JSON.parse(searchParams.get('filters')!)
        : {},
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      track_analytics: searchParams.get('track_analytics') !== 'false',
    };

    const validatedParams = searchSchema.parse(params);
    const startTime = Date.now();

    // Perform search using the database function
    const { data: searchResults, error: searchError } = await (
      supabase as any
    ).rpc('search_content', {
      search_query: validatedParams.query,
      content_types: validatedParams.content_types,
      filters: validatedParams.filters,
      limit_count: validatedParams.limit,
      offset_count: validatedParams.offset,
    });

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const searchDuration = Date.now() - startTime;

    // Track search analytics if enabled
    if (validatedParams.track_analytics && validatedParams.query) {
      await (supabase as any).from('search_analytics').insert({
        user_id: user?.id || null,
        search_query: validatedParams.query,
        search_type:
          validatedParams.content_types.length === 1
            ? validatedParams.content_types[0]
            : 'global',
        filters_applied: validatedParams.filters,
        results_count: searchResults?.length || 0,
        search_duration_ms: searchDuration,
      });
    }

    // Get total count for pagination
    const { count: totalCount } = await (supabase as any).rpc(
      'search_content',
      {
        search_query: validatedParams.query,
        content_types: validatedParams.content_types,
        filters: validatedParams.filters,
        limit_count: 1000000, // Large number to get total count
        offset_count: 0,
      },
      { count: 'exact' }
    );

    return NextResponse.json({
      results: searchResults || [],
      pagination: {
        total: totalCount || 0,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        has_more:
          validatedParams.offset + validatedParams.limit < (totalCount || 0),
      },
      search_info: {
        query: validatedParams.query,
        content_types: validatedParams.content_types,
        filters: validatedParams.filters,
        duration_ms: searchDuration,
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
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
    const validatedParams = searchSchema.parse(body);
    const startTime = Date.now();

    // Perform search
    const { data: searchResults, error: searchError } = await (
      supabase as any
    ).rpc('search_content', {
      search_query: validatedParams.query,
      content_types: validatedParams.content_types,
      filters: validatedParams.filters,
      limit_count: validatedParams.limit,
      offset_count: validatedParams.offset,
    });

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const searchDuration = Date.now() - startTime;

    // Track search analytics
    if (validatedParams.track_analytics && validatedParams.query) {
      await (supabase as any).from('search_analytics').insert({
        user_id: user?.id || null,
        search_query: validatedParams.query,
        search_type:
          validatedParams.content_types.length === 1
            ? validatedParams.content_types[0]
            : 'global',
        filters_applied: validatedParams.filters,
        results_count: searchResults?.length || 0,
        search_duration_ms: searchDuration,
      });
    }

    return NextResponse.json({
      results: searchResults || [],
      search_info: {
        query: validatedParams.query,
        content_types: validatedParams.content_types,
        filters: validatedParams.filters,
        duration_ms: searchDuration,
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
