import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/cache/redis';
import { requireAdmin } from '@/lib/auth/apiAuth';

const redis = getRedisClient();
const KEY = 'platform:settings';

export async function GET(_request: NextRequest) {
  const auth = await requireAdmin(_request);
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const raw = await redis.get(KEY);
  return NextResponse.json(raw ? JSON.parse(raw) : {});
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  await redis.set(KEY, JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
