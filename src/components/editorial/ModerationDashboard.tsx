'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  Clock,
  Zap,
} from 'lucide-react';

interface ModerationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  escalated: number;
  by_reason: Record<string, number>;
  by_priority: Record<string, number>;
}

interface ModerationDashboardProps {
  className?: string;
}

export function ModerationDashboard({
  className = '',
}: ModerationDashboardProps) {
  const t = useTranslations('editorial');
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [timeframe]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/moderation/analyze?timeframe=${timeframe}`
      );
      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading moderation stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/moderation/batch?daysOld=30', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cleanup');

      await loadStats();
    } catch (err) {
      console.error('Error cleaning up:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const approvalRate =
    stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  const rejectionRate =
    stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('moderation.dashboard_title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('moderation.dashboard_subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="day">{t('moderation.timeframe.day')}</option>
            <option value="week">{t('moderation.timeframe.week')}</option>
            <option value="month">{t('moderation.timeframe.month')}</option>
          </select>
          <button
            onClick={handleCleanup}
            disabled={processing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {processing
              ? t('moderation.cleaning_up')
              : t('moderation.cleanup_old')}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('moderation.total_items')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('moderation.pending_items')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-50 dark:bg-yellow-900/20">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('moderation.approval_rate')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {approvalRate}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('moderation.rejection_rate')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {rejectionRate}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Reason */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('moderation.by_reason')}
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.by_reason).map(([reason, count]) => {
              const percentage =
                stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {t(`moderation.reason.${reason}`)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Priority */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('moderation.by_priority')}
            </h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.by_priority).map(([priority, count]) => {
              const percentage =
                stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const priorityColor =
                {
                  urgent: 'bg-red-600',
                  high: 'bg-orange-600',
                  medium: 'bg-yellow-600',
                  low: 'bg-green-600',
                }[priority] || 'bg-gray-600';

              return (
                <div
                  key={priority}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {t(`moderation.priority.${priority}`)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${priorityColor} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('moderation.quick_actions')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Zap className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('moderation.auto_moderate_pending')}
            </span>
          </button>
          <button className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('moderation.export_report')}
            </span>
          </button>
          <button className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('moderation.update_policies')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
