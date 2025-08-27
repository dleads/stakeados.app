import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for review submission
const reviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes']),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  reviewer_notes: z.string().optional(),
  suggested_changes: z
    .array(
      z.object({
        section: z.string(),
        comment: z.string(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
      })
    )
    .optional(),
  assign_to: z.string().uuid().optional(), // For reassigning to another reviewer
});

async function checkReviewPermissions(supabase: any, userId: string) {
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

async function createArticleHistoryEntry(
  supabase: any,
  articleId: string,
  userId: string,
  changeType: string,
  oldValues: any,
  newValues: any,
  notes?: string
) {
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

  if (historyError) {
    console.error('Error creating article history:', historyError);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check review permissions
    const hasPermission = await checkReviewPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Get current article
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

    // Check if article is in reviewable state
    if (
      !currentArticle.status ||
      !['draft', 'review'].includes(currentArticle.status)
    ) {
      return NextResponse.json(
        {
          error: 'Article is not in a reviewable state',
        },
        { status: 400 }
      );
    }

    // Prepare review data to store in article metadata or separate review table
    const reviewData = {
      reviewer_id: user.id,
      review_date: new Date().toISOString(),
      action: validatedData.action,
      feedback: validatedData.feedback,
      reviewer_notes: validatedData.reviewer_notes,
      suggested_changes: validatedData.suggested_changes,
    };

    // Determine new status based on review action
    let newStatus = currentArticle.status;
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (validatedData.action) {
      case 'approve':
        // Don't automatically publish, just mark as approved
        // Admin can then choose to publish
        newStatus = 'published';
        updateData.status = newStatus;
        updateData.published_at = new Date().toISOString();
        break;

      case 'reject':
        newStatus = 'draft';
        updateData.status = newStatus;
        updateData.published_at = null;
        break;

      case 'request_changes':
        newStatus = 'draft';
        updateData.status = newStatus;
        updateData.published_at = null;
        break;
    }

    // Store review information in article metadata or create a reviews table entry
    // For now, we'll store it in a simple way and create history entry
    const { data: updatedArticle, error: updateError } = await supabase
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

    if (updateError) {
      console.error('Error updating article:', updateError);
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      );
    }

    // Create history entry with review details
    await createArticleHistoryEntry(
      supabase,
      params.id,
      user.id,
      `review_${validatedData.action}`,
      currentArticle,
      { ...updateData, review_data: reviewData },
      `Article ${validatedData.action} by reviewer: ${validatedData.feedback}`
    );

    // If reassigning to another reviewer, create additional history entry
    if (validatedData.assign_to && validatedData.assign_to !== user.id) {
      await createArticleHistoryEntry(
        supabase,
        params.id,
        user.id,
        'reviewer_assigned',
        { reviewer_id: user.id },
        { reviewer_id: validatedData.assign_to },
        `Article reassigned to another reviewer`
      );
    }

    return NextResponse.json({
      article: updatedArticle,
      review: reviewData,
      message: `Article ${validatedData.action} successfully`,
    });
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
