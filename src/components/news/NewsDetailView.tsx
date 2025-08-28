'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@/lib/utils/navigation';
import {
  getNewsTitle,
  getNewsSummary,
  getNewsContent,
} from '@/lib/supabase/news-client';
import {
  formatDate,
  formatRelativeTime,
  calculateReadingTime,
} from '@/lib/utils';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  ExternalLink,
  Heart,
  Share2,
  Bookmark,
  Eye,
  Globe,
  Tag,
  Star,
  ArrowLeft,
} from 'lucide-react';
import type { Locale } from '@/types';

type NewsArticle = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  source_url: string | null;
  source_name: string | null;
  published_at: string | null;
  category_id: string | null;
  language: string | null;
  processed: boolean | null;
  trending_score: number | null;
  created_at: string | null;
  updated_at: string | null;
  // Additional fields that might be used
  ai_processed?: boolean | null;
  ai_sentiment?: string | null;
  cluster_id?: string | null;
  description?: string | null;
  fetched_at?: string | null;
  importance_score?: number | null;
  tags?: string[] | null;
  url?: string | null;
  image_url?: string | null;
};

interface NewsDetailViewProps {
  articleId: string;
  locale?: Locale;
  className?: string;
}

interface NewsDetailResponse {
  article: NewsArticle & {
    interactionCounts: {
      views: number;
      likes: number;
      shares: number;
      bookmarks: number;
    };
    userInteractions: {
      hasViewed: boolean;
      hasLiked: boolean;
      hasShared: boolean;
      hasBookmarked: boolean;
    };
  };
  relatedArticles: NewsArticle[];
}

// Fetch article details
const fetchArticleDetails = async (
  articleId: string
): Promise<NewsDetailResponse> => {
  const response = await fetch(`/api/news/${articleId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch article details');
  }
  return response.json();
};

// Record article view
const recordView = async (articleId: string): Promise<void> => {
  await fetch(`/api/news/${articleId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'view' }),
  });
};

// Handle article interactions
const handleInteraction = async (
  articleId: string,
  action: 'like' | 'share' | 'bookmark'
) => {
  const response = await fetch(`/api/news/${articleId}/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${action} article`);
  }

  return response.json();
};

