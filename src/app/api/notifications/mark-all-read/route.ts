import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { NotificationService } from '@/lib/services/notificationService';

export async function PATCH(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const service = new NotificationService(supabase);
    await service.markAllNotificationsAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
