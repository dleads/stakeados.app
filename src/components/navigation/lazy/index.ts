/**
 * Lazy-loaded navigation components for performance optimization
 * These components are loaded on-demand to reduce initial bundle size
 */

import { lazy } from 'react';

// Lazy load non-critical navigation components
export const LazySearchInterface = lazy(() => import('../SearchInterface'));
export const LazyComingSoonModal = lazy(() => import('../ComingSoonModal'));
export const LazyUserMenu = lazy(() => import('../UserMenu'));
export const LazyMobileMenu = lazy(() => import('../MobileMenu'));

// Lazy load analytics components
export const LazyNavigationAnalytics = lazy(() => 
  import('../analytics/NavigationAnalytics')
);

// Preload functions for better UX
export const preloadSearchInterface = () => import('../SearchInterface');
export const preloadUserMenu = () => import('../UserMenu');
export const preloadMobileMenu = () => import('../MobileMenu');
export const preloadComingSoonModal = () => import('../ComingSoonModal');

// Preload on user interaction
export const preloadOnHover = {
  search: preloadSearchInterface,
  userMenu: preloadUserMenu,
  mobileMenu: preloadMobileMenu,
  comingSoon: preloadComingSoonModal,
};