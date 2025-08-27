import { createClient } from '@/lib/supabase/server';
import type {
  DashboardMetrics,
  ActivityItem,
  SystemHealth,
  QuickAction,
} from '@/types/adminDashboard';
import { contentMonitoring } from '@/lib/monitoring/contentMonitoring';
import { dashboardCache } from '@/lib/cache/dashboardCache';

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function calcMetrics(): Promise<DashboardMetrics> {
  const supabase = createClient();

  const [
    { count: articleCount },
    { count: pendingReviews },
    { count: publishedToday },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'review'),
    supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .gte('published_at', startOfTodayISO()),
  ]);

  const [{ count: newsCount }, { count: userCount }] = await Promise.all([
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  const { data: agg } = await supabase.from('articles').select('views, likes');
  const views = agg?.reduce((a, b) => a + (b.views || 0), 0) ?? 0;
  const likes = agg?.reduce((a, b) => a + (b.likes || 0), 0) ?? 0;

  return {
    users: { total: userCount ?? 0, active: 0, newToday: 0, changePercent: 0 },
    content: {
      articles: articleCount ?? 0,
      news: newsCount ?? 0,
      pendingReviews: pendingReviews ?? 0,
      publishedToday: publishedToday ?? 0,
    },
    engagement: { views, likes, comments: 0, shares: 0 },
    system: {
      uptime: '99.9%',
      responseTime: 0,
      errorRate: 0,
      lastUpdate: new Date().toISOString(),
    },
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const key = 'dashboard:metrics';
  const cached = await dashboardCache.get<DashboardMetrics>(key);
  if (cached) return cached;
  const data = await calcMetrics();
  await dashboardCache.set(key, data, dashboardCache.TTL.metrics);
  return data;
}

export async function getDashboardActivity(
  limit = 20
): Promise<ActivityItem[]> {
  const key = `dashboard:activity:${limit}`;
  const cached = await dashboardCache.get<ActivityItem[]>(key);
  if (cached) return cached;
  const supabase = createClient();
  const [articles, news, profiles] = await Promise.all([
    supabase
      .from('articles')
      .select('id,title,created_at,status')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('news')
      .select('id,title,published_at')
      .order('published_at', { ascending: false })
      .limit(limit),
    supabase
      .from('profiles')
      .select('id,display_name,created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [
    ...(articles.data || []).map(a => ({
      id: `article-${(a as any).id}`,
      type: 'article' as const,
      title: (a as any).title,
      description: `Artículo ${(a as any).status}`,
      timestamp: (a as any).created_at,
      priority: 'low' as const,
      actionUrl: '/admin/articles',
    })),
    ...(news.data || []).map(n => ({
      id: `news-${(n as any).id}`,
      type: 'news' as const,
      title: (n as any).title,
      description: `Noticia agregada`,
      timestamp: (n as any).published_at,
      priority: 'low' as const,
      actionUrl: '/admin/news',
    })),
    ...(profiles.data || []).map(p => ({
      id: `user-${(p as any).id}`,
      type: 'user' as const,
      title: (p as any).display_name || 'Nuevo usuario',
      description: `Nuevo registro`,
      timestamp: (p as any).created_at,
      priority: 'medium' as const,
      actionUrl: '/admin',
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit);

  await dashboardCache.set(key, items, dashboardCache.TTL.activity);
  return items;
}

export async function getDashboardHealth(): Promise<SystemHealth> {
  const key = 'dashboard:health';
  const cached = await dashboardCache.get<SystemHealth>(key);
  if (cached) return cached;
  const sys = await contentMonitoring.getSystemHealth();
  const status: SystemHealth['database'] =
    sys.status === 'healthy'
      ? 'healthy'
      : sys.status === 'degraded'
        ? 'warning'
        : 'error';
  const data: SystemHealth = {
    database: status,
    api: status,
    supabase: status,
    newsAggregation: status,
    aiProcessing: status,
    lastChecked: new Date().toISOString(),
  };
  await dashboardCache.set(key, data, dashboardCache.TTL.health);
  return data;
}

export async function getQuickActions(): Promise<QuickAction[]> {
  const key = 'dashboard:quick';
  const cached = await dashboardCache.get<QuickAction[]>(key);
  if (cached) return cached;
  const supabase = createClient();
  const [{ count: pendingReviews }] = await Promise.all([
    supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'review'),
    // TODO: Re-enable when system_alerts table is available
    // supabase.from('system_alerts').select('id').eq('resolved', false).limit(1),
  ]);
  const data: QuickAction[] = [
    {
      id: 'pending-reviews',
      title: 'Revisiones pendientes',
      description: 'Artículos esperando revisión',
      count: pendingReviews ?? 0,
      priority:
        (pendingReviews ?? 0) > 10
          ? 'high'
          : (pendingReviews ?? 0) > 0
            ? 'medium'
            : 'low',
      icon: 'FileText',
      actionUrl: '/admin/articles',
    },
    {
      id: 'system-alerts',
      title: 'Alertas del sistema',
      description: 'Incidencias activas',
      count: 0, // TODO: Re-enable when system_alerts table is available
      priority: 'low',
      icon: 'AlertTriangle',
      actionUrl: '/admin/news-aggregation',
    },
  ];
  await dashboardCache.set(key, data, dashboardCache.TTL.quick);
  return data;
}