export default function NewsDetailView({
  articleId,
  locale = 'en',
  className = '',
}: NewsDetailViewProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [hasRecordedView, setHasRecordedView] = useState(false);

  // Fetch article details
  const { data, isLoading, error } = useQuery({
    queryKey: ['newsDetail', articleId],
    queryFn: () => fetchArticleDetails(articleId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Interaction mutations
  const likeMutation = useMutation({
    mutationFn: () => handleInteraction(articleId, 'like'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsDetail', articleId] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => handleInteraction(articleId, 'share'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsDetail', articleId] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => handleInteraction(articleId, 'bookmark'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsDetail', articleId] });
    },
  });

  // Record view when component mounts
  useEffect(() => {
    if (data && !hasRecordedView) {
      recordView(articleId).catch(console.error);
      setHasRecordedView(true);
    }
  }, [data, articleId, hasRecordedView]);

  // Handle native sharing
  const handleNativeShare = async () => {
    if (!data) return;

    const title = getNewsTitle(data.article, locale);
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: getNewsSummary(data.article, locale),
          url,
        });
        shareMutation.mutate();
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      shareMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className={`news-detail-view ${className}`}>
        <NewsDetailSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`news-detail-view ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-stakeados-gray-700 rounded-full flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-stakeados-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {t('news.detail.notFound')}
          </h2>
          <p className="text-stakeados-gray-300 mb-4">
            {t('news.detail.notFoundDescription')}
          </p>
          <Link href="/news" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('news.detail.backToNews')}
          </Link>
        </div>
      </div>
    );
  }

  const { article, relatedArticles } = data;
  const title = getNewsTitle(article, locale);
  const summary = getNewsSummary(article, locale);
  const content = getNewsContent(article, locale);
  const readingTime = calculateReadingTime(content);

  return (
    <div className={`news-detail-view ${className}`}>
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/news"
          className="flex items-center gap-2 text-stakeados-gray-300 hover:text-stakeados-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('news.detail.backToNews')}
        </Link>
      </div>

      {/* Article Header */}
      <article className="mb-8">
        <header className="mb-6">
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-stakeados-primary/20 text-stakeados-primary rounded-full text-sm font-semibold border border-stakeados-primary/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            {title}
          </h1>

          {/* Summary */}
          <p className="text-xl text-stakeados-gray-300 mb-6 leading-relaxed">
            {summary}
          </p>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-stakeados-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {article.published_at
                  ? formatDate(article.published_at)
                  : 'Unknown date'}
              </span>
              <span className="text-stakeados-gray-600">•</span>
              <span>
                {article.published_at
                  ? formatRelativeTime(article.published_at)
                  : 'Unknown time'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>

            {article.importance_score && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>
                  {t('news.relevanceScore', {
                    score: article.importance_score.toFixed(1),
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Source Attribution */}
          <div className="flex items-center justify-between p-4 bg-stakeados-gray-800/50 rounded-gaming border border-stakeados-gray-700 mb-6">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-stakeados-blue" />
              <div>
                <div className="text-sm font-medium text-white">
                  {article.source_name || 'Unknown Source'}
                </div>
              </div>
            </div>

            <a
              href={article.url || article.source_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-stakeados-blue hover:text-stakeados-primary hover:bg-stakeados-blue/10 rounded-gaming transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              {t('news.detail.viewOriginal')}
            </a>
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center justify-between p-4 bg-stakeados-gray-900/50 rounded-gaming border border-stakeados-gray-700">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-stakeados-gray-400">
                <Eye className="w-4 h-4" />
                <span>{article.interactionCounts.views.toLocaleString()}</span>
              </div>

              <button
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-gaming transition-colors ${
                  article.userInteractions.hasLiked
                    ? 'text-red-400 bg-red-400/10'
                    : 'text-stakeados-gray-400 hover:text-red-400 hover:bg-red-400/10'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${article.userInteractions.hasLiked ? 'fill-current' : ''}`}
                />
                <span>{article.interactionCounts.likes.toLocaleString()}</span>
              </button>

              <button
                onClick={handleNativeShare}
                disabled={shareMutation.isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-gaming transition-colors ${
                  article.userInteractions.hasShared
                    ? 'text-stakeados-blue bg-stakeados-blue/10'
                    : 'text-stakeados-gray-400 hover:text-stakeados-blue hover:bg-stakeados-blue/10'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>{article.interactionCounts.shares.toLocaleString()}</span>
              </button>

              <button
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-gaming transition-colors ${
                  article.userInteractions.hasBookmarked
                    ? 'text-stakeados-primary bg-stakeados-primary/10'
                    : 'text-stakeados-gray-400 hover:text-stakeados-primary hover:bg-stakeados-primary/10'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${article.userInteractions.hasBookmarked ? 'fill-current' : ''}`}
                />
                <span>
                  {article.interactionCounts.bookmarks.toLocaleString()}
                </span>
              </button>
            </div>

            {article.ai_processed && (
              <div className="flex items-center gap-2 px-3 py-1 bg-stakeados-blue/20 text-stakeados-blue rounded-full text-xs font-semibold">
                <Star className="w-3 h-3" />
                {t('news.aiProcessed')}
              </div>
            )}
          </div>
        </header>

        {/* Article Image */}
        {article.image_url && (
          <div className="mb-8 relative w-full h-64 md:h-96">
            <Image
              src={article.image_url}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 75vw"
              className="object-cover rounded-gaming"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div
            className="text-stakeados-gray-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stakeados-gray-700">
            <h3 className="text-sm font-semibold text-stakeados-gray-400 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {t('news.detail.tags')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-stakeados-gray-800 text-stakeados-gray-300 rounded-full text-sm border border-stakeados-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            {t('news.detail.relatedArticles')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map(relatedArticle => (
              <Link
                key={relatedArticle.id}
                href={`/news/${relatedArticle.id}`}
                className="card-primary hover:card-highlight transition-all group"
              >
                {relatedArticle.image_url && (
                  <div className="relative w-full h-32">
                    <Image
                      src={relatedArticle.image_url}
                      alt={getNewsTitle(relatedArticle, locale)}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover rounded-t-gaming"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-stakeados-primary transition-colors">
                    {getNewsTitle(relatedArticle, locale)}
                  </h3>
                  <p className="text-sm text-stakeados-gray-300 line-clamp-2 mb-3">
                    {getNewsSummary(relatedArticle, locale)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-stakeados-gray-400">
                    <span>
                      {relatedArticle.source_name || 'Unknown Source'}
                    </span>
                    <span>
                      {relatedArticle.published_at
                        ? formatRelativeTime(relatedArticle.published_at)
                        : 'Unknown time'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Skeleton component for loading state
function NewsDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Back button */}
      <div className="h-4 bg-stakeados-gray-700 rounded w-32 mb-6"></div>

      {/* Categories */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-stakeados-gray-700 rounded-full w-16"></div>
        <div className="h-6 bg-stakeados-gray-700 rounded-full w-20"></div>
      </div>

      {/* Title */}
      <div className="space-y-3 mb-4">
        <div className="h-8 bg-stakeados-gray-700 rounded w-3/4"></div>
        <div className="h-8 bg-stakeados-gray-700 rounded w-1/2"></div>
      </div>

      {/* Summary */}
      <div className="space-y-2 mb-6">
        <div className="h-6 bg-stakeados-gray-700 rounded"></div>
        <div className="h-6 bg-stakeados-gray-700 rounded w-5/6"></div>
      </div>

      {/* Meta */}
      <div className="flex gap-6 mb-6">
        <div className="h-4 bg-stakeados-gray-700 rounded w-24"></div>
        <div className="h-4 bg-stakeados-gray-700 rounded w-20"></div>
        <div className="h-4 bg-stakeados-gray-700 rounded w-16"></div>
      </div>

      {/* Source */}
      <div className="h-16 bg-stakeados-gray-700 rounded mb-6"></div>

      {/* Interactions */}
      <div className="h-12 bg-stakeados-gray-700 rounded mb-8"></div>

      {/* Image */}
      <div className="h-64 bg-stakeados-gray-700 rounded mb-8"></div>

      {/* Content */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 bg-stakeados-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  );
}
