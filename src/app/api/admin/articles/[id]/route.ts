import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { z } from 'zod';

// Update article schema
const updateArticleSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').optional(),
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .optional(),
  summary: z.string().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  language: z.enum(['es', 'en']).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  featured_image: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  reading_time: z.number().optional(),
  published_at: z.string().datetime().optional(),
  author_id: z.string().uuid().optional(),
});

async function createArticleHistoryEntry(
  supabase: any,
  articleId: string,
  userId: string,
  changeType: string,
  oldValues: any,
  newValues: any,
  notes?: string
) {
  // Check if article_history table exists, if not create it
  const { error: historyError } = await supabase
    .from('article_history')
    .insert({
      article_id: articleId,
      changed_by: userId,
      change_type: changeType,
      old_values: oldValues,
      new_values: newValues,
      notes: notes,
      created_at: new Date().toISOString(),
    });

  // If table doesn't exist, we'll skip history for now
  if (
    historyError &&
    !historyError.message?.includes('relation "article_history" does not exist')
  ) {
    console.error('Error creating article history:', historyError);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: article, error } = await supabase
      .from('articles')
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
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching article:', error);
      return NextResponse.json(
        { error: 'Failed to fetch article' },
        { status: 500 }
      );
    }

    return NextResponse.json(article);
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

    // Get current article for history tracking
    const { data: currentArticle, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch article' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validatedData = updateArticleSchema.parse(body);

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    // Update slug if title changed
    if (validatedData.title) {
      updateData.slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Calculate reading time if content changed
    if (validatedData.content) {
      updateData.reading_time =
        validatedData.reading_time ||
        Math.ceil(validatedData.content.split(/\s+/).length / 200);
    }

    // Handle status changes
    if (validatedData.status) {
      if (
        validatedData.status === 'published' &&
        currentArticle.status !== 'published'
      ) {
        // Article is being published
        updateData.published_at =
          validatedData.published_at || new Date().toISOString();
      } else if (
        validatedData.status !== 'published' &&
        currentArticle.status === 'published'
      ) {
        // Article is being unpublished
        updateData.published_at = null;
      }
    }

    const { data: updatedArticle, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', params.id)
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
      console.error('Error updating article:', error);
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      );
    }

    // Create history entry
    await createArticleHistoryEntry(
      supabase,
      params.id,
      user.id,
      'updated',
      currentArticle,
      updateData,
      `Article updated by admin`
    );

    return NextResponse.json(updatedArticle);
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get current article for history tracking
    const { data: currentArticle, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch article' },
        { status: 500 }
      );
    }

    // Soft delete - archive the article instead of hard delete
    const { data: archivedArticle, error } = await supabase
      .from('articles')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error archiving article:', error);
      return NextResponse.json(
        { error: 'Failed to archive article' },
        { status: 500 }
      );
    }

    // Create history entry
    await createArticleHistoryEntry(
      supabase,
      params.id,
      user.id,
      'archived',
      currentArticle,
      { status: 'archived' },
      `Article archived (soft deleted) by admin`
    );

    return NextResponse.json({
      message: 'Article archived successfully',
      article: archivedArticle,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
