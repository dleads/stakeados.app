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

    if (!body.subscription || !body.subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid push subscription' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || undefined;
    const service = new PushNotificationService(supabase);
    const subscription = await service.subscribeToPush(
      user.id,
      body.subscription,
      userAgent
    );

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const service = new PushNotificationService(supabase);
    const vapidPublicKey = await service.getVapidPublicKey();

    return NextResponse.json({ vapidPublicKey });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID public key' },
      { status: 500 }
    );
  }
}
