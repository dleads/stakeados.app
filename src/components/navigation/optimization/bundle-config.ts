/**
 * Bundle optimization configuration for navigation components
 * This file defines how navigation components should be split and loaded
 */

// Critical navigation components that should be in the main bundle
export const CRITICAL_COMPONENTS = [
  'NavLogo',
  'NavLinks', 
  'HamburgerButton',
  'MainNavigation',
  'NavigationProvider',
] as const;

// Non-critical components that can be lazy loaded
export const LAZY_COMPONENTS = [
  'UserMenu',
  'MobileMenu',
  'SearchInterface',
  'ComingSoonModal',
  'NavigationConfigPanel',
  'Breadcrumbs',
] as const;

// Admin-only components that should be in a separate chunk
export const ADMIN_COMPONENTS = [
  'AdminNavigation',
  'NavigationAnalytics',
  'NavigationConfigPanel',
] as const;

// Component loading priorities
export const LOADING_PRIORITIES = {
  immediate: ['NavLogo', 'NavLinks', 'HamburgerButton'],
  high: ['UserMenu', 'MobileMenu'],
  medium: ['SearchInterface', 'Breadcrumbs'],
  low: ['ComingSoonModal', 'NavigationConfigPanel'],
  admin: ['AdminNavigation', 'NavigationAnalytics'],
} as const;

// Preloading strategies
export const PRELOAD_STRATEGIES = {
  onHover: ['UserMenu', 'MobileMenu', 'SearchInterface'],
  onFocus: ['UserMenu', 'SearchInterface'],
  onIdle: ['ComingSoonModal'],
  onAuthentication: ['UserMenu'],
  onAdminRole: ['AdminNavigation', 'NavigationAnalytics'],
} as const;

// Bundle size targets (in KB)
export const BUNDLE_SIZE_TARGETS = {
  critical: 15, // Main navigation bundle
  userMenu: 8,
  mobileMenu: 10,
  search: 12,
  admin: 20,
  analytics: 5,
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  navigationRender: 100, // ms
  componentLoad: 200, // ms
  totalNavigation: 500, // ms
  bundleSize: 50, // KB for total navigation
} as const;

// Webpack chunk names for better debugging
export const CHUNK_NAMES = {
  userMenu: 'navigation-user-menu',
  mobileMenu: 'navigation-mobile-menu',
  search: 'navigation-search',
  admin: 'navigation-admin',
  analytics: 'navigation-analytics',
  comingSoon: 'navigation-coming-soon',
} as const;

// Dynamic import configurations
export const DYNAMIC_IMPORTS = {
  UserMenu: () => import('../UserMenu' /* webpackChunkName: "navigation-user-menu" */),
  MobileMenu: () => import('../MobileMenu' /* webpackChunkName: "navigation-mobile-menu" */),
  SearchInterface: () => import('../SearchInterface' /* webpackChunkName: "navigation-search" */),
  ComingSoonModal: () => import('../ComingSoonModal' /* webpackChunkName: "navigation-coming-soon" */),
  NavigationConfigPanel: () => import('../NavigationConfigPanel' /* webpackChunkName: "navigation-admin" */),
  NavigationAnalytics: () => import('../analytics/NavigationAnalytics' /* webpackChunkName: "navigation-analytics" */),
} as const;

// Resource hints for better loading
export const RESOURCE_HINTS = {
  preload: [
    // Critical CSS and fonts
    '/fonts/inter-var.woff2',
  ],
  prefetch: [
    // Non-critical navigation assets
    '/icons/navigation-sprite.svg',
  ],
  preconnect: [
    // Analytics domains
    'https://www.google-analytics.com',
  ],
} as const;