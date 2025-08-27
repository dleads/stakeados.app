import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES } from '@/lib/constants';
import { getTranslation } from '@/lib/i18n';
import SimpleHomePage from '@/components/homepage/SimpleHomePage';
import type { Locale } from '@/types/content';

interface HomePageProps {
  params: { locale: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Generate comprehensive metadata for SEO
export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const title = getTranslation(locale, 'home.hero.title');
  const description = getTranslation(locale, 'home.hero.subtitle');

  const keywords = [
    'blockchain education',
    'decentralized learning',
    'crypto courses',
    'web3 articles',
    'stakeados',
    'NFT certificates',
    'cryptocurrency education',
    'DeFi learning',
    'smart contracts',
    'blockchain development',
  ];

  const canonicalUrl = `${baseUrl}/${locale}`;
  const ogImage = `${baseUrl}/og-homepage.jpg`;

  return {
    title,
    description,
    keywords: keywords,
    authors: [{ name: 'Stakeados Team' }],
    creator: 'Stakeados',
    publisher: 'Stakeados',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Stakeados',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      alternateLocale: locale === 'es' ? 'en_US' : 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@stakeados',
      site: '@stakeados',
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${baseUrl}/en`,
        es: `${baseUrl}/es`,
        'x-default': `${baseUrl}/en`,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_SITE_VERIFICATION,
    },
    category: 'education',
    classification: 'Educational Platform',
    other: {
      'msapplication-TileColor': '#00FF88',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'format-detection': 'telephone=no',
    },
  };
}

export default function HomePageRoute({ params, searchParams }: HomePageProps) {
  // Validate locale
  if (!LOCALES.includes(params.locale as any)) {
    notFound();
  }

  const locale = params.locale as Locale;

  return <SimpleHomePage locale={locale} searchParams={searchParams} />;
}

// Generate static params for all locales
export function generateStaticParams() {
  return LOCALES.map(locale => ({
    locale: locale,
  }));
}
