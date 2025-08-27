import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for article approval
const approvalSchema = z.object({
  publish_immediately: z.boolean().default(true),
  scheduled_at: z.string().datetime().optional(),
  approval_notes: z.string().optional(),
  notify_author: z.boolean().default(true),
  publish_channels: z.array(z.string()).default(['web']),
  seo_optimizations: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

async function checkApprovalPermissions(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  // Only admins can approve articles for publication
  if (!profile || profile.role !== 'admin') {
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

    // Check approval permissions (admin only)
    const hasPermission = await checkApprovalPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Forbidden - Only admins can approve articles for publication',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = approvalSchema.parse(body);

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

    // Check if article can be approved
    if (
      !currentArticle.status ||
      !['draft', 'review'].includes(currentArticle.status)
    ) {
      return NextResponse.json(
        {
          error: 'Article cannot be approved from current status',
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: 'published',
      updated_at: new Date().toISOString(),
    };

    // Handle publication timing
    if (validatedData.publish_immediately) {
      updateData.published_at = new Date().toISOString();
    } else if (validatedData.scheduled_at) {
      // Schedule for later publication
      updateData.status = 'review'; // Keep in review until scheduled time

      // Create or update schedule entry
      const { error: scheduleError } = await supabase
        .from('article_schedules')
        .upsert({
          article_id: params.id,
          scheduled_at: validatedData.scheduled_at,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError);
        return NextResponse.json(
          { error: 'Failed to schedule article' },
          { status: 500 }
        );
      }
    }

    // Apply SEO optimizations if provided
    if (validatedData.seo_optimizations) {
      if (validatedData.seo_optimizations.title) {
        updateData.seo_title = validatedData.seo_optimizations.title;
      }
      if (validatedData.seo_optimizations.description) {
        updateData.seo_description =
          validatedData.seo_optimizations.description;
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
        { error: 'Failed to approve article' },
        { status: 500 }
      );
    }

    // Create history entry
    const historyNotes =
      validatedData.approval_notes ||
      (validatedData.publish_immediately
        ? 'Article approved and published'
        : 'Article approved for scheduled publication');

    await createArticleHistoryEntry(
      supabase,
      params.id,
      user.id,
      validatedData.publish_immediately ? 'published' : 'scheduled',
      currentArticle,
      updateData,
      historyNotes
    );

    // Get schedule info if article was scheduled
    let scheduleInfo = null;
    if (validatedData.scheduled_at) {
      const { data: schedule } = await supabase
        .from('article_schedules')
        .select('*')
        .eq('article_id', params.id)
        .single();

      scheduleInfo = schedule;
    }

    return NextResponse.json({
      article: updatedArticle,
      schedule: scheduleInfo,
      approval: {
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        publish_immediately: validatedData.publish_immediately,
        scheduled_at: validatedData.scheduled_at,
        notes: validatedData.approval_notes,
        channels: validatedData.publish_channels,
      },
      message: validatedData.publish_immediately
        ? 'Article approved and published successfully'
        : 'Article approved and scheduled for publication',
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
