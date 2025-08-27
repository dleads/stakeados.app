import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for article rejection
const rejectionSchema = z.object({
  reason: z.string().min(20, 'Rejection reason must be at least 20 characters'),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  suggested_improvements: z
    .array(
      z.object({
        category: z.enum([
          'content',
          'structure',
          'seo',
          'style',
          'accuracy',
          'other',
        ]),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        examples: z.string().optional(),
      })
    )
    .optional(),
  allow_resubmission: z.boolean().default(true),
  notify_author: z.boolean().default(true),
  reviewer_notes: z.string().optional(),
  return_to_draft: z.boolean().default(true),
});

async function checkRejectionPermissions(supabase: any, userId: string) {
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

export async function PUT(
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

    // Check rejection permissions
    const hasPermission = await checkRejectionPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = rejectionSchema.parse(body);

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

    // Check if article can be rejected
    if (
      !currentArticle.status ||
      !['draft', 'review', 'published'].includes(currentArticle.status)
    ) {
      return NextResponse.json(
        {
          error: 'Article cannot be rejected from current status',
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Determine new status based on rejection settings
    if (validatedData.return_to_draft) {
      updateData.status = 'draft';
      updateData.published_at = null; // Unpublish if it was published
    } else if (!validatedData.allow_resubmission) {
      updateData.status = 'archived';
      updateData.published_at = null;
    }

    // Remove any scheduled publication if exists
    if (currentArticle.status === 'review') {
      const { error: scheduleError } = await supabase
        .from('article_schedules')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('article_id', params.id)
        .eq('status', 'scheduled');

      // Don't fail if no schedule exists
      if (scheduleError && !scheduleError.message?.includes('No rows')) {
        console.error('Error cancelling schedule:', scheduleError);
      }
    }

    // Update the article
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
        { error: 'Failed to reject article' },
        { status: 500 }
      );
    }

    // Prepare rejection data for history
    const rejectionData = {
      rejected_by: user.id,
      rejected_at: new Date().toISOString(),
      reason: validatedData.reason,
      feedback: validatedData.feedback,
      suggested_improvements: validatedData.suggested_improvements,
      allow_resubmission: validatedData.allow_resubmission,
      reviewer_notes: validatedData.reviewer_notes,
    };

    // Create history entry with detailed rejection information
    await createArticleHistoryEntry(
      supabase,
      params.id,
      user.id,
      'rejected',
      currentArticle,
      { ...updateData, rejection_data: rejectionData },
      `Article rejected: ${validatedData.reason}`
    );

    // Prepare response message
    let message = 'Article rejected successfully';
    if (validatedData.return_to_draft) {
      message += ' and returned to draft status';
    } else if (!validatedData.allow_resubmission) {
      message += ' and archived';
    }

    return NextResponse.json({
      article: updatedArticle,
      rejection: rejectionData,
      message,
      next_steps: {
        can_resubmit: validatedData.allow_resubmission,
        status: updateData.status,
        author_notified: validatedData.notify_author,
      },
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
