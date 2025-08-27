'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Languages,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Locale, LocalizedContent } from '@/types/content';

interface TranslationFallbackProps {
  content: LocalizedContent;
  field?: string;
  showAlert?: boolean;
  showLanguageSwitch?: boolean;
  onLanguageSwitch?: (locale: Locale) => void;
  onRequestTranslation?: () => void;
  className?: string;
}

export default function TranslationFallback({
  content,
  field = 'content',
  showAlert = true,
  showLanguageSwitch = true,
  onLanguageSwitch,
  onRequestTranslation,
  className = '',
}: TranslationFallbackProps) {
  const t = useTranslations('translation.fallback');
  const currentLocale = useLocale() as Locale;

  // Check if content exists in current locale
  const hasCurrentLocaleContent =
    content[currentLocale] && content[currentLocale].trim() !== '';

  // Find available locales
  const availableLocales = (['en', 'es'] as Locale[]).filter(
    locale => content[locale] && content[locale].trim() !== ''
  );

  // Get fallback locale (first available that's not current)
  const fallbackLocale = availableLocales.find(
    locale => locale !== currentLocale
  );

  // If content exists in current locale, render normally
  if (hasCurrentLocaleContent) {
    return <div className={className}>{content[currentLocale]}</div>;
  }

  // If no content available in any locale
  if (availableLocales.length === 0) {
    return (
      <div className={className}>
        {showAlert && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('no_content_available')}
              {onRequestTranslation && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={onRequestTranslation}
                  className="ml-2 p-0 h-auto"
                >
                  {t('request_translation')}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        <div className="text-muted-foreground italic">
          {t('content_not_available')}
        </div>
      </div>
    );
  }

  // Render fallback content with notification
  return (
    <div className={className}>
      {showAlert && (
        <Alert className="mb-4">
          <Languages className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              {t('showing_fallback', {
                field,
                locale: getLocaleDisplayName(fallbackLocale!),
              })}
            </div>
            <div className="flex items-center gap-2">
              {showLanguageSwitch && onLanguageSwitch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLanguageSwitch(fallbackLocale!)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {t('switch_to', { locale: fallbackLocale!.toUpperCase() })}
                </Button>
              )}
              {onRequestTranslation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRequestTranslation}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('request_translation')}
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div className="opacity-75">{content[fallbackLocale!]}</div>
        <Badge variant="secondary" className="absolute top-0 right-0 text-xs">
          {fallbackLocale!.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}

// Helper function to get display name for locale
function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
  };
  return names[locale] || locale;
}

// Hook for using translation fallback in components
export function useTranslationFallback() {
  const currentLocale = useLocale() as Locale;

  const getContent = (
    content: LocalizedContent,
    fallbackToAny = true
  ): string => {
    // Try current locale first
    if (content[currentLocale] && content[currentLocale].trim() !== '') {
      return content[currentLocale];
    }

    if (!fallbackToAny) {
      return '';
    }

    // Try other locales
    const availableLocales = (['en', 'es'] as Locale[]).filter(
      locale => content[locale] && content[locale].trim() !== ''
    );

    const fallbackLocale = availableLocales.find(
      locale => locale !== currentLocale
    );
    return fallbackLocale ? content[fallbackLocale] : '';
  };

  const hasTranslation = (
    content: LocalizedContent,
    locale?: Locale
  ): boolean => {
    const targetLocale = locale || currentLocale;
    return !!(content[targetLocale] && content[targetLocale].trim() !== '');
  };

  const getAvailableLocales = (content: LocalizedContent): Locale[] => {
    return (['en', 'es'] as Locale[]).filter(
      locale => content[locale] && content[locale].trim() !== ''
    );
  };

  const getMissingLocales = (content: LocalizedContent): Locale[] => {
    return (['en', 'es'] as Locale[]).filter(
      locale => !content[locale] || content[locale].trim() === ''
    );
  };

  const getTranslationCompleteness = (content: LocalizedContent): number => {
    const available = getAvailableLocales(content).length;
    const total = 2; // en, es
    return (available / total) * 100;
  };

  return {
    getContent,
    hasTranslation,
    getAvailableLocales,
    getMissingLocales,
    getTranslationCompleteness,
    currentLocale,
  };
}

// Higher-order component for automatic fallback
export function withTranslationFallback<
  T extends { content: LocalizedContent },
>(Component: React.ComponentType<T>) {
  return function TranslationFallbackWrapper(props: T) {
    const { getContent } = useTranslationFallback();

    // Create enhanced props with fallback content
    const enhancedProps = {
      ...props,
      content: {
        ...props.content,
        // Add a resolved content field for easy access
        resolved: getContent(props.content),
      },
    };

    return <Component {...enhancedProps} />;
  };
}
