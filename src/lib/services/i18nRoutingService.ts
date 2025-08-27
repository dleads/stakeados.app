import { Locale } from '@/types/content';
import { LOCALES } from '@/lib/constants';

export interface LocalizedRoute {
  href: string;
  as?: string;
  locale?: Locale;
}

export interface RouteParams {
  [key: string]: string | string[];
}

class I18nRoutingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Get localized route for a given path and locale
   */
  getLocalizedRoute(
    path: string,
    locale: Locale,
    params?: RouteParams
  ): LocalizedRoute {
    const localizedPath = this.getLocalizedPath(path, locale, params);

    return {
      href: `/${locale}${localizedPath}`,
      locale,
    };
  }

  /**
   * Get all alternate language URLs for a given path
   */
  getAlternateUrls(path: string, params?: RouteParams): Record<Locale, string> {
    const alternates: Record<Locale, string> = {} as Record<Locale, string>;

    LOCALES.forEach(locale => {
      const localizedPath = this.getLocalizedPath(path, locale, params);
      alternates[locale] = `${this.baseUrl}/${locale}${localizedPath}`;
    });

    return alternates;
  }

  /**
   * Get canonical URL for a given path and locale
   */
  getCanonicalUrl(path: string, locale: Locale, params?: RouteParams): string {
    const localizedPath = this.getLocalizedPath(path, locale, params);
    return `${this.baseUrl}/${locale}${localizedPath}`;
  }

  /**
   * Get hreflang URLs for SEO
   */
  getHreflangUrls(path: string, params?: RouteParams): Record<string, string> {
    const hreflang: Record<string, string> = {};

    LOCALES.forEach(locale => {
      const localizedPath = this.getLocalizedPath(path, locale, params);
      const url = `${this.baseUrl}/${locale}${localizedPath}`;

      // Use proper hreflang codes
      const hreflangCode = locale === 'es' ? 'es-ES' : 'en-US';
      hreflang[hreflangCode] = url;
    });

    // Add x-default for English
    const defaultPath = this.getLocalizedPath(path, 'en', params);
    hreflang['x-default'] = `${this.baseUrl}/en${defaultPath}`;

    return hreflang;
  }

  /**
   * Generate language switcher URLs
   */
  getLanguageSwitcherUrls(
    currentPath: string,
    currentLocale: Locale,
    params?: RouteParams
  ): Array<{
    locale: Locale;
    label: string;
    url: string;
    isActive: boolean;
  }> {
    return LOCALES.map(locale => {
      const localizedPath = this.getLocalizedPath(currentPath, locale, params);

      return {
        locale,
        label: this.getLocaleLabel(locale),
        url: `/${locale}${localizedPath}`,
        isActive: locale === currentLocale,
      };
    });
  }

  /**
   * Get localized path based on route configuration
   */
  private getLocalizedPath(
    path: string,
    locale: Locale,
    params?: RouteParams
  ): string {
    // Handle dynamic routes
    if (params) {
      let localizedPath = path;

      // Replace dynamic segments with actual values
      Object.entries(params).forEach(([key, value]) => {
        const paramValue = Array.isArray(value) ? value.join('/') : value;
        localizedPath = localizedPath.replace(`[${key}]`, paramValue);
        localizedPath = localizedPath.replace(`[...${key}]`, paramValue);
      });

      return this.translatePath(localizedPath, locale);
    }

    return this.translatePath(path, locale);
  }

  /**
   * Translate path segments based on locale
   */
  private translatePath(path: string, locale: Locale): string {
    // Handle root path
    if (path === '/' || path === '') {
      return '';
    }

    // Handle specific route translations
    const pathSegments = path.split('/').filter(segment => segment !== '');
    const translatedSegments = pathSegments.map(segment => {
      return this.translateSegment(segment, locale);
    });

    return '/' + translatedSegments.join('/');
  }

  /**
   * Translate individual path segment
   */
  private translateSegment(segment: string, locale: Locale): string {
    // Route translations
    const translations: Record<string, Record<Locale, string>> = {
      articles: {
        en: 'articles',
        es: 'articulos',
      },
      news: {
        en: 'news',
        es: 'noticias',
      },
      courses: {
        en: 'courses',
        es: 'cursos',
      },
      community: {
        en: 'community',
        es: 'comunidad',
      },
      profile: {
        en: 'profile',
        es: 'perfil',
      },
      admin: {
        en: 'admin',
        es: 'admin',
      },
      search: {
        en: 'search',
        es: 'buscar',
      },
      categories: {
        en: 'categories',
        es: 'categorias',
      },
      tags: {
        en: 'tags',
        es: 'etiquetas',
      },
    };

    return translations[segment]?.[locale] || segment;
  }

  /**
   * Get reverse translation (from localized path to canonical)
   */
  getCanonicalSegment(localizedSegment: string, locale: Locale): string {
    const translations: Record<Locale, Record<string, string>> = {
      es: {
        articulos: 'articles',
        noticias: 'news',
        cursos: 'courses',
        comunidad: 'community',
        perfil: 'profile',
        buscar: 'search',
        categorias: 'categories',
        etiquetas: 'tags',
      },
      en: {
        articles: 'articles',
        news: 'news',
        courses: 'courses',
        community: 'community',
        profile: 'profile',
        search: 'search',
        categories: 'categories',
        tags: 'tags',
      },
    };

    return translations[locale]?.[localizedSegment] || localizedSegment;
  }

  /**
   * Parse localized URL to get canonical path and locale
   */
  parseLocalizedUrl(url: string): {
    locale: Locale;
    canonicalPath: string;
    params: RouteParams;
  } {
    const urlObj = new URL(url, this.baseUrl);
    const pathSegments = urlObj.pathname
      .split('/')
      .filter(segment => segment !== '');

    // First segment should be locale
    const locale = pathSegments[0] as Locale;
    const localizedSegments = pathSegments.slice(1);

    // Convert localized segments back to canonical
    const canonicalSegments = localizedSegments.map(segment =>
      this.getCanonicalSegment(segment, locale)
    );

    const canonicalPath = '/' + canonicalSegments.join('/');

    // Extract query parameters
    const params: RouteParams = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return {
      locale: LOCALES.includes(locale) ? locale : 'en',
      canonicalPath,
      params,
    };
  }

  /**
   * Generate breadcrumb navigation with localized paths
   */
  generateBreadcrumbs(
    path: string,
    locale: Locale,
    params?: RouteParams
  ): Array<{
    label: string;
    href: string;
    isActive: boolean;
  }> {
    const segments = path.split('/').filter(segment => segment !== '');
    const breadcrumbs = [];

    // Add home
    breadcrumbs.push({
      label: locale === 'es' ? 'Inicio' : 'Home',
      href: `/${locale}`,
      isActive: segments.length === 0,
    });

    // Add intermediate segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      breadcrumbs.push({
        label: this.getBreadcrumbLabel(segment, locale, params),
        href: `/${locale}${this.translatePath(currentPath, locale)}`,
        isActive: isLast,
      });
    });

    return breadcrumbs;
  }

  /**
   * Get breadcrumb label for a segment
   */
  private getBreadcrumbLabel(
    segment: string,
    locale: Locale,
    params?: RouteParams
  ): string {
    // If it's a dynamic parameter, use the actual value
    if (params && segment.startsWith('[') && segment.endsWith(']')) {
      const paramKey = segment.slice(1, -1);
      const paramValue = params[paramKey];
      return Array.isArray(paramValue)
        ? paramValue.join(' / ')
        : String(paramValue);
    }

    // Static segment translations
    const labels: Record<string, Record<Locale, string>> = {
      articles: {
        en: 'Articles',
        es: 'Artículos',
      },
      news: {
        en: 'News',
        es: 'Noticias',
      },
      courses: {
        en: 'Courses',
        es: 'Cursos',
      },
      community: {
        en: 'Community',
        es: 'Comunidad',
      },
      profile: {
        en: 'Profile',
        es: 'Perfil',
      },
      admin: {
        en: 'Admin',
        es: 'Administración',
      },
      search: {
        en: 'Search',
        es: 'Búsqueda',
      },
      categories: {
        en: 'Categories',
        es: 'Categorías',
      },
      tags: {
        en: 'Tags',
        es: 'Etiquetas',
      },
    };

    return labels[segment]?.[locale] || segment;
  }

  /**
   * Get locale display label
   */
  private getLocaleLabel(locale: Locale): string {
    const labels: Record<Locale, string> = {
      en: 'English',
      es: 'Español',
    };

    return labels[locale];
  }

  /**
   * Redirect to localized version of current page
   */
  getRedirectUrl(currentUrl: string, targetLocale: Locale): string {
    const { canonicalPath, params } = this.parseLocalizedUrl(currentUrl);
    return this.getCanonicalUrl(canonicalPath, targetLocale, params);
  }

  /**
   * Check if a URL needs locale redirect
   */
  needsLocaleRedirect(url: string): {
    needsRedirect: boolean;
    redirectUrl?: string;
  } {
    const urlObj = new URL(url, this.baseUrl);
    const pathSegments = urlObj.pathname
      .split('/')
      .filter(segment => segment !== '');

    // Check if first segment is a valid locale
    const firstSegment = pathSegments[0];

    if (!firstSegment || !LOCALES.includes(firstSegment as Locale)) {
      // Redirect to default locale (Spanish for this app)
      const defaultLocale = 'es';
      const redirectPath = urlObj.pathname === '/' ? '' : urlObj.pathname;
      const redirectUrl = `${this.baseUrl}/${defaultLocale}${redirectPath}${urlObj.search}`;

      return {
        needsRedirect: true,
        redirectUrl,
      };
    }

    return { needsRedirect: false };
  }

  /**
   * Generate sitemap entries with proper hreflang
   */
  generateSitemapEntries(
    routes: Array<{ path: string; params?: RouteParams }>
  ): Array<{
    url: string;
    alternates: Record<string, string>;
  }> {
    return routes.map(route => {
      const canonicalUrl = this.getCanonicalUrl(route.path, 'en', route.params);
      const hreflangUrls = this.getHreflangUrls(route.path, route.params);

      return {
        url: canonicalUrl,
        alternates: hreflangUrls,
      };
    });
  }
}

export const i18nRoutingService = new I18nRoutingService();
export default i18nRoutingService;
