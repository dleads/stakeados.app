import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    let query = supabase
      .from('admin_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount || 0,
      total: notifications?.length || 0,
    });
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      targetUserId,
      type,
      title,
      message,
      data = {},
      priority = 'medium',
      expiresAt,
    } = body;

    if (!targetUserId || !type || !title || !message) {
      return NextResponse.json(
        {
          error: 'Missing required fields: targetUserId, type, title, message',
        },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from('admin_notifications')
      .insert({
        user_id: targetUserId,
        type,
        title,
        message,
        data,
        priority,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error in notifications POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const authResult = await requireAdmin(_request);

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

    // Delete all notifications for the user
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json(
        { error: 'Failed to delete notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error in notifications DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
