import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import type { UpdateSubscriptionRequest } from '@/types/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as UpdateSubscriptionRequest;

    // Validate frequency if provided
    if (
      body.frequency &&
      !['immediate', 'daily', 'weekly'].includes(body.frequency)
    ) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }

    const svc = new SubscriptionService(supabase);
    const subscription = await svc.updateSubscription(user.id, params.id, body);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = new SubscriptionService(supabase);
    await svc.deleteSubscription(user.id, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}
