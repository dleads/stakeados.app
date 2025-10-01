import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import type { CreateSubscriptionRequest } from '@/types/notifications';

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
    const type = searchParams.get('type') as
      | 'category'
      | 'tag'
      | 'author'
      | null;
    const isActive = searchParams.get('isActive');
    const frequency = searchParams.get('frequency') as
      | 'immediate'
      | 'daily'
      | 'weekly'
      | null;

    const filters = {
      ...(type && { type }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(frequency && { frequency }),
    };

    const svc = new SubscriptionService(supabase);
    const subscriptions = await svc.getUserSubscriptions(user.id, filters);

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
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

    const body = (await request.json()) as CreateSubscriptionRequest;

    // Validate request body
    if (!body.subscriptionType || !body.subscriptionTarget) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['category', 'tag', 'author'].includes(body.subscriptionType)) {
      return NextResponse.json(
        { error: 'Invalid subscription type' },
        { status: 400 }
      );
    }

    if (
      body.frequency &&
      !['immediate', 'daily', 'weekly'].includes(body.frequency)
    ) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }

    const svc = new SubscriptionService(supabase);
    const subscription = await svc.createSubscription(user.id, body);

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
