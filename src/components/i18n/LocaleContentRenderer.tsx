'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import type { Locale } from '@/types/content';

interface LocaleContentRendererProps {
  content: Record<Locale, React.ReactNode>;
  fallbackLocale?: Locale;
  className?: string;
}

/**
 * Component for rendering locale-specific content with fallback support
 */
export default function LocaleContentRenderer({
  content,
  fallbackLocale = 'en',
  className = '',
}: LocaleContentRendererProps) {
  const currentLocale = useLocale() as Locale;

  // Get content for current locale or fallback
  const renderedContent =
    content[currentLocale] || content[fallbackLocale] || null;

  if (!renderedContent) {
    console.warn(
      `No content available for locale: ${currentLocale} or fallback: ${fallbackLocale}`
    );
    return null;
  }

  return (
    <div className={className} lang={currentLocale}>
      {renderedContent}
    </div>
  );
}

/**
 * Hook for getting locale-specific content with fallback
 */
export function useLocaleContent<T>(
  content: Record<Locale, T>,
  fallbackLocale: Locale = 'en'
): T | null {
  const currentLocale = useLocale() as Locale;

  return content[currentLocale] || content[fallbackLocale] || null;
}

/**
 * Component for rendering locale-specific text with fallback
 */
interface LocaleTextProps {
  text: Record<Locale, string>;
  fallbackLocale?: Locale;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function LocaleText({
  text,
  fallbackLocale = 'en',
  className = '',
  as: Component = 'span',
}: LocaleTextProps) {
  const currentLocale = useLocale() as Locale;

  const displayText = text[currentLocale] || text[fallbackLocale] || '';

  if (!displayText) {
    console.warn(
      `No text available for locale: ${currentLocale} or fallback: ${fallbackLocale}`
    );
    return null;
  }

  return (
    <Component className={className} lang={currentLocale}>
      {displayText}
    </Component>
  );
}
