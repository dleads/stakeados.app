'use client';

import React from 'react';
import Head from 'next/head';

import type { Locale } from '@/types/content';

interface HomepageSEOProps {
  locale: Locale;
  stats?: {
    totalArticles: number;
    totalNews: number;
    totalCourses: number;
    activeUsers: number;
  };
}

export default function HomepageSEO({ locale, stats }: HomepageSEOProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Generate localized content
  const titles = {
    en: 'Stakeados - Decentralized Learning Platform',
    es: 'Stakeados - Plataforma de Aprendizaje Descentralizada',
  };

  const descriptions = {
    en: 'Discover articles, news, and courses on decentralized learning. Join our community of educators and learners building the future of Web3 education.',
    es: 'Descubre artículos, noticias y cursos sobre aprendizaje descentralizado. Únete a nuestra comunidad de educadores y estudiantes construyendo el futuro de la educación Web3.',
  };

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

  // Generate canonical and alternate URLs
  const canonicalUrl = `${baseUrl}/${locale}`;
  const alternateUrls = {
    en: `${baseUrl}/en`,
    es: `${baseUrl}/es`,
  };

  // Generate structured data for homepage
  const generateHomepageJsonLd = () => {
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Stakeados',
      description: descriptions[locale],
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 200,
        height: 200,
      },
      sameAs: ['https://twitter.com/stakeados', 'https://github.com/stakeados'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English', 'Spanish'],
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'Global',
      },
      foundingDate: '2024',
      numberOfEmployees: '10-50',
      knowsAbout: [
        'Blockchain Education',
        'Cryptocurrency',
        'Decentralized Finance',
        'Web3 Development',
        'Smart Contracts',
        'NFT Technology',
      ],
    };

    const websiteData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Stakeados',
      description: descriptions[locale],
      url: baseUrl,
      inLanguage: locale,
      isAccessibleForFree: true,
      publisher: {
        '@type': 'Organization',
        name: 'Stakeados',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/${locale}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    // Add course catalog if we have course stats
    const courseCatalogData = stats?.totalCourses
      ? {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name:
            locale === 'en'
              ? 'Blockchain & Web3 Education'
              : 'Educación Blockchain y Web3',
          description:
            locale === 'en'
              ? 'Comprehensive courses covering blockchain technology, cryptocurrency, and Web3 development'
              : 'Cursos completos que cubren tecnología blockchain, criptomonedas y desarrollo Web3',
          provider: {
            '@type': 'Organization',
            name: 'Stakeados',
            url: baseUrl,
          },
          educationalLevel: 'Beginner to Advanced',
          teaches: [
            'Blockchain Fundamentals',
            'Cryptocurrency Trading',
            'Smart Contract Development',
            'DeFi Protocols',
            'NFT Creation',
          ],
          numberOfCredits: stats.totalCourses,
          courseMode: 'online',
          isAccessibleForFree: true,
        }
      : null;

    return [organizationData, websiteData, courseCatalogData].filter(Boolean);
  };

  const jsonLdData = generateHomepageJsonLd();

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{titles[locale]}</title>
      <meta name="description" content={descriptions[locale]} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <meta name="author" content="Stakeados Team" />
      <meta name="language" content={locale} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Alternate Language URLs */}
      <link rel="alternate" hrefLang="en" href={alternateUrls.en} />
      <link rel="alternate" hrefLang="es" href={alternateUrls.es} />
      <link rel="alternate" hrefLang="x-default" href={alternateUrls.en} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={titles[locale]} />
      <meta property="og:description" content={descriptions[locale]} />
      <meta property="og:image" content={`${baseUrl}/og-homepage.jpg`} />
      <meta property="og:image:alt" content={titles[locale]} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta
        property="og:locale"
        content={locale === 'es' ? 'es_ES' : 'en_US'}
      />
      <meta
        property="og:locale:alternate"
        content={locale === 'es' ? 'en_US' : 'es_ES'}
      />
      <meta property="og:site_name" content="Stakeados" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={titles[locale]} />
      <meta name="twitter:description" content={descriptions[locale]} />
      <meta name="twitter:image" content={`${baseUrl}/og-homepage.jpg`} />
      <meta name="twitter:image:alt" content={titles[locale]} />
      <meta name="twitter:site" content="@stakeados" />
      <meta name="twitter:creator" content="@stakeados" />

      {/* Additional Meta Tags for Homepage */}
      <meta name="theme-color" content="#00FF88" />
      <meta name="msapplication-TileColor" content="#00FF88" />
      <meta name="application-name" content="Stakeados" />
      <meta name="apple-mobile-web-app-title" content="Stakeados" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />

      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* DNS Prefetch for better performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />

      {/* Favicon and App Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00FF88" />

      {/* JSON-LD Structured Data */}
      {jsonLdData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data),
          }}
        />
      ))}

      {/* Additional SEO Meta Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* Performance and Security Headers */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />

      {/* Rich Snippets for Statistics */}
      {stats && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Stakeados',
              url: baseUrl,
              mainEntity: {
                '@type': 'EducationalOrganization',
                name: 'Stakeados',
                numberOfEmployees: stats.activeUsers,
                offers: [
                  {
                    '@type': 'Course',
                    name:
                      locale === 'en'
                        ? 'Available Courses'
                        : 'Cursos Disponibles',
                    numberOfCredits: stats.totalCourses,
                  },
                ],
                publishingPrinciples: `${baseUrl}/${locale}/about`,
                knowsAbout: [
                  `${stats.totalArticles} Educational Articles`,
                  `${stats.totalNews} News Updates`,
                  `${stats.totalCourses} Learning Courses`,
                ],
              },
            }),
          }}
        />
      )}
    </Head>
  );
}

// Hook for generating homepage SEO metadata
export function useHomepageSEO(locale: Locale) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const generateHomepageMetadata = (stats?: {
    totalArticles: number;
    totalNews: number;
    totalCourses: number;
    activeUsers: number;
  }) => {
    const titles = {
      en: 'Stakeados - Decentralized Learning Platform',
      es: 'Stakeados - Plataforma de Aprendizaje Descentralizada',
    };

    const descriptions = {
      en: stats
        ? `Discover ${stats.totalArticles} articles, ${stats.totalNews} news updates, and ${stats.totalCourses} courses on decentralized learning. Join ${stats.activeUsers} learners building the future of Web3 education.`
        : 'Discover articles, news, and courses on decentralized learning. Join our community of educators and learners building the future of Web3 education.',
      es: stats
        ? `Descubre ${stats.totalArticles} artículos, ${stats.totalNews} noticias y ${stats.totalCourses} cursos sobre aprendizaje descentralizado. Únete a ${stats.activeUsers} estudiantes construyendo el futuro de la educación Web3.`
        : 'Descubre artículos, noticias y cursos sobre aprendizaje descentralizado. Únete a nuestra comunidad de educadores y estudiantes construyendo el futuro de la educación Web3.',
    };

    return {
      title: titles[locale],
      description: descriptions[locale],
      canonicalUrl: `${baseUrl}/${locale}`,
      alternateUrls: {
        en: `${baseUrl}/en`,
        es: `${baseUrl}/es`,
      },
      openGraph: {
        title: titles[locale],
        description: descriptions[locale],
        image: `${baseUrl}/og-homepage.jpg`,
        type: 'website' as const,
        locale: locale === 'es' ? 'es_ES' : 'en_US',
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: titles[locale],
        description: descriptions[locale],
        image: `${baseUrl}/og-homepage.jpg`,
      },
    };
  };

  return { generateHomepageMetadata };
}
