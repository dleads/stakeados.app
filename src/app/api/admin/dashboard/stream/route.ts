import { NextRequest } from 'next/server';
import {
  getDashboardMetrics,
  getDashboardActivity,
  getDashboardHealth,
  getQuickActions,
} from '@/lib/services/dashboardService';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
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

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.status !== 200)
    return new Response('Unauthorized', { status: auth.status });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      async function push() {
        const [m, a, h, q] = await Promise.all([
          getDashboardMetrics(),
          getDashboardActivity(20),
          getDashboardHealth(),
          getQuickActions(),
        ]);
        controller.enqueue(
          enc.encode(
            `event: update\ndata: ${JSON.stringify({ m, a, h, q })}\n\n`
          )
        );
      }
      await push();
      const id = setInterval(push, 15000);
      const close = () => clearInterval(id);
      (req as any).signal?.addEventListener?.('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
