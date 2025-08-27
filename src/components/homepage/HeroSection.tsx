'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, BookOpen, Zap, Users, Trophy } from 'lucide-react';
import type { Locale } from '@/types/content';

export interface HeroSectionProps {
  locale: Locale;
  className?: string;
}

export default function HeroSection({
  locale,
  className = '',
}: HeroSectionProps) {
  const t = useTranslations('homepage.hero');

  return (
    <section
      className={`hero-section relative overflow-hidden min-h-[60vh] sm:min-h-[70vh] lg:min-h-[75vh] xl:min-h-[80vh] flex items-center justify-center text-center bg-gradient-to-br from-stakeados-primary/10 via-stakeados-dark/95 to-stakeados-blue/10 rounded-gaming-lg border border-stakeados-gray-800/50 ${className}`}
      role="banner"
      aria-labelledby="hero-title"
    >
      {/* Enhanced animated background gradient */}
      <div className="absolute inset-0 overflow-hidden rounded-gaming-lg">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-stakeados-primary/15 via-stakeados-dark/90 to-stakeados-blue/15 animate-pulse-glow" />

        {/* Animated floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stakeados-primary/8 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-stakeados-blue/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-stakeados-purple/6 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />

        {/* Gaming grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Animated scan lines */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-stakeados-primary to-transparent animate-pulse"
            style={{ top: '20%' }}
          />
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-stakeados-blue to-transparent animate-pulse"
            style={{ top: '60%', animationDelay: '1s' }}
          />
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-stakeados-purple to-transparent animate-pulse"
            style={{ top: '80%', animationDelay: '2s' }}
          />
        </div>
      </div>

      {/* Hero content */}
      <div className="hero-content relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Gaming-themed decorative elements - hidden on mobile for cleaner look */}
        <div
          className="absolute top-4 sm:top-8 left-4 sm:left-8 hidden sm:flex items-center gap-2 opacity-60"
          aria-hidden="true"
        >
          <div className="w-2 h-2 bg-stakeados-primary rounded-full animate-pulse" />
          <div
            className="w-1 h-1 bg-stakeados-primary rounded-full animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
          <div
            className="w-1.5 h-1.5 bg-stakeados-primary rounded-full animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        {/* Main title with enhanced neon effect */}
        <h1
          id="hero-title"
          className="hero-title text-glow-strong text-center mb-6"
          style={{
            background:
              'linear-gradient(135deg, #00FF88 0%, #00AAFF 50%, #AA00FF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow:
              '0 0 30px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 170, 255, 0.4)',
            fontSize: 'clamp(2rem, 8vw, 4rem)',
            fontWeight: '900',
            letterSpacing: '-0.02em',
            lineHeight: '1.1',
          }}
        >
          {t('title')}
        </h1>

        {/* Subtitle with gaming typography */}
        <p className="hero-subtitle text-center mb-4 text-stakeados-gray-100 font-semibold tracking-wide uppercase text-sm sm:text-base lg:text-lg">
          {t('subtitle')}
        </p>

        {/* Description with better responsive typography */}
        <p className="text-center text-base sm:text-lg lg:text-xl text-stakeados-gray-200 max-w-3xl mx-auto leading-relaxed mb-8 px-4">
          {t('description')}
        </p>

        {/* Enhanced call-to-action buttons with mobile optimization */}
        <div className="hero-actions flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
          <Link
            href={`/${locale}/articles`}
            className="hero-primary-cta group relative overflow-hidden w-full sm:w-auto max-w-xs sm:max-w-none"
            role="button"
            aria-label={t('primaryCta')}
            tabIndex={0}
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

            <span className="relative flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-dark text-stakeados-dark font-bold rounded-gaming text-base sm:text-lg shadow-glow-lg group-hover:shadow-glow-xl transition-all duration-300 group-hover:-translate-y-1 min-h-[48px] touch-manipulation">
              <BookOpen
                className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{t('primaryCta')}</span>
              <ArrowRight
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform group-hover:translate-x-2"
                aria-hidden="true"
              />
            </span>
          </Link>

          <Link
            href={`/${locale}/courses`}
            className="hero-secondary-cta group relative overflow-hidden w-full sm:w-auto max-w-xs sm:max-w-none"
            role="button"
            aria-label={t('secondaryCta')}
            tabIndex={0}
          >
            {/* Button border glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-stakeados-primary to-stakeados-blue opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm" />

            <span className="relative flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-transparent text-stakeados-primary font-bold rounded-gaming text-base sm:text-lg border-2 border-stakeados-primary group-hover:border-stakeados-blue group-hover:text-stakeados-blue transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow min-h-[48px] touch-manipulation">
              <Trophy
                className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{t('secondaryCta')}</span>
              <ArrowRight
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform group-hover:translate-x-2"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>

        {/* Gaming-themed feature highlights with mobile optimization */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-stakeados-gray-300 text-sm sm:text-base">
          <div className="flex items-center gap-2 group cursor-default min-h-[44px] px-2 py-1 rounded-gaming hover:bg-stakeados-primary/5 transition-colors duration-300">
            <Zap
              className="w-4 h-4 sm:w-5 sm:h-5 text-stakeados-primary group-hover:animate-pulse flex-shrink-0"
              aria-hidden="true"
            />
            <span className="group-hover:text-stakeados-primary transition-colors duration-300 whitespace-nowrap">
              Decentralized
            </span>
          </div>
          <div className="flex items-center gap-2 group cursor-default min-h-[44px] px-2 py-1 rounded-gaming hover:bg-stakeados-blue/5 transition-colors duration-300">
            <Users
              className="w-4 h-4 sm:w-5 sm:h-5 text-stakeados-blue group-hover:animate-pulse flex-shrink-0"
              aria-hidden="true"
            />
            <span className="group-hover:text-stakeados-blue transition-colors duration-300 whitespace-nowrap">
              Community-Driven
            </span>
          </div>
          <div className="flex items-center gap-2 group cursor-default min-h-[44px] px-2 py-1 rounded-gaming hover:bg-stakeados-purple/5 transition-colors duration-300">
            <Trophy
              className="w-4 h-4 sm:w-5 sm:h-5 text-stakeados-purple group-hover:animate-pulse flex-shrink-0"
              aria-hidden="true"
            />
            <span className="group-hover:text-stakeados-purple transition-colors duration-300 whitespace-nowrap">
              Gamified Learning
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced decorative elements for gaming aesthetic */}
      <div
        className="absolute top-4 left-4 w-2 h-2 bg-stakeados-primary rounded-full animate-pulse opacity-60"
        aria-hidden="true"
      />
      <div
        className="absolute top-8 right-8 w-1 h-1 bg-stakeados-blue rounded-full animate-pulse opacity-40"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-6 left-12 w-1.5 h-1.5 bg-stakeados-primary rounded-full animate-pulse opacity-50"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-12 right-6 w-1 h-1 bg-stakeados-blue rounded-full animate-pulse opacity-30"
        aria-hidden="true"
      />

      {/* Corner accent elements */}
      <div
        className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-stakeados-primary/30 rounded-tl-gaming"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-stakeados-blue/30 rounded-tr-gaming"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-stakeados-purple/30 rounded-bl-gaming"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-stakeados-primary/30 rounded-br-gaming"
        aria-hidden="true"
      />

      {/* Floating particles */}
      <div
        className="absolute top-1/3 left-1/6 w-1 h-1 bg-stakeados-primary rounded-full animate-float opacity-40"
        style={{ animationDelay: '0.5s' }}
        aria-hidden="true"
      />
      <div
        className="absolute top-2/3 right-1/6 w-0.5 h-0.5 bg-stakeados-blue rounded-full animate-float opacity-60"
        style={{ animationDelay: '1.5s' }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-stakeados-purple rounded-full animate-float opacity-30"
        style={{ animationDelay: '2.5s' }}
        aria-hidden="true"
      />
    </section>
  );
}
