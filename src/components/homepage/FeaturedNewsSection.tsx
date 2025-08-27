'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import { Newspaper, ArrowRight } from 'lucide-react';
import NewsGrid from '@/components/news/NewsGrid';
import EmptyStateHandler from './EmptyStateHandler';
import type { Locale } from '@/types/content';

interface FeaturedNewsSectionProps {
  locale: Locale;
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
}

export default function FeaturedNewsSection({
  locale,
  maxItems = 6,
  showViewAll = true,
  className = '',
}: FeaturedNewsSectionProps) {
  const t = useTranslations();

  return (
    <section
      className={`featured-news-section ${className}`}
      aria-label="Featured News Section"
    >
      {/* Section Header with mobile optimization */}
      <div className="section-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div className="section-title-group flex items-center gap-2 sm:gap-3">
          <div className="section-icon flex-shrink-0">
            <Newspaper className="w-6 h-6 sm:w-8 sm:h-8 text-stakeados-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="section-title text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
              {t('homepage.sections.featuredNews.title')}
            </h2>
            <p className="section-subtitle text-stakeados-gray-300 mt-1 text-sm sm:text-base line-clamp-1 sm:line-clamp-none">
              {t('homepage.sections.featuredNews.subtitle')}
            </p>
          </div>
        </div>

        {/* View All Link with mobile optimization */}
        {showViewAll && (
          <Link
            href={locale === 'es' ? '/noticias' : '/news'}
            className="view-all-link group flex items-center justify-center gap-2 px-4 py-2 bg-stakeados-gray-800 hover:bg-stakeados-primary/10 text-stakeados-gray-300 hover:text-stakeados-primary rounded-gaming transition-all duration-300 border border-stakeados-gray-700 hover:border-stakeados-primary/30 min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-primary focus-visible:ring-offset-2 focus-visible:ring-offset-stakeados-dark w-full sm:w-auto"
          >
            <span className="font-medium text-sm sm:text-base">
              {t('common.viewAll')}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </Link>
        )}
      </div>

      {/* News Grid - Optimized for Homepage */}
      <div className="news-grid-wrapper">
        <NewsGrid
          maxItems={maxItems}
          showFilters={false}
          showTrending={false}
          personalizedFeed={false}
          disableRealTime={true}
          className="homepage-news-grid"
          initialFilters={{}}
          emptyStateComponent={
            <EmptyStateHandler type="news" locale={locale} className="mt-4" />
          }
        />
      </div>
    </section>
  );
}
