'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
} from 'lucide-react';
import { EditorialService } from '@/lib/services/editorialService';
import type { EditorialDashboardStats } from '@/types/editorial';

interface EditorialDashboardProps {
  className?: string;
}

export function EditorialDashboard({
  className = '',
}: EditorialDashboardProps) {
  const t = useTranslations('editorial');
  const [stats, setStats] = useState<EditorialDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await EditorialService.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard stats'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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

  const statCards = [
    {
      title: t('dashboard.pending_reviews'),
      value: stats.pending_reviews,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: t('dashboard.overdue_assignments'),
      value: stats.overdue_assignments,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      title: t('dashboard.moderation_queue'),
      value: stats.moderation_queue_size,
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: t('dashboard.scheduled_publications'),
      value: stats.scheduled_publications,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: t('dashboard.articles_this_week'),
      value: stats.articles_this_week,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: t('dashboard.reviews_this_week'),
      value: stats.reviews_this_week,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <button
          onClick={loadDashboardStats}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t('dashboard.refresh')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.quick_actions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('dashboard.view_pending_reviews')}
            </span>
          </button>
          <button className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('dashboard.assign_reviewers')}
            </span>
          </button>
          <button className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('dashboard.moderate_content')}
            </span>
          </button>
          <button className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('dashboard.schedule_publication')}
            </span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('dashboard.recent_activity')}
          </h2>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span>{t('dashboard.activity_placeholder')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>{t('dashboard.activity_placeholder')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
            <span>{t('dashboard.activity_placeholder')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
