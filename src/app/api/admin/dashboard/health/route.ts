import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  apiRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
} from '@/lib/security/rateLimit';
import { getDashboardHealth } from '@/lib/services/dashboardService';

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 401 as const };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !profile.role || !['admin', 'editor'].includes(profile.role))
    return { status: 403 as const };
  return { status: 200 as const };
}

export async function GET(request: NextRequest) {
  const id = getClientIdentifier(request);
  const rl = apiRateLimit(id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.error },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const auth = await requireAdmin();
  if (auth.status !== 200) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: auth.status, headers: getRateLimitHeaders(rl) }
    );
  }

  try {
    const data = await getDashboardHealth();
    return NextResponse.json(data, { headers: getRateLimitHeaders(rl) });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to load health' },
      { status: 500, headers: getRateLimitHeaders(rl) }
    );
  }
}
