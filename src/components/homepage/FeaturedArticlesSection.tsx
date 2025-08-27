'use client';

import React, { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import { BookOpen, ArrowRight } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import ArticleGrid from '@/components/articles/ArticleGrid';
import SectionSkeleton from './SectionSkeleton';
import SectionErrorFallback from './SectionErrorFallback';
import EmptyStateHandler from './EmptyStateHandler';
import type { Locale } from '@/types/content';

interface FeaturedArticlesSectionProps {
  locale: Locale;
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
}

export default function FeaturedArticlesSection({
  locale,
  maxItems = 4,
  showViewAll = true,
  className = '',
}: FeaturedArticlesSectionProps) {
  const t = useTranslations();

  return (
    <section
      className={`featured-articles-section ${className}`}
      aria-label="Featured Articles Section"
    >
      {/* Section Header */}
      <div className="section-header flex items-center justify-between mb-8">
        <div className="section-title-group flex items-center gap-3">
          <div className="section-icon">
            <BookOpen className="w-8 h-8 text-stakeados-primary" />
          </div>
          <div>
            <h2 className="section-title text-3xl font-bold text-white">
              {t('homepage.sections.featuredArticles.title')}
            </h2>
            <p className="section-subtitle text-stakeados-gray-300 mt-1">
              {t('homepage.sections.featuredArticles.subtitle')}
            </p>
          </div>
        </div>

        {/* View All Link */}
        {showViewAll && (
          <Link
            href={locale === 'es' ? '/articulos' : '/articles'}
            className="view-all-link group flex items-center gap-2 px-4 py-2 bg-stakeados-gray-800 hover:bg-stakeados-primary/10 text-stakeados-gray-300 hover:text-stakeados-primary rounded-gaming transition-all duration-300 border border-stakeados-gray-700 hover:border-stakeados-primary/30"
          >
            <span className="font-medium">{t('common.viewAll')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Articles Grid with Error Boundary and Suspense */}
      <div className="articles-grid-wrapper">
        <ErrorBoundary
          FallbackComponent={props => (
            <SectionErrorFallback {...props} sectionName="Featured Articles" />
          )}
          onError={(error, errorInfo) => {
            console.error('Featured Articles Section Error:', error, errorInfo);
          }}
        >
          <Suspense fallback={<SectionSkeleton type="articles" />}>
            <ArticleGrid
              locale={locale}
              maxArticles={maxItems}
              showFilters={false}
              showSearch={false}
              className="homepage-articles-grid"
              emptyStateComponent={
                <EmptyStateHandler
                  type="articles"
                  locale={locale}
                  className="mt-4"
                />
              }
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </section>
  );
}
