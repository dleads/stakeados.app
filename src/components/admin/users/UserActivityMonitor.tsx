'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  User,
  FileText,
  Settings,
  Shield,
  Clock,
  MapPin,
  Monitor,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface ActivityFilters {
  user_id?: string;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
}

const ACTION_TYPES = [
  'login',
  'logout',
  'article.create',
  'article.edit',
  'article.delete',
  'article.publish',
  'news.create',
  'news.edit',
  'news.delete',
  'user.create',
  'user.edit',
  'user.delete',
  'role.change',
  'settings.update',
];

const RESOURCE_TYPES = [
  'article',
  'news',
  'user',
  'category',
  'tag',
  'settings',
];

export default function UserActivityMonitor() {
  const t = useTranslations('admin.users.activity');
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [filters, page]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        ),
      });

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/admin/users/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setTotalPages(data.totalPages);
      } else {
        throw new Error('Failed to load activities');
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('logout'))
      return <Shield className="h-4 w-4" />;
    if (action.includes('article') || action.includes('news'))
      return <FileText className="h-4 w-4" />;
    if (action.includes('user') || action.includes('role'))
      return <User className="h-4 w-4" />;
    if (action.includes('settings')) return <Settings className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'destructive';
    if (action.includes('create')) return 'default';
    if (action.includes('edit') || action.includes('update'))
      return 'secondary';
    if (action.includes('login')) return 'default';
    if (action.includes('logout')) return 'outline';
    return 'outline';
  };

  const formatActionDetails = (activity: ActivityLog) => {
    const { action, resource_type, resource_id, details } = activity;

    if (details.title) {
      return `${details.title}`;
    }

    if (resource_type && resource_id) {
      return `${resource_type} #${resource_id}`;
    }

    return action;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select
              value={filters.action || ''}
              onValueChange={value => handleFilterChange('action', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('filters.action')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('filters.allActions')}</SelectItem>
                {ACTION_TYPES.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.resource_type || ''}
              onValueChange={value =>
                handleFilterChange('resource_type', value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('filters.resourceType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('filters.allResources')}</SelectItem>
                {RESOURCE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                {t('actions.clearFilters')}
              </Button>
              <Button variant="outline" onClick={loadActivities}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('actions.refresh')}
              </Button>
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                {t('noActivities')}
              </div>
            ) : (
              activities.map(activity => (
                <div key={activity.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user?.avatar_url} />
                        <AvatarFallback>
                          {activity.user?.full_name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {activity.user?.full_name || activity.user?.email}
                          </span>
                          <Badge
                            variant={getActionColor(activity.action) as any}
                            className="flex items-center gap-1"
                          >
                            {getActionIcon(activity.action)}
                            {activity.action}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {formatActionDetails(activity)}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(
                              new Date(activity.created_at),
                              { addSuffix: true }
                            )}
                          </div>

                          {activity.ip_address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.ip_address}
                            </div>
                          )}

                          {activity.user_agent && (
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              {activity.user_agent.split(' ')[0]}
                            </div>
                          )}
                        </div>

                        {Object.keys(activity.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                              {t('showDetails')}
                            </summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
