import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/articles
// Public endpoint to fetch paginated articles with optional filters
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Pagination
  const page = Math.max(parseInt(searchParams.get('page') || '0', 10), 0);
  const limitRaw = parseInt(searchParams.get('limit') || '20', 10);
  const limit = Math.min(Math.max(limitRaw, 1), 50); // clamp 1..50

  // Filters
  const category = searchParams.get('category') || undefined;
  const author = searchParams.get('author') || undefined;
  const difficulty = searchParams.get('difficulty') || undefined; // beginner|intermediate|advanced
  const status = searchParams.get('status') || 'published';

  // Sorting
  const sortBy = (searchParams.get('sortBy') || 'date') as
    | 'date'
    | 'popularity'
    | 'reading_time';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  try {
    const supabase = await createClient();

    let query = supabase.from('articles').select('*', { count: 'exact' });

    // Filters
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category_id', category);
    if (author) query = query.eq('author_id', author);
    if (difficulty) query = query.eq('difficulty_level', difficulty);

    // Sorting
    if (sortBy === 'date') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'popularity') {
      // Use views as a proxy for popularity
      query = query.order('views', {
        ascending: sortOrder === 'asc',
        nullsFirst: false,
      });
    } else if (sortBy === 'reading_time') {
      query = query.order('reading_time', {
        ascending: sortOrder === 'asc',
        nullsFirst: true,
      });
    }

    // Pagination range
    const from = page * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformed = (data || []).map((article: any) => {
      // Safely parse potential JSON-string columns
      const safeParse = (val: any) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return {};
          }
        }
        return val ?? {};
      };

      return {
        ...article,
        title: safeParse(article.title),
        content: safeParse(article.content),
        meta_description: safeParse(article.seo_description),
        category: article.category_id || '',
        tags: Array.isArray(article.tags) ? article.tags : [],
        view_count: article.views || 0,
        like_count: article.likes || 0,
        // Backward-compat fields used by frontend types
        author_name: 'Unknown Author',
        author_avatar: undefined,
        category_name: { en: 'General', es: 'General' },
        category_color: '#6B7280',
        category_icon: '📄',
        total_interactions_views: article.views || 0,
        total_interactions_likes: article.likes || 0,
        total_interactions_shares: 0,
        total_interactions_bookmarks: 0,
        engagement_rate: 0,
      };
    });

    const response = {
      data: transformed,
      count: count || 0,
      page,
      limit,
      hasMore: (count || 0) > (page + 1) * limit,
      sortBy,
      sortOrder,
      filters: { category, author, difficulty, status },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}
