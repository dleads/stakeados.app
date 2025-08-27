'use client';

import React, { Suspense, useEffect, useState, lazy } from 'react';
import type { Locale } from '@/types/content';

// Import critical above-fold components
import HeroSection from './HeroSection';
import FeaturedNewsSection from './FeaturedNewsSection';

// Lazy load below-fold components
const FeaturedArticlesSection = lazy(() => import('./FeaturedArticlesSection'));
const QuickNavigationSection = lazy(() => import('./QuickNavigationSection'));
const CoursesPreviewSection = lazy(() => import('./CoursesPreviewSection'));

// SEO components
import HomepageStructuredData from './HomepageStructuredData';

// Loading and utility components
import SectionSkeleton from './SectionSkeleton';
import EnhancedErrorBoundary from './EnhancedErrorBoundary';
import EnhancedSectionErrorFallback from './EnhancedSectionErrorFallback';
import LazySection from '../ui/LazySection';
// import { usePerformanceMonitoring, useRenderTiming } from '@/hooks/usePerformanceMonitoring';

export interface HomepageProps {
  locale: Locale;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export interface HomepageData {
  news: any[];
  articles: any[];
  courses: any[];
  stats: {
    totalArticles: number;
    totalNews: number;
    totalCourses: number;
    activeUsers: number;
  };
}

export default function HomePage({ locale }: HomepageProps) {
  const [stats, setStats] = useState<HomepageData['stats'] | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    articles: false,
    navigation: false,
    courses: false,
  });

  // Performance monitoring - temporarily disabled
  // const { startSectionTiming, endSectionTiming, reportMetrics } = usePerformanceMonitoring();
  // useRenderTiming('HomePage');

  // Fetch homepage statistics with caching
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/homepage', {
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=600',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch homepage stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Handle lazy section loading
  const handleSectionLoad = (section: keyof typeof loadingStates) => {
    setLoadingStates(prev => ({ ...prev, [section]: true }));
  };

  return (
    <div className="homepage-container min-h-screen bg-gradient-to-br from-stakeados-dark via-stakeados-gray-900 to-stakeados-dark">
      {/* SEO Structured Data */}
      <HomepageStructuredData locale={locale} stats={stats || undefined} />

      {/* Main content wrapper with responsive layout */}
      <main className="homepage-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-8 sm:space-y-12 lg:space-y-16">
        {/* Hero Section - Always visible, no error boundary needed */}
        <section className="homepage-section hero-section">
          <HeroSection locale={locale} />
        </section>

        {/* Featured News Section */}
        <section className="homepage-section news-section">
          <EnhancedErrorBoundary
            fallback={EnhancedSectionErrorFallback}
            sectionName="Featured News"
            locale={locale}
            maxRetries={3}
            onError={(error, errorInfo) => {
              console.error('Featured News Section Error:', error, errorInfo);
              // Report to monitoring service if available
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'exception', {
                  description: `Featured News: ${error.message}`,
                  fatal: false,
                });
              }
            }}
          >
            <Suspense fallback={<SectionSkeleton type="news" />}>
              <FeaturedNewsSection
                locale={locale}
                maxItems={6}
                showViewAll={true}
                className="w-full"
              />
            </Suspense>
          </EnhancedErrorBoundary>
        </section>

        {/* Featured Articles Section - Lazy Loaded */}
        <LazySection
          className="homepage-section articles-section"
          fallback={<SectionSkeleton type="articles" />}
          onLoad={() => handleSectionLoad('articles')}
          rootMargin="200px"
        >
          <EnhancedErrorBoundary
            fallback={EnhancedSectionErrorFallback}
            sectionName="Featured Articles"
            locale={locale}
            maxRetries={3}
            onError={(error, errorInfo) => {
              console.error(
                'Featured Articles Section Error:',
                error,
                errorInfo
              );
              // Report to monitoring service if available
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'exception', {
                  description: `Featured Articles: ${error.message}`,
                  fatal: false,
                });
              }
            }}
          >
            <Suspense fallback={<SectionSkeleton type="articles" />}>
              <FeaturedArticlesSection
                locale={locale}
                maxItems={4}
                showViewAll={true}
              />
            </Suspense>
          </EnhancedErrorBoundary>
        </LazySection>

        {/* Quick Navigation Section - Lazy Loaded */}
        <LazySection
          className="homepage-section navigation-section"
          fallback={<SectionSkeleton type="navigation" />}
          onLoad={() => handleSectionLoad('navigation')}
          rootMargin="150px"
        >
          <EnhancedErrorBoundary
            fallback={EnhancedSectionErrorFallback}
            sectionName="Quick Navigation"
            locale={locale}
            maxRetries={2}
            onError={(error, errorInfo) => {
              console.error(
                'Quick Navigation Section Error:',
                error,
                errorInfo
              );
              // Report to monitoring service if available
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'exception', {
                  description: `Quick Navigation: ${error.message}`,
                  fatal: false,
                });
              }
            }}
          >
            <Suspense fallback={<SectionSkeleton type="navigation" />}>
              <QuickNavigationSection locale={locale} />
            </Suspense>
          </EnhancedErrorBoundary>
        </LazySection>

        {/* Courses Preview Section - Lazy Loaded */}
        <LazySection
          className="homepage-section courses-section"
          fallback={<SectionSkeleton type="courses" />}
          onLoad={() => handleSectionLoad('courses')}
          rootMargin="100px"
        >
          <EnhancedErrorBoundary
            fallback={EnhancedSectionErrorFallback}
            sectionName="Featured Courses"
            locale={locale}
            maxRetries={3}
            onError={(error, errorInfo) => {
              console.error('Courses Preview Section Error:', error, errorInfo);
              // Report to monitoring service if available
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'exception', {
                  description: `Featured Courses: ${error.message}`,
                  fatal: false,
                });
              }
            }}
          >
            <Suspense fallback={<SectionSkeleton type="courses" />}>
              <CoursesPreviewSection
                locale={locale}
                maxItems={3}
                showViewAll={true}
              />
            </Suspense>
          </EnhancedErrorBoundary>
        </LazySection>
      </main>
    </div>
  );
}
