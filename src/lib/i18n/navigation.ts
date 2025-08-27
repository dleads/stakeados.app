import type { Locale } from '@/types/content';

/**
 * Route mappings for different locales
 */
export const routeMap: Record<string, Record<Locale, string>> = {
  '/': {
    en: '/',
    es: '/',
  },
  '/courses': {
    en: '/courses',
    es: '/cursos',
  },
  '/articles': {
    en: '/articles',
    es: '/articulos',
  },
  '/news': {
    en: '/news',
    es: '/noticias',
  },
  '/community': {
    en: '/community',
    es: '/comunidad',
  },
  '/profile': {
    en: '/profile',
    es: '/perfil',
  },
  '/search': {
    en: '/search',
    es: '/buscar',
  },
  '/categories': {
    en: '/categories',
    es: '/categorias',
  },
  '/tags': {
    en: '/tags',
    es: '/etiquetas',
  },
  '/admin': {
    en: '/admin',
    es: '/admin',
  },
};

/**
 * Get localized path for a route
 * @param route - The canonical route (e.g., '/courses')
 * @param locale - The target locale
 * @returns Localized path
 */
export function getLocalizedPath(route: string, locale: Locale): string {
  const mapping = routeMap[route];
  if (!mapping) {
    console.warn(`No route mapping found for: ${route}`);
    return route;
  }

  return mapping[locale] || route;
}

/**
 * Get full localized URL
 * @param route - The canonical route
 * @param locale - The target locale
 * @returns Full localized URL with locale prefix
 */
export function getLocalizedUrl(route: string, locale: Locale): string {
  const localizedPath = getLocalizedPath(route, locale);
  return `/${locale}${localizedPath}`;
}

/**
 * Get canonical route from localized path
 * @param localizedPath - The localized path
 * @param locale - The current locale
 * @returns Canonical route
 */
export function getCanonicalRoute(
  localizedPath: string,
  locale: Locale
): string {
  // Remove leading slash for comparison
  const path = localizedPath.startsWith('/')
    ? localizedPath.slice(1)
    : localizedPath;

  // Find the canonical route that maps to this localized path
  for (const [canonical, mapping] of Object.entries(routeMap)) {
    const localizedRoute = mapping[locale]?.startsWith('/')
      ? mapping[locale].slice(1)
      : mapping[locale];

    if (localizedRoute === path) {
      return canonical;
    }
  }

  // If no mapping found, return the original path
  return `/${path}`;
}

/**
 * Generate language switcher URLs
 * @param currentPath - Current localized path
 * @param currentLocale - Current locale
 * @returns Array of language options with URLs
 */
export function getLanguageSwitcherUrls(
  currentPath: string,
  currentLocale: Locale
): Array<{
  locale: Locale;
  label: string;
  url: string;
  isActive: boolean;
}> {
  // Get canonical route from current path
  const pathWithoutLocale = currentPath.replace(`/${currentLocale}`, '') || '/';
  const canonicalRoute = getCanonicalRoute(pathWithoutLocale, currentLocale);

  return [
    {
      locale: 'es',
      label: 'Español',
      url: getLocalizedUrl(canonicalRoute, 'es'),
      isActive: currentLocale === 'es',
    },
    {
      locale: 'en',
      label: 'English',
      url: getLocalizedUrl(canonicalRoute, 'en'),
      isActive: currentLocale === 'en',
    },
  ];
}

/**
 * Navigation items with localized paths
 */
export function getNavigationItems(locale: Locale) {
  return [
    {
      key: 'home',
      href: getLocalizedUrl('/', locale),
      translationKey: 'nav.home' as const,
    },
    {
      key: 'courses',
      href: getLocalizedUrl('/courses', locale),
      translationKey: 'nav.courses' as const,
    },
    {
      key: 'articles',
      href: getLocalizedUrl('/articles', locale),
      translationKey: 'nav.articles' as const,
    },
    {
      key: 'news',
      href: getLocalizedUrl('/news', locale),
      translationKey: 'nav.news' as const,
    },
    {
      key: 'community',
      href: getLocalizedUrl('/community', locale),
      translationKey: 'nav.community' as const,
    },
  ];
}

/**
 * Check if a path matches a route pattern
 * @param path - Current path
 * @param pattern - Route pattern to match
 * @returns Whether the path matches the pattern
 */
export function matchesRoute(path: string, pattern: string): boolean {
  // Simple pattern matching - can be extended for dynamic routes
  if (pattern === path) return true;

  // Handle dynamic segments [slug], [id], etc.
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return true; // Dynamic segment matches anything
    }
    return part === pathParts[index];
  });
}

/**
 * Get breadcrumb items for current path
 * @param path - Current path
 * @param locale - Current locale
 * @returns Breadcrumb items
 */
export function getBreadcrumbs(path: string, locale: Locale) {
  const pathParts = path.split('/').filter(Boolean);
  const breadcrumbs = [];

  // Always start with home
  breadcrumbs.push({
    label: 'nav.home' as const,
    href: getLocalizedUrl('/', locale),
    isActive: pathParts.length <= 1, // Only locale in path
  });

  // Build breadcrumbs from path parts
  let currentPath = '';
  for (let i = 1; i < pathParts.length; i++) {
    // Skip locale part
    const part = pathParts[i];
    currentPath += `/${part}`;

    const canonicalRoute = getCanonicalRoute(currentPath, locale);
    const isLast = i === pathParts.length - 1;

    breadcrumbs.push({
      label: getBreadcrumbLabel(canonicalRoute),
      href: getLocalizedUrl(canonicalRoute, locale),
      isActive: isLast,
    });
  }

  return breadcrumbs;
}

/**
 * Get breadcrumb label for a route
 * @param route - Canonical route
 * @returns Translation key for the route
 */
function getBreadcrumbLabel(
  route: string
): keyof typeof import('./translations').translations.en {
  const labelMap: Record<
    string,
    keyof typeof import('./translations').translations.en
  > = {
    '/courses': 'nav.courses',
    '/articles': 'nav.articles',
    '/news': 'nav.news',
    '/community': 'nav.community',
    '/profile': 'nav.profile',
    '/admin': 'nav.admin',
  };

  return labelMap[route] || 'nav.home';
}
