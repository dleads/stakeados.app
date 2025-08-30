'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/navigation/NavigationProvider';

/**
 * Enhanced navigation hook that provides better Next.js routing integration
 * This hook combines Next.js router functionality with our navigation system
 */
export function useNextNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigation = useNavigation();
  
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const [routeChangeError, setRouteChangeError] = useState<string | null>(null);

  // Enhanced navigation with loading states and error handling
  const navigateWithState = useCallback(async (
    href: string, 
    options?: { 
      replace?: boolean; 
      scroll?: boolean; 
      shallow?: boolean;
      onStart?: () => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    try {
      setIsRouteChanging(true);
      setRouteChangeError(null);
      options?.onStart?.();

      // Use our navigation system for the actual navigation
      navigation.navigate(href, {
        replace: options?.replace,
        scroll: options?.scroll
      });

      // Simulate completion (since App Router doesn't have route events)
      setTimeout(() => {
        setIsRouteChanging(false);
        options?.onComplete?.();
      }, 100);

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Navigation failed');
      setRouteChangeError(err.message);
      setIsRouteChanging(false);
      options?.onError?.(err);
      console.error('Navigation error:', err);
    }
  }, [navigation]);

  // Prefetch routes for better performance
  const prefetch = useCallback((href: string) => {
    try {
      router.prefetch(href);
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [router]);

  // Get current route information
  const getCurrentRoute = useCallback(() => {
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] || 'es';
    const route = segments.slice(1).join('/') || '';
    
    return {
      pathname,
      route: `/${route}`,
      locale,
      segments,
      searchParams: Object.fromEntries(searchParams.entries()),
      fullUrl: `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    };
  }, [pathname, searchParams]);

  // Check if a route is active (enhanced version)
  const isRouteActive = useCallback((targetHref: string, exact = false) => {
    const currentRoute = getCurrentRoute();
    const normalizedTarget = targetHref.split('?')[0].split('#')[0];
    const normalizedCurrent = currentRoute.pathname.split('?')[0].split('#')[0];

    if (exact) {
      return normalizedCurrent === normalizedTarget;
    }

    // For non-exact matching, check if current path starts with target
    if (normalizedTarget === '/') {
      return normalizedCurrent === '/';
    }

    return normalizedCurrent.startsWith(normalizedTarget);
  }, [getCurrentRoute]);

  // Handle browser navigation events
  useEffect(() => {
    const handlePopState = () => {
      setIsRouteChanging(false);
      setRouteChangeError(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Build URL with locale
  const buildUrl = useCallback((path: string, locale?: string) => {
    const currentRoute = getCurrentRoute();
    const targetLocale = locale || currentRoute.locale;
    
    // Handle absolute URLs
    if (path.startsWith('http')) {
      return path;
    }

    // Handle paths that already include locale
    if (path.startsWith(`/${targetLocale}/`)) {
      return path;
    }

    // Handle root path
    if (path === '/') {
      return `/${targetLocale}`;
    }

    // Build path with locale
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${targetLocale}${cleanPath}`;
  }, [getCurrentRoute]);

  // Navigate with locale handling
  const navigateToRoute = useCallback((
    path: string, 
    options?: { 
      locale?: string;
      replace?: boolean; 
      scroll?: boolean;
      preserveQuery?: boolean;
    }
  ) => {
    const currentRoute = getCurrentRoute();
    let targetUrl = buildUrl(path, options?.locale);

    // Preserve query parameters if requested
    if (options?.preserveQuery && Object.keys(currentRoute.searchParams).length > 0) {
      const queryString = new URLSearchParams(currentRoute.searchParams).toString();
      targetUrl += `?${queryString}`;
    }

    navigateWithState(targetUrl, {
      replace: options?.replace,
      scroll: options?.scroll
    });
  }, [buildUrl, getCurrentRoute, navigateWithState]);

  // Refresh current route
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Replace current route
  const replace = useCallback((href: string) => {
    navigateWithState(href, { replace: true });
  }, [navigateWithState]);

  // Push new route
  const push = useCallback((href: string) => {
    navigateWithState(href, { replace: false });
  }, [navigateWithState]);

  return {
    // Next.js router methods
    router,
    pathname,
    searchParams,
    
    // Enhanced navigation methods
    navigate: navigateWithState,
    navigateToRoute,
    prefetch,
    refresh,
    replace,
    push,
    
    // Navigation state
    isRouteChanging,
    routeChangeError,
    
    // Route utilities
    getCurrentRoute,
    isRouteActive,
    buildUrl,
    
    // Browser navigation
    goBack: navigation.goBack,
    goForward: navigation.goForward,
    canGoBack: navigation.canGoBack,
    canGoForward: navigation.canGoForward,
    
    // Navigation history
    navigationHistory: navigation.navigationHistory,
  };
}

/**
 * Hook for handling route parameters in dynamic routes
 */
export function useRouteParams() {
  const { getCurrentRoute } = useNextNavigation();
  
  const getParams = useCallback(() => {
    const route = getCurrentRoute();
    const segments = route.segments.slice(1); // Remove locale
    
    // This is a simplified version - in a real app you might want to
    // match against your route definitions to extract named parameters
    return {
      segments,
      searchParams: route.searchParams,
    };
  }, [getCurrentRoute]);

  return {
    getParams,
    ...useNextNavigation()
  };
}

/**
 * Hook for handling query parameters
 */
export function useQueryParams() {
  const searchParams = useSearchParams();
  const { navigateToRoute, getCurrentRoute } = useNextNavigation();

  const setQueryParam = useCallback((key: string, value: string) => {
    const current = getCurrentRoute();
    const newParams = new URLSearchParams(current.searchParams);
    newParams.set(key, value);
    
    navigateToRoute(current.route, {
      preserveQuery: false,
      replace: true
    });
  }, [getCurrentRoute, navigateToRoute]);

  const removeQueryParam = useCallback((key: string) => {
    const current = getCurrentRoute();
    const newParams = new URLSearchParams(current.searchParams);
    newParams.delete(key);
    
    const queryString = newParams.toString();
    const targetUrl = current.route + (queryString ? `?${queryString}` : '');
    
    navigateToRoute(targetUrl, { replace: true });
  }, [getCurrentRoute, navigateToRoute]);

  const getQueryParam = useCallback((key: string) => {
    return searchParams.get(key);
  }, [searchParams]);

  return {
    searchParams,
    getQueryParam,
    setQueryParam,
    removeQueryParam,
    ...useNextNavigation()
  };
}