'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import {
  Languages,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  FileText,
  Globe,
} from 'lucide-react';
import { Locale } from '@/types/content';

interface TranslationStats {
  total_content: number;
  fully_translated: number;
  partially_translated: number;
  pending_translation: number;
  by_locale: {
    [key in Locale]: {
      translated: number;
      pending: number;
      percentage: number;
    };
  };
  by_content_type: {
    articles: {
      total: number;
      translated: number;
      pending: number;
    };
    news: {
      total: number;
      translated: number;
      pending: number;
    };
  };
  recent_activity: TranslationActivity[];
}

interface TranslationActivity {
  id: string;
  content_id: string;
  content_title: string;
  content_type: 'article' | 'news';
  source_locale: Locale;
  target_locale: Locale;
  translator_name: string;
  action: 'created' | 'completed' | 'updated';
  created_at: string;
}

interface TranslationStatusTrackerProps {
  contentId?: string;
  showGlobalStats?: boolean;
}

export default function TranslationStatusTracker({
  contentId,
  showGlobalStats = false,
}: TranslationStatusTrackerProps) {
  const t = useTranslations('translation.status');

  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranslationStats();
  }, [contentId, showGlobalStats]);

  const fetchTranslationStats = async () => {
    setLoading(true);
    try {
      const url = showGlobalStats
        ? '/api/translation/stats'
        : `/api/translation/stats?content_id=${contentId}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching translation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getActionIcon = (action: TranslationActivity['action']) => {
    switch (action) {
      case 'created':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'updated':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {t('no_data')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {showGlobalStats ? t('global_progress') : t('content_progress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.fully_translated}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('fully_translated')}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.partially_translated}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('partially_translated')}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.pending_translation}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('pending_translation')}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('overall_completion')}</span>
                <span>
                  {Math.round(
                    (stats.fully_translated / stats.total_content) * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={(stats.fully_translated / stats.total_content) * 100}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language-specific Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('by_language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.by_locale).map(([locale, data]) => (
              <div key={locale} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{locale.toUpperCase()}</Badge>
                    <span className="text-sm">
                      {data.translated} / {data.translated + data.pending}
                    </span>
                  </div>
                  <Badge className={getStatusColor(data.percentage)}>
                    {Math.round(data.percentage)}%
                  </Badge>
                </div>
                <Progress value={data.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Type Breakdown */}
      {showGlobalStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('by_content_type')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{t('articles')}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.by_content_type.articles.translated} /{' '}
                  {stats.by_content_type.articles.total} {t('translated')}
                </div>
                <Progress
                  value={
                    (stats.by_content_type.articles.translated /
                      stats.by_content_type.articles.total) *
                    100
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">{t('news')}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.by_content_type.news.translated} /{' '}
                  {stats.by_content_type.news.total} {t('translated')}
                </div>
                <Progress
                  value={
                    (stats.by_content_type.news.translated /
                      stats.by_content_type.news.total) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {stats.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('recent_activity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_activity.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getActionIcon(activity.action)}
                    <div>
                      <div className="font-medium text-sm">
                        {activity.content_title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.source_locale.toUpperCase()} →{' '}
                        {activity.target_locale.toUpperCase()} •{' '}
                        {activity.translator_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {t(`actions.${activity.action}`)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
