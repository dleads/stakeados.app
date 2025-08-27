'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  TrendingUp,
  FileText,
  Newspaper,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import type { NotificationDigest } from '@/types/notifications';

interface NotificationDigestProps {
  className?: string;
  digestType?: 'daily' | 'weekly';
  preview?: boolean;
}

export function NotificationDigest({
  className,
  digestType = 'daily',
  preview = false,
}: NotificationDigestProps) {
  const t = useTranslations('notifications');
  const { user } = useAuth();

  const { data: digests = [], isLoading } = useQuery({
    queryKey: ['notification-digests', digestType],
    queryFn: async () => {
      const response = await fetch(
        `/api/notifications/digests?type=${digestType}`
      );
      if (!response.ok) throw new Error('Failed to fetch digests');
      const data = await response.json();
      return data.digests as NotificationDigest[];
    },
    enabled: !!user?.id && !preview,
  });

  const { data: previewDigest, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['notification-digest-preview', digestType],
    queryFn: async () => {
      const response = await fetch(
        `/api/notifications/digests/preview?type=${digestType}`
      );
      if (!response.ok) throw new Error('Failed to fetch digest preview');
      const data = await response.json();
      return data.digest as NotificationDigest;
    },
    enabled: !!user?.id && preview,
  });

  const currentDigest = preview ? previewDigest : digests[0];

  if (isLoading || isLoadingPreview) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentDigest) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            {t(`digest.${digestType}.title`)}
          </CardTitle>
          <CardDescription>
            {t(`digest.${digestType}.description`)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('digest.empty.title')}
            </h3>
            <p className="text-gray-600">{t('digest.empty.description')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            {t(`digest.${digestType}.title`)}
            {preview && (
              <Badge variant="outline" className="ml-2">
                {t('digest.preview')}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            {currentDigest.scheduledFor.toLocaleDateString()}
          </div>
        </div>
        <CardDescription>
          {t('digest.totalItems', { count: currentDigest.content.totalCount })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Articles Section */}
        {currentDigest.content.articles.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold">
                {t('digest.sections.articles')} (
                {currentDigest.content.articles.length})
              </h3>
            </div>
            <div className="space-y-3">
              {currentDigest.content.articles.map(article => (
                <div
                  key={article.id}
                  className="border-l-4 border-blue-500 pl-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {article.title.en || Object.values(article.title)[0]}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {article.summary.en ||
                          Object.values(article.summary)[0]}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <Badge variant="outline">{article.category}</Badge>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {article.publishedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`/articles/${article.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News Section */}
        {currentDigest.content.news.length > 0 && (
          <>
            {currentDigest.content.articles.length > 0 && <Separator />}
            <div>
              <div className="flex items-center mb-4">
                <Newspaper className="w-5 h-5 mr-2 text-green-600" />
                <h3 className="text-lg font-semibold">
                  {t('digest.sections.news')} (
                  {currentDigest.content.news.length})
                </h3>
              </div>
              <div className="space-y-3">
                {currentDigest.content.news.map(newsItem => (
                  <div
                    key={newsItem.id}
                    className="border-l-4 border-green-500 pl-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {newsItem.title.en ||
                            Object.values(newsItem.title)[0]}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {newsItem.summary.en ||
                            Object.values(newsItem.summary)[0]}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{newsItem.source}</span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {newsItem.publishedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`/news/${newsItem.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Digest Footer */}
        <Separator />
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {t('digest.footer.trending')}
          </div>
          <div className="flex items-center space-x-4">
            {currentDigest.sentAt && (
              <span className="flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                {t('digest.footer.sent')}{' '}
                {currentDigest.sentAt.toLocaleString()}
              </span>
            )}
            <Badge
              variant={
                currentDigest.status === 'sent' ? 'default' : 'secondary'
              }
            >
              {t(`digest.status.${currentDigest.status}`)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
