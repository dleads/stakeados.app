'use client';

import { useTranslations } from 'next-intl';
import {
  Edit,
  Trash2,
  ExternalLink,
  Activity,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Power,
  Globe,
  Rss,
  Code,
  Search,
} from 'lucide-react';
import type { NewsSourceWithHealth } from '@/types/news';

interface NewsSourceCardProps {
  source: NewsSourceWithHealth;
  onEdit: (source: NewsSourceWithHealth) => void;
  onDelete: (sourceId: string) => void;
  onToggleActive: (source: NewsSourceWithHealth) => void;
}

export function NewsSourceCard({
  source,
  onEdit,
  onDelete,
  onToggleActive,
}: NewsSourceCardProps) {
  const t = useTranslations('admin.news_sources');

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'rss':
        return <Rss className="w-4 h-4" />;
      case 'api':
        return <Code className="w-4 h-4" />;
      case 'scraper':
        return <Search className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
      case 'timeout':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getHealthStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
      case 'timeout':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatLastFetched = (date?: Date) => {
    if (!date) return t('never');

    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return t('days_ago', { count: days });
    if (hours > 0) return t('hours_ago', { count: hours });
    if (minutes > 0) return t('minutes_ago', { count: minutes });
    return t('just_now');
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 border transition-all duration-200 hover:border-primary/50 ${
        source.is_active ? 'border-gray-700' : 'border-gray-600 opacity-75'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{source.name}</h3>
            <div className="flex items-center gap-1">
              {getSourceTypeIcon(source.source_type)}
              <span className="text-xs text-gray-400 uppercase">
                {source.source_type}
              </span>
            </div>
          </div>

          {source.description && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-2">
              {source.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {source.language.toUpperCase()}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {source.quality_score}/10
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(source.fetch_interval / 60)}m
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <div
            className={`flex items-center gap-1 ${getHealthStatusColor(source.health_status?.status)}`}
          >
            {getHealthStatusIcon(source.health_status?.status)}
          </div>

          <button
            onClick={() => onToggleActive(source)}
            className={`p-1 rounded transition-colors ${
              source.is_active
                ? 'text-green-500 hover:text-green-400'
                : 'text-gray-500 hover:text-gray-400'
            }`}
            title={source.is_active ? t('deactivate') : t('activate')}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Categories */}
      {source.categories && source.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {source.categories.slice(0, 3).map((category, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
            >
              {category}
            </span>
          ))}
          {source.categories.length > 3 && (
            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
              +{source.categories.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Health Status */}
      {source.health_status && (
        <div className="bg-gray-900 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{t('last_check')}</span>
            <span className="text-white">
              {formatLastFetched(source.health_status.check_timestamp)}
            </span>
          </div>

          {source.health_status.response_time && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-400">{t('response_time')}</span>
              <span className="text-white">
                {source.health_status.response_time}ms
              </span>
            </div>
          )}

          {source.health_status.articles_fetched > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-400">{t('articles_fetched')}</span>
              <span className="text-white">
                {source.health_status.articles_fetched}
              </span>
            </div>
          )}

          {source.health_status.error_message && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-300">
              {source.health_status.error_message}
            </div>
          )}
        </div>
      )}

      {/* Failure Info */}
      {source.consecutive_failures > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-300 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {t('consecutive_failures', {
                count: source.consecutive_failures,
              })}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            title={t('view_source')}
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <span className="text-xs text-gray-500">
            Priority: {source.priority}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(source)}
            className="text-gray-400 hover:text-white transition-colors"
            title={t('edit')}
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(source.id)}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title={t('delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Last Fetched */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {t('last_fetched')}: {formatLastFetched(source.last_fetched_at)}
      </div>
    </div>
  );
}
