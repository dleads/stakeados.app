'use client';

import React, { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import CourseGrid from '@/components/courses/CourseGrid';
import SectionSkeleton from './SectionSkeleton';
import SectionErrorFallback from './SectionErrorFallback';
import EmptyStateHandler from './EmptyStateHandler';
import type { Locale } from '@/types/content';

interface CoursesPreviewSectionProps {
  locale: Locale;
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
}

export default function CoursesPreviewSection({
  locale,
  maxItems = 3,
  showViewAll = true,
  className = '',
}: CoursesPreviewSectionProps) {
  const t = useTranslations();

  return (
    <section
      className={`courses-preview-section ${className}`}
      aria-label="Featured Courses Section"
    >
      {/* Section Header */}
      <div className="section-header flex items-center justify-between mb-8">
        <div className="section-title-group flex items-center gap-3">
          <div className="section-icon">
            <GraduationCap className="w-8 h-8 text-stakeados-primary" />
          </div>
          <div>
            <h2 className="section-title text-3xl font-bold text-white">
              {t('homepage.sections.coursesPreview.title')}
            </h2>
            <p className="section-subtitle text-stakeados-gray-300 mt-1">
              {t('homepage.sections.coursesPreview.subtitle')}
            </p>
          </div>
        </div>

        {/* View All Link */}
        {showViewAll && (
          <Link
            href={locale === 'es' ? '/cursos' : '/courses'}
            className="view-all-link group flex items-center gap-2 px-4 py-2 bg-stakeados-gray-800 hover:bg-stakeados-primary/10 text-stakeados-gray-300 hover:text-stakeados-primary rounded-gaming transition-all duration-300 border border-stakeados-gray-700 hover:border-stakeados-primary/30"
          >
            <span className="font-medium">{t('courses.browseAll')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Courses Grid with Error Boundary and Suspense */}
      <div className="courses-grid-wrapper">
        <ErrorBoundary
          FallbackComponent={props => (
            <SectionErrorFallback {...props} sectionName="Featured Courses" />
          )}
          onError={(error, errorInfo) => {
            console.error('Featured Courses Section Error:', error, errorInfo);
          }}
        >
          <Suspense fallback={<SectionSkeleton type="courses" />}>
            <CourseGrid
              locale={locale}
              maxCourses={maxItems}
              showFilters={false}
              showSearch={false}
              className="homepage-courses-grid"
              emptyStateComponent={
                <EmptyStateHandler
                  type="courses"
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
