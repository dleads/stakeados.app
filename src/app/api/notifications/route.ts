import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationServiceServer } from '@/lib/services/notificationService.server';
import type { NotificationFilters } from '@/types/notifications';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;
    const isRead = searchParams.get('isRead');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const filters: NotificationFilters = {};

    if (type) filters.type = type;
    if (isRead !== null) filters.isRead = isRead === 'true';
    if (dateFrom && dateTo) {
      filters.dateRange = {
        from: new Date(dateFrom),
        to: new Date(dateTo),
      };
    }

    const service = new NotificationServiceServer();
    const notifications = await service.getUserNotifications(user.id, limit);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    if (!body.type || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const service = new NotificationServiceServer();
    await service.createNotification(
      user.id,
      body.type,
      body.title,
      body.message,
      body.data
    );
    const notification = { success: true };

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
