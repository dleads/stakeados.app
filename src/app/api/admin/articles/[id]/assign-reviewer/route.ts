import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for reviewer assignment
const assignReviewerSchema = z.object({
  reviewer_id: z.string().uuid('Invalid reviewer ID'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  deadline: z.string().datetime().optional(),
  assignment_notes: z.string().optional(),
  notify_reviewer: z.boolean().default(true),
  notify_author: z.boolean().default(false),
  review_type: z.enum(['content', 'technical', 'seo', 'full']).default('full'),
  estimated_review_time: z.number().min(5).max(480).default(30), // minutes
});

async function checkAssignmentPermissions(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  // Only admins can assign reviewers
  if (!profile || profile.role !== 'admin') {
    return false;
  }
  return true;
}

async function validateReviewer(supabase: any, reviewerId: string) {
  const { data: reviewer } = await supabase
    .from('profiles')
    .select('id, role, display_name, email')
    .eq('id', reviewerId)
    .single();

  if (!reviewer || !['admin', 'editor'].includes(reviewer.role)) {
    return null;
  }
  return reviewer;
}

async function createArticleHistoryEntry(
  _supabase: any,
  _articleId: string,
  _userId: string,
  _changeType: string,
  _oldValues: any,
  _newValues: any,
  _notes?: string
) {
  // For now, we'll skip history tracking since the table doesn't exist
  console.log('Article history tracking disabled - table not available');
}

async function getReviewerWorkload(_supabase: any, _reviewerId: string) {
  // For now, return default workload since history table doesn't exist
  return {
    current_assignments: 0,
    recent_reviews: 0,
  };
}

export async function POST(
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

    // Check assignment permissions (admin only)
    const hasPermission = await checkAssignmentPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Forbidden - Only admins can assign reviewers',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = assignReviewerSchema.parse(body);

    // Get current article
    const { data: currentArticle, error: fetchError } = await supabase
      .from('articles')
      .select(
        `
        *,
        author:profiles!author_id(
          id,
          display_name,
          username,
          email
        )
      `
      )
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

    // Check if article can be assigned for review
    if (
      !currentArticle.status ||
      !['draft', 'review'].includes(currentArticle.status)
    ) {
      return NextResponse.json(
        {
          error: 'Article cannot be assigned for review from current status',
        },
        { status: 400 }
      );
    }

    // Validate reviewer
    const reviewer = await validateReviewer(
      supabase,
      validatedData.reviewer_id
    );
    if (!reviewer) {
      return NextResponse.json(
        {
          error: 'Invalid reviewer - must be an admin or editor',
        },
        { status: 400 }
      );
    }

    // Check if reviewer is the same as the author
    if (validatedData.reviewer_id === currentArticle.author_id) {
      return NextResponse.json(
        {
          error: 'Cannot assign article to its own author for review',
        },
        { status: 400 }
      );
    }

    // Get reviewer workload information
    const workload = await getReviewerWorkload(
      supabase,
      validatedData.reviewer_id
    );

    // Update article status to review if it's not already
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (currentArticle.status !== 'review') {
      updateData.status = 'review';
    }

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
        { error: 'Failed to assign reviewer' },
        { status: 500 }
      );
    }

    // Prepare assignment data
    const assignmentData = {
      assigned_by: user.id,
      assigned_to: validatedData.reviewer_id,
      assigned_at: new Date().toISOString(),
      priority: validatedData.priority,
      deadline: validatedData.deadline,
      assignment_notes: validatedData.assignment_notes,
      review_type: validatedData.review_type,
      estimated_review_time: validatedData.estimated_review_time,
    };

    // Create history entry for assignment
    await createArticleHistoryEntry(
      supabase,
      params.id,
      user.id,
      'reviewer_assigned',
      { reviewer_id: null },
      assignmentData,
      `Article assigned to ${reviewer.display_name || reviewer.email} for ${validatedData.review_type} review`
    );

    // Calculate deadline if not provided (default: 3 days from now)
    let deadline = validatedData.deadline;
    if (!deadline) {
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 3);
      deadline = defaultDeadline.toISOString();
    }

    return NextResponse.json({
      article: updatedArticle,
      assignment: {
        ...assignmentData,
        deadline,
        reviewer: {
          id: reviewer.id,
          name: reviewer.display_name,
          email: reviewer.email,
          role: reviewer.role,
        },
        workload: workload,
      },
      notifications: {
        reviewer_notified: validatedData.notify_reviewer,
        author_notified: validatedData.notify_author,
      },
      message: `Article successfully assigned to ${reviewer.display_name || reviewer.email} for review`,
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

// GET method to retrieve current reviewer assignment
export async function GET(
  _request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasPermission = await checkAssignmentPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For now, return no assignment since history table doesn't exist
    return NextResponse.json({
      assignment: null,
      message: 'No reviewer currently assigned to this article',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
