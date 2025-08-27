import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { z } from 'zod';

const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  search_query: z.string().optional(),
  search_type: z
    .enum(['articles', 'news', 'categories', 'tags', 'global'])
    .optional()
    .default('global'),
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
  is_default: z.boolean().optional().default(false),
});

export async function GET(_request: NextRequest) {
  try {
    const admin = await requireAdmin(_request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase as any;
    const user = (admin as any).user;

    // Get user's saved searches
    const { data: savedSearches, error } = await (supabase as any)
      .from('saved_searches')
      .select('*')
      .eq('user_id', user?.id || null)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved searches:', error);
      return NextResponse.json(
        { error: 'Failed to fetch saved searches' },
        { status: 500 }
      );
    }

    return NextResponse.json({ saved_searches: savedSearches || [] });
  } catch (error) {
    console.error('Saved searches API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const admin = await requireAdmin(_request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase as any;
    const user = (admin as any).user;

    const body = await _request.json();
    const validatedData = savedSearchSchema.parse(body);

    // If setting as default, unset other defaults first
    if (validatedData.is_default) {
      await (supabase as any)
        .from('saved_searches')
        .update({ is_default: false })
        .eq('user_id', user?.id || null);
    }

    // Create saved search
    const { data: savedSearch, error } = await (supabase as any)
      .from('saved_searches')
      .insert({
        ...validatedData,
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating saved search:', error);
      return NextResponse.json(
        { error: 'Failed to create saved search' },
        { status: 500 }
      );
    }

    return NextResponse.json({ saved_search: savedSearch }, { status: 201 });
  } catch (error) {
    console.error('Saved searches API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
