'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { Skeleton } from './SkeletonLoader';

// Loading components for lazy loading
const LoadingCard = () => <Skeleton className="h-64" />;

const LoadingDashboard = () => (
  <div className="space-y-6">
    <Skeleton className="h-32" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  </div>
);

// Lazy loaded components with loading states
export const LazyNewsGrid = dynamic(
  () => import('@/components/news/NewsGrid'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }
);

export const LazyArticleGrid = dynamic(
  () => import('@/components/articles/ArticleGrid'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }
);

export const LazyCourseGrid = dynamic(
  () => import('@/components/courses/CourseGrid'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }
);

export const LazyNFTGallery = dynamic(
  () => import('@/components/nft/NFTGallery'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }
);

export const LazyProgressDashboard = dynamic(
  () => import('@/components/progress/ProgressDashboard'),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

export const LazyAchievementSystem = dynamic(
  () => import('@/components/gamification/AchievementSystem'),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

export const LazyLeaderboard = dynamic(
  () => import('@/components/gamification/Leaderboard'),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

export const LazyEmailPreferences = dynamic(
  () => import('@/components/email/EmailPreferences'),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

export const LazyAnalyticsDashboard = dynamic(
  () => import('@/components/analytics/AnalyticsDashboard'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }
);

export const LazyNewsProcessingDashboard = dynamic(
  () => import('@/components/ai/NewsProcessingDashboard'),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

export const LazyGenesisClaimInterface = dynamic(
  () => import('@/components/genesis/GenesisClaimInterface'),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

export const LazyGenesisHallOfFame = dynamic(
  () => import('@/components/genesis/GenesisHallOfFame'),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

export const LazyCitizenshipEligibilityChecker = dynamic(
  () => import('@/components/citizenship/CitizenshipEligibilityChecker'),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  }
);

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  LoadingComponent: ComponentType = LoadingCard
) {
  return dynamic(() => Promise.resolve(Component), {
    loading: () => <LoadingComponent />,
    ssr: false,
  });
}

// Preload function for critical components
export function preloadComponent(componentImport: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Preload on user interaction or after initial load
    const preload = () => componentImport();

    // Preload on hover or focus
    document.addEventListener('mouseover', preload, { once: true });
    document.addEventListener('touchstart', preload, { once: true });

    // Preload after 2 seconds if no interaction
    setTimeout(preload, 2000);
  }
}
