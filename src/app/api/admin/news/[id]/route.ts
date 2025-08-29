import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for updating news
const updateNewsSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').optional(),
  content: z
    .string()
    .min(50, 'Content must be at least 50 characters')
    .optional(),
  summary: z.string().optional(),
  source_url: z.string().url().optional(),
  source_name: z.string().optional(),
  image_url: z.string().url().optional(),
  category_id: z.string().uuid().optional(),
  language: z.enum(['es', 'en']).optional(),
  processed: z.boolean().optional(),
  trending_score: z.number().min(0).max(100).optional(),
  published_at: z.string().datetime().optional(),
});

async function checkAdminPermissions(supabase: any, userId: string) {
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const hasPermission = await checkAdminPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const { data: newsItem, error } = await supabase
      .from('news')
      .select(
        `
        *,
        category:categories!category_id(
          id,
          name,
          slug,
          color
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching news:', error);
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json(newsItem);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const hasPermission = await checkAdminPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateNewsSchema.parse(body);

    // Check if news exists
    const { data: existingNews, error: fetchError } = await supabase
      .from('news')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingNews) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedNews, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
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
      console.error('Error updating news:', error);
      return NextResponse.json(
        { error: 'Failed to update news' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedNews);
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const hasPermission = await checkAdminPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Check if news exists
    const { data: existingNews, error: fetchError } = await supabase
      .from('news')
      .select('id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingNews) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // Delete the news item
    const { error } = await supabase.from('news').delete().eq('id', id);

    if (error) {
      console.error('Error deleting news:', error);
      return NextResponse.json(
        { error: 'Failed to delete news' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'News deleted successfully',
      deletedItem: existingNews,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
