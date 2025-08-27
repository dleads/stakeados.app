import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { z } from 'zod';

// Enhanced article schema for admin operations
const adminArticleSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  summary: z.string().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
  language: z.enum(['es', 'en']).default('es'),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  featured_image: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  reading_time: z.number().optional(),
  published_at: z.string().datetime().optional(),
  author_id: z.string().uuid().optional(),
});

// Query parameters schema for filtering
const querySchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  author_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'updated_at', 'published_at', 'title'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { supabase } = authResult;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedParams = querySchema.parse(queryParams);

    // Build the query
    let query = supabase.from('articles').select(`
        *,
        author:profiles!author_id(
          id,
          display_name,
          username,
          avatar_url,
          email
        ),
        category:categories!category_id(
          id,
          name,
          slug,
          color
        )
      `);

    // Apply filters
    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status);
    }

    if (validatedParams.author_id) {
      query = query.eq('author_id', validatedParams.author_id);
    }

    if (validatedParams.category_id) {
      query = query.eq('category_id', validatedParams.category_id);
    }

    if (validatedParams.search) {
      query = query.or(
        `title.ilike.%${validatedParams.search}%,content.ilike.%${validatedParams.search}%`
      );
    }

    if (validatedParams.date_from) {
      query = query.gte('created_at', validatedParams.date_from);
    }

    if (validatedParams.date_to) {
      query = query.lte('created_at', validatedParams.date_to);
    }

    // Apply sorting
    query = query.order(validatedParams.sort_by, {
      ascending: validatedParams.sort_order === 'asc',
    });

    // Apply pagination
    const {
      data: articles,
      error,
      count,
    } = await query.range(
      validatedParams.page * validatedParams.limit,
      (validatedParams.page + 1) * validatedParams.limit - 1
    );

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('articles')
      .select('status')
      .then(({ data }) => {
        if (!data) return { data: null };

        const summary = {
          total: data.length,
          draft: data.filter(a => a.status === 'draft').length,
          review: data.filter(a => a.status === 'review').length,
          published: data.filter(a => a.status === 'published').length,
          archived: data.filter(a => a.status === 'archived').length,
        };

        return { data: summary };
      });

    return NextResponse.json({
      data: articles || [],
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        hasMore:
          (count || 0) > (validatedParams.page + 1) * validatedParams.limit,
      },
      stats: stats || {
        total: 0,
        draft: 0,
        review: 0,
        published: 0,
        archived: 0,
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

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { supabase, user } = authResult;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validatedData = adminArticleSchema.parse(body);

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Calculate reading time if not provided
    const readingTime =
      validatedData.reading_time ||
      Math.ceil(validatedData.content.split(/\s+/).length / 200);

    // Prepare article data
    const articleData = {
      ...validatedData,
      slug,
      reading_time: readingTime,
      author_id: validatedData.author_id || user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If status is published and no published_at date, set it now
    if (articleData.status === 'published' && !articleData.published_at) {
      articleData.published_at = new Date().toISOString();
    }

    const { data: article, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select(
        `
        *,
        author:profiles!author_id(
          id,
          display_name,
          username,
          avatar_url,
          email
        ),
        category:categories!category_id(
          id,
          name,
          slug,
          color
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating article:', error);
      return NextResponse.json(
        { error: 'Failed to create article' },
        { status: 500 }
      );
    }

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
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
