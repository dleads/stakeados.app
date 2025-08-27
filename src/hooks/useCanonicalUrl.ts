'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { Locale } from '@/types/content';
import { i18nRoutingService } from '@/lib/services/i18nRoutingService';

interface UseCanonicalUrlOptions {
  params?: Record<string, string | string[]>;
  includeSearchParams?: boolean;
}

export function useCanonicalUrl(options: UseCanonicalUrlOptions = {}) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const { params, includeSearchParams = false } = options;

  const urls = useMemo(() => {
    // Get current path without locale prefix
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

    // Get canonical URL for current locale
    const canonicalUrl = i18nRoutingService.getCanonicalUrl(
      pathWithoutLocale,
      locale,
      params
    );

    // Get alternate URLs for all locales
    const alternateUrls = i18nRoutingService.getAlternateUrls(
      pathWithoutLocale,
      params
    );

    // Get hreflang URLs for SEO
    const hreflangUrls = i18nRoutingService.getHreflangUrls(
      pathWithoutLocale,
      params
    );

    // Add search params if needed
    let finalCanonicalUrl = canonicalUrl;
    let finalAlternateUrls = alternateUrls;
    let finalHreflangUrls = hreflangUrls;

    if (includeSearchParams && typeof window !== 'undefined') {
      const searchParams = window.location.search;

      if (searchParams) {
        finalCanonicalUrl += searchParams;

        Object.keys(finalAlternateUrls).forEach(locale => {
          finalAlternateUrls[locale as Locale] += searchParams;
        });

        Object.keys(finalHreflangUrls).forEach(hreflang => {
          finalHreflangUrls[hreflang] += searchParams;
        });
      }
    }

    return {
      canonical: finalCanonicalUrl,
      alternates: finalAlternateUrls,
      hreflang: finalHreflangUrls,
    };
  }, [pathname, locale, params, includeSearchParams]);

  return urls;
}

// Hook for getting language switcher URLs
export function useLanguageSwitcherUrls(
  params?: Record<string, string | string[]>
) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  return useMemo(() => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

    return i18nRoutingService.getLanguageSwitcherUrls(
      pathWithoutLocale,
      locale,
      params
    );
  }, [pathname, locale, params]);
}

// Hook for getting localized route
export function useLocalizedRoute() {
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  const getRoute = (
    path: string,
    params?: Record<string, string | string[]>
  ) => {
    return i18nRoutingService.getLocalizedRoute(path, locale, params);
  };

  const getCurrentRoute = (params?: Record<string, string | string[]>) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    return i18nRoutingService.getLocalizedRoute(
      pathWithoutLocale,
      locale,
      params
    );
  };

  return {
    getRoute,
    getCurrentRoute,
    locale,
  };
}
