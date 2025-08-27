'use client';

import React, { useEffect } from 'react';

import { useNewsManagement } from '@/hooks/useNewsManagement';
import { getNewsTitle } from '@/lib/supabase/news';
import { formatRelativeTime, truncateText } from '@/lib/utils';
import { TrendingUp, Star, Clock, ExternalLink } from 'lucide-react';
import { Link } from '@/lib/utils/navigation';
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
  description?: string | null;
  url?: string | null;
  image_url?: string | null;
  importance_score?: number | null;
  ai_processed?: boolean | null;
  ai_sentiment?: string | null;
  cluster_id?: string | null;
  fetched_at?: string | null;
  tags?: string[] | null;
};

interface TrendingNewsWidgetProps {
  locale?: Locale;
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export default function TrendingNewsWidget({
  locale = 'en',
  maxItems = 5,
  showHeader = true,
  className = '',
}: TrendingNewsWidgetProps) {
  const {
    trendingArticles,
    loadTrendingNews,
    isLoading,
  }: {
    trendingArticles: NewsArticle[];
    loadTrendingNews: () => void;
    isLoading: boolean;
  } = useNewsManagement();

  useEffect(() => {
    loadTrendingNews();
  }, [loadTrendingNews]);

  const getRelevanceColor = (score: number) => {
    if (score >= 8) return 'text-stakeados-primary';
    if (score >= 6) return 'text-stakeados-blue';
    if (score >= 4) return 'text-stakeados-yellow';
    return 'text-stakeados-orange';
  };

  if (isLoading) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-stakeados-gray-600 rounded mb-2" />
              <div className="h-3 bg-stakeados-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-stakeados-orange" />
          <h3 className="text-xl font-bold text-neon">Trending News</h3>
        </div>
      )}

      {trendingArticles.length > 0 ? (
        <div className="space-y-4">
          {trendingArticles.slice(0, maxItems).map((article, index) => (
            <div key={article.id} className="group">
              <Link
                href={`/news/${article.id}`}
                className="block p-3 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-6 h-6 bg-stakeados-orange/20 text-stakeados-orange rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white group-hover:text-stakeados-primary transition-colors mb-1 line-clamp-2">
                      {truncateText(getNewsTitle(article, locale), 80)}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-stakeados-gray-400">
                      <span>{article.source_name || 'Unknown Source'}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {article.published_at
                            ? formatRelativeTime(article.published_at)
                            : 'Unknown time'}
                        </span>
                      </div>
                      {article.importance_score && (
                        <div
                          className={`flex items-center gap-1 ${getRelevanceColor(article.importance_score)}`}
                        >
                          <Star className="w-3 h-3" />
                          <span>{article.importance_score.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* External Link */}
                  <a
                    href={article.url || article.source_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex-shrink-0 p-1 text-stakeados-gray-400 hover:text-stakeados-blue transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <p className="text-stakeados-gray-400">No trending news available</p>
        </div>
      )}

      {trendingArticles.length > maxItems && (
        <div className="mt-6 pt-4 border-t border-stakeados-gray-700">
          <Link href="/news" className="btn-ghost w-full">
            View All Trending News
          </Link>
        </div>
      )}
    </div>
  );
}
