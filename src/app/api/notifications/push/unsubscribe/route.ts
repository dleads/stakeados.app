import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { PushNotificationService } from '@/lib/services/pushNotificationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const service = new PushNotificationService(supabase);
    await service.unsubscribeFromPush(user.id, body.endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    );
  }
}
