'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useNewsManagement } from '@/hooks/useNewsManagement';
import NewsCard from './NewsCard';
import { Loader2, Newspaper } from 'lucide-react';
import type { Locale } from '@/types';

interface InfiniteNewsScrollProps {
  locale?: Locale;
  filters?: any;
  className?: string;
}

export default function InfiniteNewsScroll({
  locale = 'en',
  filters,
  className = '',
}: InfiniteNewsScrollProps) {
  const { newsQueue, loading, queueLoading, error, pagination } =
    useNewsManagement();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && pagination.hasMore && !queueLoading) {
        // loadMoreArticles is not available in the simplified hook
        console.log('Load more articles would be triggered here');
      }
    },
    [pagination.hasMore, queueLoading, filters]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  if (loading && newsQueue.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stakeados-gray-300">Loading news articles...</p>
      </div>
    );
  }

  if (error && newsQueue.length === 0) {
    return (
      <div className={`card-gaming text-center py-12 ${className}`}>
        <div className="notification-error">
          <p>Error loading news: {error}</p>
        </div>
      </div>
    );
  }

  if (newsQueue.length === 0) {
    return (
      <div className={`card-gaming text-center py-12 ${className}`}>
        <Newspaper className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
          No News Articles Found
        </h3>
        <p className="text-stakeados-gray-400">
          Try adjusting your filters or check back later for new content
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsQueue.map((article, index: number) => (
          <NewsCard
            key={`${article.id}-${index}`}
            article={article as any}
            locale={locale}
            showSource={true}
            showRelevanceScore={true}
            showCategories={true}
          />
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {queueLoading && (
          <div className="flex items-center gap-2 text-stakeados-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more articles...</span>
          </div>
        )}

        {!pagination.hasMore && newsQueue.length > 0 && (
          <div className="text-center text-stakeados-gray-400">
            <p>You've reached the end of the news feed</p>
            <p className="text-sm mt-1">{pagination.total} articles loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
