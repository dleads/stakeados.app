import { translations, type Translations } from './translations';
import type { Locale } from '@/types/content';

export type TranslationKey = keyof Translations;

export interface UseTranslationReturn {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  locale: Locale;
}

/**
 * Custom translation hook for our manual i18n system
 * @param locale - The current locale
 * @returns Translation function and locale
 */
export function useTranslation(locale: Locale): UseTranslationReturn {
  const t = (
    key: TranslationKey,
    params?: Record<string, string | number>
  ): string => {
    let translation = translations[locale][key];

    // Fallback to English if translation doesn't exist
    if (!translation && locale !== 'en') {
      translation = translations.en[key];
    }

    // Fallback to key if no translation found
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
      return key;
    }

    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }

    return translation;
  };

  return { t, locale };
}

/**
 * Server-side translation function
 * @param locale - The current locale
 * @param key - Translation key
 * @param params - Optional parameters for interpolation
 * @returns Translated string
 */
export function getTranslation(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const localeTranslations = getTranslations(locale);
  let translation = localeTranslations?.[key] ?? key;

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translation = translation.replace(`{${paramKey}}`, String(value));
    });
  }

  return translation;
}

/**
 * Get all translations for a specific locale
 * @param locale - The locale to get translations for
 * @returns All translations for the locale
 */
export function getTranslations(locale: Locale): Translations {
  // Fallbacks seguros: primero al 'es', luego a 'en'
  return (
    translations[locale] ??
    (translations as any)['es'] ??
    (translations as any)['en']
  );
}

/**
 * Check if a translation key exists
 * @param locale - The locale to check
 * @param key - The translation key
 * @returns Whether the key exists
 */
export function hasTranslation(locale: Locale, key: TranslationKey): boolean {
  return key in translations[locale];
}

/**
 * Format relative time with translations
 * @param locale - The current locale
 * @param date - The date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(locale: Locale, date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return getTranslation(locale, 'time.justNow' as TranslationKey);
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return getTranslation(locale, 'time.minutesAgo' as TranslationKey, {
      minutes: diffInMinutes,
    });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return getTranslation(locale, 'time.hoursAgo' as TranslationKey, {
      hours: diffInHours,
    });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return getTranslation(locale, 'time.daysAgo' as TranslationKey, {
      days: diffInDays,
    });
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return getTranslation(locale, 'time.weeksAgo' as TranslationKey, {
      weeks: diffInWeeks,
    });
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return getTranslation(locale, 'time.monthsAgo' as TranslationKey, {
      months: diffInMonths,
    });
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return getTranslation(locale, 'time.yearsAgo' as TranslationKey, {
    years: diffInYears,
  });
}
