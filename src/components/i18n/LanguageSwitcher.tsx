'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LOCALES } from '@/lib/constants';
import { getLocalizedPath } from '@/lib/utils/translationFallback';
import type { Locale } from '@/types/content';

interface LanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'dropdown' | 'toggle';
}

const languageNames: Record<Locale, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  es: { native: 'Español', english: 'Spanish' },
};

export default function LanguageSwitcher({
  className = '',
  showLabel = true,
  variant = 'dropdown',
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;

  const [isOpen, setIsOpen] = useState(false);

  const switchLanguage = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';

    // Get localized path for the new locale
    const localizedPath = getLocalizedPath(pathWithoutLocale, newLocale);

    // Navigate to new locale
    const newPath = `/${newLocale}${localizedPath}`;
    router.push(newPath);

    setIsOpen(false);
  };

  if (variant === 'toggle') {
    const otherLocale = currentLocale === 'en' ? 'es' : 'en';

    return (
      <button
        onClick={() => switchLanguage(otherLocale)}
        className={`language-toggle flex items-center gap-2 px-3 py-2 rounded-gaming bg-stakeados-gray-800 hover:bg-stakeados-gray-700 text-stakeados-gray-300 hover:text-white transition-all duration-300 border border-stakeados-gray-600 hover:border-stakeados-primary/30 ${className}`}
        aria-label={`Switch to ${languageNames[otherLocale].english}`}
      >
        <Globe className="w-4 h-4" />
        {showLabel && (
          <span className="text-sm font-medium">
            {languageNames[otherLocale].native}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`language-switcher relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-button flex items-center gap-2 px-3 py-2 rounded-gaming bg-stakeados-gray-800 hover:bg-stakeados-gray-700 text-stakeados-gray-300 hover:text-white transition-all duration-300 border border-stakeados-gray-600 hover:border-stakeados-primary/30"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        {showLabel && (
          <span className="text-sm font-medium">
            {languageNames[currentLocale].native}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            className="language-dropdown absolute top-full left-0 mt-2 min-w-[160px] bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming shadow-glow-lg z-50"
            role="listbox"
            aria-label="Language options"
          >
            {LOCALES.map(locale => (
              <button
                key={locale}
                onClick={() => switchLanguage(locale)}
                className={`language-option w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stakeados-gray-700 transition-colors duration-200 first:rounded-t-gaming last:rounded-b-gaming ${
                  locale === currentLocale
                    ? 'text-stakeados-primary bg-stakeados-primary/10'
                    : 'text-stakeados-gray-300 hover:text-white'
                }`}
                role="option"
                aria-selected={locale === currentLocale}
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {languageNames[locale].native}
                  </span>
                  <span className="text-xs text-stakeados-gray-400">
                    {languageNames[locale].english}
                  </span>
                </div>

                {locale === currentLocale && (
                  <Check className="w-4 h-4 text-stakeados-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
