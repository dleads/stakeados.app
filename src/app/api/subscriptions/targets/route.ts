import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = new SubscriptionService(supabase);
    const targets = await svc.getAvailableSubscriptionTargets();

    return NextResponse.json({ targets });
  } catch (error) {
    console.error('Error fetching subscription targets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription targets' },
      { status: 500 }
    );
  }
}
