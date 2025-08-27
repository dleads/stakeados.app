import Head from 'next/head';
import { useLocale } from 'next-intl';
import { SEOMetadata } from '@/lib/services/seoService';
import type { Locale } from '@/types/content';

interface SEOMetadataProps {
  metadata: SEOMetadata;
  children?: React.ReactNode;
}

export default function SEOMetadataComponent({
  metadata,
  children,
}: SEOMetadataProps) {
  const locale = useLocale() as Locale;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{metadata.title[locale]}</title>
      <meta name="description" content={metadata.description[locale]} />
      <meta name="keywords" content={metadata.keywords.join(', ')} />
      <meta name="robots" content={metadata.robots} />

      {/* Canonical URL */}
      <link rel="canonical" href={metadata.canonicalUrl} />

      {/* Alternate Language URLs */}
      {Object.entries(metadata.hreflang).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={metadata.openGraph.title[locale]} />
      <meta
        property="og:description"
        content={metadata.openGraph.description[locale]}
      />
      <meta property="og:image" content={metadata.openGraph.image} />
      <meta property="og:url" content={metadata.canonicalUrl} />
      <meta property="og:type" content={metadata.openGraph.type} />
      <meta
        property="og:locale"
        content={locale === 'es' ? 'es_ES' : 'en_US'}
      />
      <meta property="og:site_name" content="Stakeados" />

      {metadata.openGraph.publishedTime && (
        <meta
          property="article:published_time"
          content={metadata.openGraph.publishedTime}
        />
      )}

      {metadata.openGraph.modifiedTime && (
        <meta
          property="article:modified_time"
          content={metadata.openGraph.modifiedTime}
        />
      )}

      {metadata.openGraph.author && (
        <meta property="article:author" content={metadata.openGraph.author} />
      )}

      {metadata.openGraph.section && (
        <meta property="article:section" content={metadata.openGraph.section} />
      )}

      {metadata.openGraph.tags?.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={metadata.twitter.card} />
      <meta name="twitter:title" content={metadata.twitter.title[locale]} />
      <meta
        name="twitter:description"
        content={metadata.twitter.description[locale]}
      />
      <meta name="twitter:image" content={metadata.twitter.image} />

      {metadata.twitter.creator && (
        <meta name="twitter:creator" content={metadata.twitter.creator} />
      )}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(metadata.jsonLd),
        }}
      />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content={locale} />

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

      {children}
    </Head>
  );
}

// Hook for generating SEO metadata
export function useSEOMetadata() {
  const locale = useLocale() as Locale;

  const generatePageSEO = (
    title: string,
    description: string,
    path: string,
    options?: {
      keywords?: string[];
      image?: string;
      type?: 'website' | 'article';
      noIndex?: boolean;
    }
  ): SEOMetadata => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const canonicalUrl = `${baseUrl}${path}`;

    const localizedTitle = {
      en: title,
      es: title,
    };

    const localizedDescription = {
      en: description,
      es: description,
    };

    return {
      title: localizedTitle,
      description: localizedDescription,
      keywords: options?.keywords || [],
      canonicalUrl,
      alternateUrls: {
        en: canonicalUrl.replace(`/${locale}/`, '/en/'),
        es: canonicalUrl.replace(`/${locale}/`, '/es/'),
      },
      hreflang: {
        en: canonicalUrl.replace(`/${locale}/`, '/en/'),
        es: canonicalUrl.replace(`/${locale}/`, '/es/'),
      },
      openGraph: {
        title: localizedTitle,
        description: localizedDescription,
        image: options?.image || `${baseUrl}/og-default.jpg`,
        type: options?.type || 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: localizedTitle,
        description: localizedDescription,
        image: options?.image || `${baseUrl}/og-default.jpg`,
      },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description: description,
        url: canonicalUrl,
        inLanguage: locale,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Stakeados',
          url: baseUrl,
        },
      },
      robots: options?.noIndex ? 'noindex, nofollow' : 'index, follow',
    };
  };

  return { generatePageSEO, locale };
}
