'use client';

import React from 'react';
import MainNavigation from '@/components/navigation/MainNavigation';
import Footer from '@/components/navigation/Footer';
import { GamingBackground } from '@/components/effects';
import type { Locale } from '@/types/content';

export interface StakeadosLayoutProps {
  children: React.ReactNode;
  locale: Locale;
  showNavigation?: boolean;
  showFooter?: boolean;
  backgroundVariant?: 'matrix' | 'cyber' | 'neon' | 'particles';
  className?: string;
}

export default function StakeadosLayout({
  children,
  locale,
  showNavigation = true,
  showFooter = true,
  backgroundVariant = 'matrix',
  className = '',
}: StakeadosLayoutProps) {
  return (
    <GamingBackground variant={backgroundVariant}>
      <div
        className={`min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white ${className}`}
      >
        {showNavigation && <MainNavigation locale={locale} />}

        <main className={showNavigation ? 'pt-16' : ''}>{children}</main>

        {showFooter && <Footer locale={locale} />}
      </div>
    </GamingBackground>
  );
}
