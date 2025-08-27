'use client';

import React from 'react';
import type { Locale } from '@/types/content';

interface HomepageStructuredDataProps {
  locale: Locale;
  stats?: {
    totalArticles: number;
    totalNews: number;
    totalCourses: number;
    activeUsers: number;
  };
}

export default function HomepageStructuredData({
  locale,
  stats,
}: HomepageStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const descriptions = {
    en: 'Discover articles, news, and courses on decentralized learning. Join our community of educators and learners building the future of Web3 education.',
    es: 'Descubre artículos, noticias y cursos sobre aprendizaje descentralizado. Únete a nuestra comunidad de educadores y estudiantes construyendo el futuro de la educación Web3.',
  };

  // Organization structured data
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
    image: `${baseUrl}/og-homepage.jpg`,
    sameAs: ['https://twitter.com/stakeados', 'https://github.com/stakeados'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Spanish'],
      url: `${baseUrl}/${locale}/contact`,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'Global',
    },
    foundingDate: '2024',
    numberOfEmployees: stats?.activeUsers || '10-50',
    knowsAbout: [
      'Blockchain Education',
      'Cryptocurrency',
      'Decentralized Finance',
      'Web3 Development',
      'Smart Contracts',
      'NFT Technology',
      'DeFi Protocols',
      'Blockchain Development',
    ],
    educationalCredentialAwarded: 'NFT Certificate',
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      name: 'Blockchain Education Certificate',
      description: 'NFT-based certificates for completed courses',
      credentialCategory: 'certificate',
    },
  };

  // Website structured data
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
    mainEntity: {
      '@type': 'ItemList',
      name: locale === 'en' ? 'Educational Content' : 'Contenido Educativo',
      description:
        locale === 'en'
          ? 'Articles, news, and courses about blockchain and Web3 technology'
          : 'Artículos, noticias y cursos sobre blockchain y tecnología Web3',
      numberOfItems:
        (stats?.totalArticles || 0) +
        (stats?.totalNews || 0) +
        (stats?.totalCourses || 0),
    },
  };

  // Course catalog structured data (if courses exist)
  const courseCatalogData = stats?.totalCourses
    ? {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name:
          locale === 'en'
            ? 'Blockchain & Web3 Education Catalog'
            : 'Catálogo de Educación Blockchain y Web3',
        description:
          locale === 'en'
            ? `Comprehensive catalog of ${stats.totalCourses} courses covering blockchain technology, cryptocurrency, and Web3 development`
            : `Catálogo completo de ${stats.totalCourses} cursos que cubren tecnología blockchain, criptomonedas y desarrollo Web3`,
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
          'NFT Creation and Trading',
          'Web3 Development',
          'Decentralized Applications',
        ],
        numberOfCredits: stats.totalCourses,
        courseMode: 'online',
        isAccessibleForFree: true,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          instructor: {
            '@type': 'Organization',
            name: 'Stakeados',
          },
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      }
    : null;

  // Article collection structured data (if articles exist)
  const articleCollectionData = stats?.totalArticles
    ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: locale === 'en' ? 'Educational Articles' : 'Artículos Educativos',
        description:
          locale === 'en'
            ? `Collection of ${stats.totalArticles} educational articles about blockchain and Web3 technology`
            : `Colección de ${stats.totalArticles} artículos educativos sobre blockchain y tecnología Web3`,
        url: `${baseUrl}/${locale}/articles`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: stats.totalArticles,
          itemListElement: {
            '@type': 'Article',
            about: 'Blockchain Education',
          },
        },
        isPartOf: {
          '@type': 'WebSite',
          name: 'Stakeados',
          url: baseUrl,
        },
      }
    : null;

  // News collection structured data (if news exist)
  const newsCollectionData = stats?.totalNews
    ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: locale === 'en' ? 'Blockchain News' : 'Noticias Blockchain',
        description:
          locale === 'en'
            ? `Latest ${stats.totalNews} news updates about blockchain and cryptocurrency`
            : `Últimas ${stats.totalNews} noticias sobre blockchain y criptomonedas`,
        url: `${baseUrl}/${locale}/news`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: stats.totalNews,
          itemListElement: {
            '@type': 'NewsArticle',
            about: 'Blockchain Technology',
          },
        },
        isPartOf: {
          '@type': 'WebSite',
          name: 'Stakeados',
          url: baseUrl,
        },
      }
    : null;

  // Breadcrumb structured data
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'en' ? 'Home' : 'Inicio',
        item: `${baseUrl}/${locale}`,
      },
    ],
  };

  // FAQ structured data for common questions
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: locale === 'en' ? 'What is Stakeados?' : '¿Qué es Stakeados?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'en'
              ? 'Stakeados is a decentralized learning platform focused on blockchain education, offering articles, news, and courses about Web3 technology.'
              : 'Stakeados es una plataforma de aprendizaje descentralizada enfocada en educación blockchain, ofreciendo artículos, noticias y cursos sobre tecnología Web3.',
        },
      },
      {
        '@type': 'Question',
        name:
          locale === 'en'
            ? 'Are the courses free?'
            : '¿Los cursos son gratuitos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'en'
              ? 'Yes, all courses on Stakeados are free and accessible to everyone interested in learning about blockchain technology.'
              : 'Sí, todos los cursos en Stakeados son gratuitos y accesibles para todos los interesados en aprender sobre tecnología blockchain.',
        },
      },
      {
        '@type': 'Question',
        name:
          locale === 'en' ? 'Do I get certificates?' : '¿Obtengo certificados?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'en'
              ? 'Yes, upon completion of courses, you receive NFT-based certificates that are stored on the blockchain.'
              : 'Sí, al completar los cursos, recibes certificados basados en NFT que se almacenan en la blockchain.',
        },
      },
    ],
  };

  const allStructuredData = [
    organizationData,
    websiteData,
    courseCatalogData,
    articleCollectionData,
    newsCollectionData,
    breadcrumbData,
    faqData,
  ].filter(Boolean);

  return (
    <>
      {allStructuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data),
          }}
        />
      ))}
    </>
  );
}
