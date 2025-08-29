import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const scheduleSchema = z.object({
  scheduled_at: z.string().datetime('Invalid datetime format'),
  timezone: z.string().default('UTC'),
  recurring_pattern: z.string().optional(),
  auto_publish: z.boolean().default(true),
  publish_channels: z.array(z.string()).default(['web']),
  notes: z.string().optional(),
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

// TODO: Implement when article_history table is available
// async function createArticleHistoryEntry(
//   supabase: any,
//   articleId: string,
//   userId: string,
//   changeType: string,
//   oldValues: any,
//   newValues: any,
//   notes?: string
// ) {
//   const { error: historyError } = await supabase
//     .from('article_history')
//     .insert({
//       article_id: articleId,
//       changed_by: userId,
//       change_type: changeType,
//       old_values: oldValues,
//       new_values: newValues,
//       notes: notes,
//       created_at: new Date().toISOString()
//     })

//   if (historyError && !historyError.message?.includes('relation "article_history" does not exist')) {
//     console.error('Error creating article history:', historyError)
//   }
// }

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

    // Check admin permissions
    const hasPermission = await checkAdminPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify article exists
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (articleError) {
      if (articleError.code === 'PGRST116') {
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
    const validatedData = scheduleSchema.parse(body);

    // Check if scheduled time is in the future
    const scheduledTime = new Date(validatedData.scheduled_at);
    if (scheduledTime <= new Date()) {
      return NextResponse.json(
        {
          error: 'Scheduled time must be in the future',
        },
        { status: 400 }
      );
    }

    // TODO: Implement when publication_schedule table is available
    // Check if there's already a schedule for this article
    // const { data: existingSchedule } = await supabase
    //   .from('publication_schedule')
    //   .select('*')
    //   .eq('content_id', params.id)
    //   .eq('content_type', 'article')
    //   .eq('status', 'scheduled')
    //   .single()
    // const existingSchedule = null

    // TODO: Implement when publication_schedule table is available
    // if (existingSchedule) {
    //   // Update existing schedule logic would go here
    // } else {
    //   // Create new schedule logic would go here
    // }

    // For now, just update the article status to review
    if (article.status === 'draft') {
      await supabase
        .from('articles')
        .update({
          status: 'review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);
    }

    return NextResponse.json(
      {
        message: 'Article scheduling feature not yet implemented',
        note: 'Article status updated to review',
      },
      { status: 200 }
    );
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

    // Check admin permissions
    const hasPermission = await checkAdminPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Implement when publication_schedule table is available
    // const { data: schedule, error } = await supabase
    //   .from('publication_schedule')
    //   .select('*')
    //   .eq('content_id', params.id)
    //   .eq('content_type', 'article')
    //   .order('created_at', { ascending: false })

    // if (error) {
    //   console.error('Error fetching schedule:', error)
    //   return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
    // }

    return NextResponse.json({
      schedules: [],
      note: 'Publication scheduling feature not yet implemented',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check admin permissions
    const hasPermission = await checkAdminPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Implement when publication_schedule table is available
    // Get current schedule for history
    // const { data: currentSchedule } = await supabase
    //   .from('publication_schedule')
    //   .select('*')
    //   .eq('content_id', params.id)
    //   .eq('content_type', 'article')
    //   .eq('status', 'scheduled')
    //   .single()

    // if (!currentSchedule) {
    //   return NextResponse.json({ error: 'No active schedule found' }, { status: 404 })
    // }

    // Cancel the schedule
    // const { error } = await supabase
    //   .from('publication_schedule')
    //   .update({
    //     status: 'cancelled',
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', currentSchedule.id)

    // if (error) {
    //   console.error('Error cancelling schedule:', error)
    //   return NextResponse.json({ error: 'Failed to cancel schedule' }, { status: 500 })
    // }

    // Create history entry
    // await createArticleHistoryEntry(
    //   supabase,
    //   params.id,
    //   user.id,
    //   'schedule_cancelled',
    //   currentSchedule,
    //   { status: 'cancelled' },
    //   'Publication schedule cancelled'
    // )

    return NextResponse.json({
      message: 'Publication scheduling feature not yet implemented',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
