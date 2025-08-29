import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { SubscriptionService } from '@/lib/services/subscriptionService';

export async function GET(_request: NextRequest) {
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
    const stats = await svc.getSubscriptionStats(user.id);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription stats' },
      { status: 500 }
    );
  }
}
