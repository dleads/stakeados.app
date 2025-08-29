import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  search_query: z.string().optional(),
  search_type: z
    .enum(['articles', 'news', 'categories', 'tags', 'global'])
    .optional(),
  filters: z
    .object({
      category_id: z.string().uuid().optional(),
      author_id: z.string().uuid().optional(),
      status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
      date_from: z.string().datetime().optional(),
      date_to: z.string().datetime().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  is_default: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSavedSearchSchema.parse(body);

    // If setting as default, unset other defaults first
    if (validatedData.is_default) {
      await supabase
        .from('saved_searches')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', params.id);
    }

    // Update saved search
    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating saved search:', error);
      return NextResponse.json(
        { error: 'Failed to update saved search' },
        { status: 500 }
      );
    }

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ saved_search: savedSearch });
  } catch (error) {
    console.error('Update saved search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest, // Required for Next.js API route signature
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete saved search
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting saved search:', error);
      return NextResponse.json(
        { error: 'Failed to delete saved search' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Saved search deleted successfully' });
  } catch (error) {
    console.error('Delete saved search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
