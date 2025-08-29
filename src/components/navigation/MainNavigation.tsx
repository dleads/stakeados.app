'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  useTranslation,
  getLocalizedUrl,
  getLanguageSwitcherUrls,
} from '@/lib/i18n';
import { useFilteredNavigation } from '@/hooks/useFilteredNavigation';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';
import type { Locale } from '@/types/content';

export interface MainNavigationProps {
  locale: Locale;
  currentPath?: string;
}

export default function MainNavigation({
  locale,
  currentPath = '',
}: MainNavigationProps) {
  const { t } = useTranslation(locale);
  const { navigationItems } = useFilteredNavigation(locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add translations and descriptions to navigation items
  const enhancedNavigationItems = navigationItems.map(item => ({
    ...item,
    label:
      item.key === 'articles'
        ? t('nav.articles')
        : item.key === 'news'
          ? t('nav.news')
          : item.key === 'community'
            ? t('nav.community')
            : item.label,
    description:
      item.key === 'articles'
        ? 'Educational content'
        : item.key === 'news'
          ? 'Latest updates'
          : item.key === 'community'
            ? 'Join discussions'
            : item.key === 'courses'
              ? 'Learning platform'
              : item.key === 'genesis'
                ? 'Exclusive access'
                : item.key === 'dashboard'
                  ? 'Personal dashboard'
                  : 'Feature',
  }));

  // Language switcher options
  const languageOptions = getLanguageSwitcherUrls(currentPath, locale);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-md border-b border-green-500/20'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={getLocalizedUrl('/', locale)}
            className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded-md"
            aria-label="Stakeados Home"
          >
            <Image
              src="https://res.cloudinary.com/dvmtkwrme/image/upload/v1756440936/logo_2_yrsudy.svg"
              alt="Stakeados logo"
              width={64}
              height={64}
              priority
              sizes="(min-width: 1024px) 56px, (min-width: 768px) 48px, 40px"
              className="h-10 w-auto md:h-12 lg:h-14 drop-shadow-[0_0_6px_rgba(0,0,0,0.35)]"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {enhancedNavigationItems.map(item => (
              <Link
                key={item.key}
                href={item.href}
                className="group relative px-3 py-2 text-gray-300 hover:text-green-400 transition-all duration-300 font-medium"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {item.label}
                  {item.adminOnly && item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center space-x-1 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {locale.toUpperCase()}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isLanguageOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Language Dropdown */}
              {isLanguageOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2">
                  {languageOptions.map(option => (
                    <Link
                      key={option.locale}
                      href={option.url}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        option.isActive
                          ? 'text-green-400 bg-green-500/10'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                      onClick={() => setIsLanguageOpen(false)}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4">
            <div className="space-y-2">
              {enhancedNavigationItems.map(item => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="font-medium flex items-center gap-2">
                    {item.label}
                    {item.adminOnly && item.badge && (
                      <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.description}
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile Language Switcher */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-500 mb-2">Language</div>
              <div className="space-y-1">
                {languageOptions.map(option => (
                  <Link
                    key={option.locale}
                    href={option.url}
                    className={`block px-4 py-2 rounded-lg transition-colors ${
                      option.isActive
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
}
