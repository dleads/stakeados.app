'use client';

import { useEffect, useState } from 'react';
import { useIsMounted } from './useIsMounted';
import type {
  DashboardMetrics,
  ActivityItem,
  SystemHealth,
  QuickAction,
} from '@/types/adminDashboard';

export function useDashboardStream() {
  const mounted = useIsMounted();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [usingPolling, setUsingPolling] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    async function fetchAll() {
      try {
        const [mRes, aRes, hRes, qRes] = await Promise.all([
          fetch('/api/admin/dashboard/metrics'),
          fetch('/api/admin/dashboard/activity'),
          fetch('/api/admin/dashboard/health'),
          fetch('/api/admin/dashboard/quick-actions'),
        ]);
        if (!mRes.ok || !aRes.ok || !hRes.ok || !qRes.ok) return;
        const [m, a, h, q] = await Promise.all([
          mRes.json(),
          aRes.json(),
          hRes.json(),
          qRes.json(),
        ]);
        setMetrics(m);
        setActivity(a);
        setHealth(h);
        setActions(q);
      } catch {
        // ignore
      }
    }

    function startPolling() {
      setUsingPolling(true);
      fetchAll();
      pollId = setInterval(fetchAll, 15000);
    }

    try {
      es = new EventSource('/api/admin/dashboard/stream');
      const onUpdate = (e: MessageEvent) => {
        const { m, a, h, q } = JSON.parse(e.data);
        setMetrics(m);
        setActivity(a);
        setHealth(h);
        setActions(q);
      };
      es.addEventListener('update', onUpdate as any);
      es.addEventListener('error', () => {
        // Fallback a polling si SSE falla (401 o red)
        if (es) {
          es.close();
          es = null;
        }
        if (!usingPolling) startPolling();
      });
    } catch {
      startPolling();
    }

    return () => {
      if (es) es.close();
      if (pollId) clearInterval(pollId);
    };
  }, [mounted]);

  return { metrics, activity, health, actions };
}
