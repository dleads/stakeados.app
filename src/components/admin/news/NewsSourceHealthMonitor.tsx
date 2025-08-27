'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsSourceHealth {
  id: string;
  source_id: string;
  status: 'healthy' | 'warning' | 'error' | 'timeout';
  response_time?: number;
  articles_fetched: number;
  error_message?: string;
  last_check: string;
  uptime_percentage: number;
}

interface NewsSourceHealthMonitorProps {
  sources: Array<{
    id: string;
    name: string;
    url: string;
    is_active: boolean;
    health_status: 'healthy' | 'warning' | 'error' | 'timeout';
    last_fetched_at?: string;
    articles_today: number;
    priority: number;
    consecutive_failures: number;
  }>;
  className?: string;
}

export default function NewsSourceHealthMonitor({
  sources,
  className,
}: NewsSourceHealthMonitorProps) {
  const t = useTranslations('admin.news.sources');

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'timeout':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-500/30 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'timeout':
        return 'border-orange-500/30 bg-orange-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return t('status.healthy');
      case 'warning':
        return t('status.warning');
      case 'error':
        return t('status.error');
      case 'timeout':
        return t('status.timeout');
      default:
        return t('status.unknown');
    }
  };

  const healthySources = sources.filter(
    s => s.health_status === 'healthy'
  ).length;
  const totalSources = sources.length;
  const healthPercentage =
    totalSources > 0 ? Math.round((healthySources / totalSources) * 100) : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Health Summary */}
      <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-stakeados-primary" />
            {t('healthMonitor.title')}
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                healthPercentage >= 80
                  ? 'bg-green-500'
                  : healthPercentage >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              )}
            />
            <span className="text-white font-medium">{healthPercentage}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {sources.filter(s => s.health_status === 'healthy').length}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {t('healthMonitor.healthy')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {sources.filter(s => s.health_status === 'warning').length}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {t('healthMonitor.warning')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {sources.filter(s => s.health_status === 'error').length}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {t('healthMonitor.error')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {sources.filter(s => s.health_status === 'timeout').length}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {t('healthMonitor.timeout')}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Source Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map(source => (
          <div
            key={source.id}
            className={cn(
              'bg-gaming-card border rounded-gaming p-4 transition-all duration-200',
              getHealthColor(source.health_status)
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate flex items-center gap-2">
                  {source.is_active ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-500" />
                  )}
                  {source.name}
                </h4>
                <p className="text-stakeados-gray-400 text-sm truncate">
                  {source.url}
                </p>
              </div>
              {getHealthIcon(source.health_status)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stakeados-gray-400">
                  {t('healthMonitor.status')}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    source.health_status === 'healthy'
                      ? 'text-green-500'
                      : source.health_status === 'warning'
                        ? 'text-yellow-500'
                        : source.health_status === 'error'
                          ? 'text-red-500'
                          : source.health_status === 'timeout'
                            ? 'text-orange-500'
                            : 'text-gray-500'
                  )}
                >
                  {getStatusText(source.health_status)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-stakeados-gray-400">
                  {t('healthMonitor.articlesToday')}
                </span>
                <span className="text-white font-medium">
                  {source.articles_today}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-stakeados-gray-400">
                  {t('healthMonitor.priority')}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        i < source.priority
                          ? 'bg-stakeados-primary'
                          : 'bg-stakeados-gray-600'
                      )}
                    />
                  ))}
                </div>
              </div>

              {source.consecutive_failures > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stakeados-gray-400">
                    {t('healthMonitor.failures')}
                  </span>
                  <span className="text-red-500 font-medium">
                    {source.consecutive_failures}
                  </span>
                </div>
              )}

              {source.last_fetched_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stakeados-gray-400">
                    {t('healthMonitor.lastFetch')}
                  </span>
                  <span className="text-stakeados-gray-300">
                    {new Date(source.last_fetched_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stakeados-gray-600">
              <button className="flex-1 py-2 px-3 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white text-sm rounded-gaming transition-colors">
                {t('healthMonitor.test')}
              </button>
              <button className="p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors">
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sources.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <p className="text-stakeados-gray-400">
            {t('healthMonitor.noSources')}
          </p>
        </div>
      )}
    </div>
  );
}
