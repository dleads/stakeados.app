import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import { getNewsTitle, getNewsSummary } from '@/lib/supabase/news';
import {
  formatDate,
  formatRelativeTime,
  truncateText,
  calculateReadingTime,
} from '@/lib/utils';
import {
  Calendar,
  Clock,
  ExternalLink,
  TrendingUp,
  Star,
  Globe,
  Tag,
  Eye,
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

interface NewsCardProps {
  article: NewsArticle;
  locale?: Locale;
  showSource?: boolean;
  showRelevanceScore?: boolean;
  showCategories?: boolean;
  showKeywords?: boolean;
  className?: string;
}

export default function NewsCard({
  article,
  locale = 'en',
  showSource = true,
  showRelevanceScore = false,
  showCategories = true,
  showKeywords = false,
  className = '',
}: NewsCardProps) {
  const t = useTranslations();

  const title = getNewsTitle(article, locale);
  const summary = getNewsSummary(article, locale);
  const readingTime = calculateReadingTime(summary);

  const getRelevanceColor = (score: number) => {
    if (score >= 8) return 'text-stakeados-primary';
    if (score >= 6) return 'text-stakeados-blue';
    if (score >= 4) return 'text-stakeados-yellow';
    return 'text-stakeados-orange';
  };

  const getRelevanceIcon = (score: number) => {
    if (score >= 8) return <Star className="w-4 h-4" />;
    if (score >= 6) return <TrendingUp className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  return (
    <article
      className={`card-primary hover:card-highlight transition-all group ${className}`}
    >
      {/* Article Image */}
      {article.image_url && (
        <div className="relative w-full h-40 md:h-48 rounded-t-gaming overflow-hidden mb-4">
          <Image
            src={article.image_url}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={false}
          />
        </div>
      )}
      {/* Article Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Relevance Score */}
          {showRelevanceScore && article.importance_score && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getRelevanceColor(article.importance_score)}`}
              >
                {getRelevanceIcon(article.importance_score)}
                {article.importance_score.toFixed(1)}/10
              </span>
              {article.ai_processed && (
                <span className="px-2 py-1 bg-stakeados-blue/20 text-stakeados-blue rounded text-xs font-semibold">
                  AI PROCESSED
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-stakeados-primary transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Summary */}
          <p className="text-stakeados-gray-300 text-sm line-clamp-3 mb-3">
            {truncateText(summary, 150)}
          </p>
        </div>
      </div>

      {/* Tags */}
      {showCategories && article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-stakeados-primary/20 text-stakeados-primary rounded text-xs font-semibold border border-stakeados-primary/30"
            >
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="px-2 py-1 bg-stakeados-gray-700 text-stakeados-gray-400 rounded text-xs">
              +{article.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Keywords */}
      {showKeywords && article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.slice(0, 4).map(keyword => (
            <span
              key={keyword}
              className="flex items-center gap-1 px-2 py-1 bg-stakeados-gray-700 text-stakeados-gray-300 rounded text-xs"
            >
              <Tag className="w-3 h-3" />
              {keyword}
            </span>
          ))}
          {article.tags && article.tags.length > 4 && (
            <span className="px-2 py-1 bg-stakeados-gray-700 text-stakeados-gray-400 rounded text-xs">
              +{article.tags.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Article Metadata */}
      <div className="flex items-center justify-between text-sm text-stakeados-gray-400 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{readingTime} min read</span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {article.published_at
                ? formatRelativeTime(article.published_at)
                : 'Unknown date'}
            </span>
          </div>
        </div>
      </div>

      {/* Source */}
      {showSource && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stakeados-gray-700">
          <Globe className="w-5 h-5 text-stakeados-blue" />
          <div>
            <div className="text-sm font-medium text-white">
              {article.source_name || 'Unknown Source'}
            </div>
            <div className="text-xs text-stakeados-gray-400">News Source</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Read Article */}
        <Link
          href={
            locale === 'es' ? `/noticias/${article.id}` : `/news/${article.id}`
          }
          className="btn-primary flex-1 text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            {t('news.readMore')}
          </div>
        </Link>

        {/* External Link */}
        <a
          href={article.url || article.source_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-stakeados-blue hover:text-stakeados-primary hover:bg-stakeados-blue/10 rounded-gaming transition-colors"
          title="View original article"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Publication Info */}
      <div className="mt-4 pt-4 border-t border-stakeados-gray-700">
        <div className="flex items-center justify-between text-xs text-stakeados-gray-500">
          <span>
            {article.published_at
              ? t('news.publishedAt', {
                  date: formatDate(article.published_at),
                })
              : 'Unknown date'}
          </span>
          {article.ai_processed && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {t('news.aiProcessed')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
