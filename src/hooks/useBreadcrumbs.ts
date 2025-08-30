'use client';

import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/navigation/NavigationProvider';
import { getBreadcrumbsForRoute } from '@/lib/navigation/breadcrumbs';
import type { BreadcrumbItem } from '@/types/navigation';

export interface UseBreadcrumbsOptions {
  /**
   * Additional dynamic parameters for breadcrumb generation
   */
  dynamicParams?: Record<string, string>;
  
  /**
   * Whether to include home breadcrumb
   */
  includeHome?: boolean;
  
  /**
   * Custom breadcrumb items to override generated ones
   */
  customBreadcrumbs?: BreadcrumbItem[];
}

export interface UseBreadcrumbsReturn {
  /**
   * Generated breadcrumb items
   */
  breadcrumbs: BreadcrumbItem[];
  
  /**
   * Whether breadcrumbs should be shown (not on home page)
   */
  shouldShowBreadcrumbs: boolean;
  
  /**
   * Whether the current route is accessible to the user
   */
  canAccessCurrentRoute: boolean;
}

/**
 * Hook to generate and manage breadcrumbs for the current route
 */
export function useBreadcrumbs(options: UseBreadcrumbsOptions = {}): UseBreadcrumbsReturn {
  const {
    dynamicParams,
    includeHome = true,
    customBreadcrumbs
  } = options;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, userRole } = useNavigation();

  const breadcrumbs = useMemo(() => {
    // Use custom breadcrumbs if provided
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    // Generate breadcrumbs based on current route
    const generatedBreadcrumbs = getBreadcrumbsForRoute(
      pathname,
      isAuthenticated,
      userRole,
      dynamicParams
    );

    return generatedBreadcrumbs;
  }, [pathname, isAuthenticated, userRole, dynamicParams, customBreadcrumbs]);

  const shouldShowBreadcrumbs = useMemo(() => {
    // Don't show breadcrumbs on home page
    if (pathname === '/') {
      return false;
    }

    // Don't show if no breadcrumbs generated
    if (breadcrumbs.length === 0) {
      return false;
    }

    return true;
  }, [pathname, breadcrumbs]);

  const canAccessCurrentRoute = useMemo(() => {
    // This could be expanded to check route access permissions
    return breadcrumbs.length > 0 || pathname === '/';
  }, [breadcrumbs, pathname]);

  return {
    breadcrumbs,
    shouldShowBreadcrumbs,
    canAccessCurrentRoute
  };
}

/**
 * Hook to get breadcrumbs for a specific path (not necessarily current)
 */
export function useBreadcrumbsForPath(
  path: string,
  options: Omit<UseBreadcrumbsOptions, 'customBreadcrumbs'> = {}
): BreadcrumbItem[] {
  const { dynamicParams } = options;
  const { isAuthenticated, userRole } = useNavigation();

  return useMemo(() => {
    return getBreadcrumbsForRoute(
      path,
      isAuthenticated,
      userRole,
      dynamicParams
    );
  }, [path, isAuthenticated, userRole, dynamicParams]);
}

/**
 * Hook to create custom breadcrumbs programmatically
 */
export function useCustomBreadcrumbs(
  breadcrumbsFactory: () => BreadcrumbItem[]
): UseBreadcrumbsReturn {
  const pathname = usePathname();
  
  const customBreadcrumbs = useMemo(() => {
    return breadcrumbsFactory();
  }, [breadcrumbsFactory]);

  const shouldShowBreadcrumbs = useMemo(() => {
    return pathname !== '/' && customBreadcrumbs.length > 0;
  }, [pathname, customBreadcrumbs]);

  return {
    breadcrumbs: customBreadcrumbs,
    shouldShowBreadcrumbs,
    canAccessCurrentRoute: true
  };
}