import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { SubscriptionService } from '@/lib/services/subscriptionService';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
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
