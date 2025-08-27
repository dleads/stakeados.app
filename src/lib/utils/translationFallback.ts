import { useTranslations } from 'next-intl';
import type { Locale } from '@/types/content';

/**
 * Translation fallback utility for handling missing translations
 */
export function useTranslationWithFallback(namespace?: string) {
  const t = useTranslations(namespace);

  return (key: string, fallback?: string): string => {
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
}

/**
 * Get localized route path based on locale
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  const pathMappings: Record<string, Record<Locale, string>> = {
    '/articles': {
      en: '/articles',
      es: '/articulos',
    },
    '/news': {
      en: '/news',
      es: '/noticias',
    },
    '/courses': {
      en: '/courses',
      es: '/cursos',
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
  };

  return pathMappings[path]?.[locale] || path;
}

/**
 * Format numbers according to locale
 */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US').format(
    value
  );
}

/**
 * Format dates according to locale
 */
export function formatDate(
  date: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    ...defaultOptions,
    ...options,
  }).format(date);
}

/**
 * Get text direction for locale (for future RTL support)
 */
export function getTextDirection(_locale: Locale): 'ltr' | 'rtl' {
  // Currently only supporting LTR languages
  // Can be extended for RTL languages like Arabic, Hebrew
  return 'ltr';
}

/**
 * Validate if a locale is supported
 */
export function isValidLocale(locale: string): locale is Locale {
  return ['en', 'es'].includes(locale);
}

/**
 * Get fallback locale
 */
export function getFallbackLocale(): Locale {
  return 'en';
}

/**
 * Get browser preferred locale with fallback
 */
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return getFallbackLocale();
  }

  const browserLang = navigator.language.split('-')[0];
  return isValidLocale(browserLang) ? browserLang : getFallbackLocale();
}
