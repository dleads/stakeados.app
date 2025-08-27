'use client';

import { useTranslations } from 'next-intl';
import { Activity, CheckCircle, XCircle, Star, TrendingUp } from 'lucide-react';
import type { NewsSourceStats as StatsType } from '@/types/news';

interface NewsSourceStatsProps {
  stats: StatsType;
}

export function NewsSourceStats({ stats }: NewsSourceStatsProps) {
  const t = useTranslations('admin.news_sources.stats');

  const statItems = [
    {
      label: t('total_sources'),
      value: stats.total_sources,
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-800',
    },
    {
      label: t('active_sources'),
      value: stats.active_sources,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-800',
    },
    {
      label: t('healthy_sources'),
      value: stats.healthy_sources,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-800',
    },
    {
      label: t('sources_with_errors'),
      value: stats.sources_with_errors,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-800',
    },
    {
      label: t('avg_quality_score'),
      value: `${stats.avg_quality_score}/10`,
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-800',
    },
    {
      label: t('last_24h_fetches'),
      value: stats.last_24h_fetches,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={index}
            className={`${item.bgColor} ${item.borderColor} border rounded-lg p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 ${item.color}`} />
              <span className={`text-2xl font-bold ${item.color}`}>
                {item.value}
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-tight">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}
