export interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    newToday: number;
    changePercent: number;
  };
  content: {
    articles: number;
    news: number;
    pendingReviews: number;
    publishedToday: number;
  };
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  system: {
    uptime: string;
    responseTime: number;
    errorRate: number;
    lastUpdate: string; // ISO
  };
}

export type ActivityType = 'article' | 'news' | 'user' | 'system' | 'error';
export type ActivityPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string; // ISO
  priority: ActivityPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export type ServiceStatus = 'healthy' | 'warning' | 'error';

export interface SystemHealth {
  database: ServiceStatus;
  api: ServiceStatus;
  supabase: ServiceStatus;
  newsAggregation: ServiceStatus;
  aiProcessing: ServiceStatus;
  lastChecked: string; // ISO
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  count?: number;
  priority: 'low' | 'medium' | 'high';
  icon: string; // Icon name from lucide-react
  actionUrl?: string;
}
