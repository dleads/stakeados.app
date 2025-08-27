'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/utils/navigation';
import {
  getLocalizedPath,
  formatNumber,
  formatDate,
  isValidLocale,
} from '@/lib/utils/translationFallback';
import type { Locale } from '@/types/content';

/**
 * Comprehensive internationalization hook for homepage components
 */
export function useInternationalization() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  /**
   * Switch to a different locale
   */
  const switchLocale = (newLocale: Locale) => {
    if (!isValidLocale(newLocale) || newLocale === locale) {
      return;
    }

    // Get the current path without locale prefix
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

    // Get localized path for the new locale
    const localizedPath = getLocalizedPath(pathWithoutLocale, newLocale);

    // Navigate to new locale
    router.push(`/${newLocale}${localizedPath}`);
  };

  /**
   * Get translation with fallback support
   */
  const getTranslation = (key: string, fallback?: string): string => {
    try {
      const translation = t(key);
      // Check if translation exists and is not just the key returned
      if (translation && translation !== key) {
        return translation;
      }

      // Return fallback or key if no translation found
      return fallback || key;
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`, error);
      return fallback || key;
    }
  };

  /**
   * Format number according to current locale
   */
  const formatLocalizedNumber = (value: number): string => {
    return formatNumber(value, locale);
  };

  /**
   * Format date according to current locale
   */
  const formatLocalizedDate = (
    date: Date,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    return formatDate(date, locale, options);
  };

  /**
   * Get localized route path
   */
  const getLocalizedRoute = (path: string): string => {
    return getLocalizedPath(path, locale);
  };

  /**
   * Check if current locale is RTL (for future RTL support)
   */
  const isRTL = (): boolean => {
    // Currently only supporting LTR languages
    // Can be extended for RTL languages like Arabic, Hebrew
    return false;
  };

  /**
   * Get available locales
   */
  const getAvailableLocales = (): Locale[] => {
    return ['en', 'es'];
  };

  /**
   * Get locale display name
   */
  const getLocaleDisplayName = (targetLocale?: Locale): string => {
    const displayLocale = targetLocale || locale;
    const names: Record<Locale, string> = {
      en: 'English',
      es: 'Español',
    };
    return names[displayLocale] || displayLocale;
  };

  /**
   * Get opposite locale (for toggle functionality)
   */
  const getOppositeLocale = (): Locale => {
    return locale === 'en' ? 'es' : 'en';
  };

  /**
   * Check if a translation key exists
   */
  const hasTranslation = (key: string): boolean => {
    try {
      const translation = t(key);
      return translation !== key && Boolean(translation);
    } catch {
      return false;
    }
  };

  /**
   * Get homepage-specific translations
   */
  const getHomepageTranslations = () => {
    return {
      hero: {
        title: getTranslation('homepage.hero.title', 'Stakeados'),
        subtitle: getTranslation(
          'homepage.hero.subtitle',
          'Decentralized Learning Platform'
        ),
        description: getTranslation(
          'homepage.hero.description',
          'Discover, Learn, and Contribute to the Future of Education'
        ),
        primaryCta: getTranslation(
          'homepage.hero.primaryCta',
          'Explore Articles'
        ),
        secondaryCta: getTranslation(
          'homepage.hero.secondaryCta',
          'Browse Courses'
        ),
      },
      sections: {
        featuredNews: {
          title: getTranslation(
            'homepage.sections.featuredNews.title',
            'Latest News'
          ),
          subtitle: getTranslation(
            'homepage.sections.featuredNews.subtitle',
            'Stay updated with the latest developments'
          ),
        },
        featuredArticles: {
          title: getTranslation(
            'homepage.sections.featuredArticles.title',
            'Featured Articles'
          ),
          subtitle: getTranslation(
            'homepage.sections.featuredArticles.subtitle',
            'Discover educational content'
          ),
        },
        quickNavigation: {
          title: getTranslation(
            'homepage.sections.quickNavigation.title',
            'Explore Platform'
          ),
          subtitle: getTranslation(
            'homepage.sections.quickNavigation.subtitle',
            'Discover everything our platform has to offer'
          ),
        },
        coursesPreview: {
          title: getTranslation(
            'homepage.sections.coursesPreview.title',
            'Featured Courses'
          ),
          subtitle: getTranslation(
            'homepage.sections.coursesPreview.subtitle',
            'Start your learning journey'
          ),
        },
      },
      common: {
        loading: getTranslation('homepage.errors.loading', 'Loading...'),
        viewAll: getTranslation('common.viewAll', 'View All'),
        tryAgain: getTranslation('homepage.errors.retry', 'Try Again'),
        error: getTranslation('homepage.errors.title', 'Something went wrong'),
      },
    };
  };

  return {
    locale,
    switchLocale,
    getTranslation,
    formatLocalizedNumber,
    formatLocalizedDate,
    getLocalizedRoute,
    isRTL,
    getAvailableLocales,
    getLocaleDisplayName,
    getOppositeLocale,
    hasTranslation,
    getHomepageTranslations,
    t, // Direct access to useTranslations hook
  };
}
