import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { automaticPublicationService } from '@/lib/services/automaticPublicationService';

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

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'process_due':
        // Process all due publications
        await automaticPublicationService.processScheduledPublications();
        return NextResponse.json({
          message: 'Scheduled publications processed successfully',
        });

      case 'get_upcoming':
        // Get upcoming publications
        const upcoming =
          await automaticPublicationService.getUpcomingPublications(20);
        return NextResponse.json({ upcoming });

      case 'get_overdue':
        // Get overdue publications
        const overdue =
          await automaticPublicationService.getOverduePublications();
        return NextResponse.json({ overdue });

      case 'cancel':
        // Cancel a specific publication
        const { publication_id } = body;
        if (!publication_id) {
          return NextResponse.json(
            { error: 'Publication ID required' },
            { status: 400 }
          );
        }

        const cancelled =
          await automaticPublicationService.cancelScheduledPublication(
            publication_id
          );
        if (cancelled) {
          return NextResponse.json({
            message: 'Publication cancelled successfully',
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to cancel publication' },
            { status: 500 }
          );
        }

      case 'reschedule':
        // Reschedule a publication
        const { publication_id: rescheduleId, scheduled_for, timezone } = body;
        if (!rescheduleId || !scheduled_for) {
          return NextResponse.json(
            {
              error: 'Publication ID and scheduled_for are required',
            },
            { status: 400 }
          );
        }

        const rescheduled =
          await automaticPublicationService.reschedulePublication(
            rescheduleId,
            scheduled_for,
            timezone
          );
        if (rescheduled) {
          return NextResponse.json({
            message: 'Publication rescheduled successfully',
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to reschedule publication' },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
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

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'upcoming';

    switch (type) {
      case 'upcoming':
        const upcoming =
          await automaticPublicationService.getUpcomingPublications(20);
        return NextResponse.json({ publications: upcoming });

      case 'overdue':
        const overdue =
          await automaticPublicationService.getOverduePublications();
        return NextResponse.json({ publications: overdue });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
