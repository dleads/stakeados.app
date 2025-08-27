'use client';

import React from 'react';

interface SectionSkeletonProps {
  type: 'news' | 'articles' | 'navigation' | 'courses' | 'hero';
  className?: string;
}

export default function SectionSkeleton({
  type,
  className = '',
}: SectionSkeletonProps) {
  const baseClasses = `section-skeleton ${className}`;

  switch (type) {
    case 'hero':
      return <HeroSkeleton className={baseClasses} />;
    case 'news':
      return <NewsSkeleton className={baseClasses} />;
    case 'articles':
      return <ArticlesSkeleton className={baseClasses} />;
    case 'navigation':
      return <NavigationSkeleton className={baseClasses} />;
    case 'courses':
      return <CoursesSkeleton className={baseClasses} />;
    default:
      return <DefaultSkeleton className={baseClasses} />;
  }
}

function HeroSkeleton({ className }: { className: string }) {
  return (
    <div className={`hero-skeleton ${className}`}>
      <div className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        <div className="text-center space-y-6 px-4 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="h-16 bg-gray-700 rounded-lg animate-pulse mx-auto max-w-2xl"></div>
            <div className="h-8 bg-gray-700 rounded-lg animate-pulse mx-auto max-w-xl"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="h-12 w-40 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-12 w-40 bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsSkeleton({ className }: { className: string }) {
  return (
    <div className={`news-skeleton ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-48 bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-6 w-24 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="relative bg-gray-800 rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
              <div className="p-6 space-y-4">
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArticlesSkeleton({ className }: { className: string }) {
  return (
    <div className={`articles-skeleton ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-56 bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-6 w-28 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="relative bg-gray-800 rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
              <div className="h-48 bg-gray-700 animate-pulse"></div>
              <div className="p-6 space-y-4">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-2/3"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavigationSkeleton({ className }: { className: string }) {
  return (
    <div className={`navigation-skeleton ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="h-8 w-64 bg-gray-700 rounded-lg animate-pulse mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="relative bg-gray-800 rounded-lg p-6 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse mx-auto"></div>
                <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4 mx-auto"></div>
                </div>
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoursesSkeleton({ className }: { className: string }) {
  return (
    <div className={`courses-skeleton ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-52 bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="relative bg-gray-800 rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
              <div className="h-48 bg-gray-700 animate-pulse"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-4/5"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 w-28 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DefaultSkeleton({ className }: { className: string }) {
  return (
    <div className={`default-skeleton ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="relative bg-gray-800 rounded-lg p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
