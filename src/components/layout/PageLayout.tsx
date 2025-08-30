'use client';

import React from 'react';
import { useNavigation } from '@/components/navigation/NavigationProvider';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import Footer from '@/components/navigation/Footer';
import { cn } from '@/lib/utils';

export interface PageLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  showFooter?: boolean;
  className?: string;
  containerClassName?: string;
  breadcrumbsClassName?: string;
}

export default function PageLayout({
  children,
  showBreadcrumbs = true,
  showFooter = true,
  className,
  containerClassName,
  breadcrumbsClassName,
}: PageLayoutProps) {
  const { getBreadcrumbs, currentPath } = useNavigation();

  // Don't show breadcrumbs on home page
  const isHomePage = currentPath === '/' || currentPath.match(/^\/[a-z]{2}$/);
  const shouldShowBreadcrumbs = showBreadcrumbs && !isHomePage;

  const breadcrumbs = shouldShowBreadcrumbs ? getBreadcrumbs() : [];

  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {/* Breadcrumbs */}
      {shouldShowBreadcrumbs && breadcrumbs.length > 0 && (
        <div className={cn('bg-gray-900/50 backdrop-blur-sm border-b border-gray-800', breadcrumbsClassName)}>
          <div className={cn('container mx-auto px-4 py-4', containerClassName)}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}