import Head from 'next/head';
import { useCanonicalUrl } from '@/hooks/useCanonicalUrl';
import { BreadcrumbStructuredData } from './LocalizedBreadcrumbs';

interface LocalizedSEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  params?: Record<string, string | string[]>;
  children?: React.ReactNode;
}

export default function LocalizedSEO({
  title,
  description,
  keywords = [],
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  noIndex = false,
  params,
  children,
}: LocalizedSEOProps) {
  const { canonical, alternates, hreflang } = useCanonicalUrl({
    params,
    includeSearchParams: true,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const defaultImage = image || `${baseUrl}/og-default.jpg`;
  const robotsContent = noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
        {keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}
        <meta name="robots" content={robotsContent} />

        {/* Canonical URL */}
        <link rel="canonical" href={canonical} />

        {/* Alternate Language URLs */}
        {Object.entries(alternates).map(([locale, url]) => (
          <link key={locale} rel="alternate" hrefLang={locale} href={url} />
        ))}

        {/* Hreflang URLs */}
        {Object.entries(hreflang).map(([hreflang, url]) => (
          <link key={hreflang} rel="alternate" hrefLang={hreflang} href={url} />
        ))}

        {/* Open Graph Meta Tags */}
        {title && <meta property="og:title" content={title} />}
        {description && (
          <meta property="og:description" content={description} />
        )}
        <meta property="og:image" content={defaultImage} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content={type} />
        <meta property="og:site_name" content="Stakeados" />

        {publishedTime && (
          <meta property="article:published_time" content={publishedTime} />
        )}

        {modifiedTime && (
          <meta property="article:modified_time" content={modifiedTime} />
        )}

        {author && <meta property="article:author" content={author} />}
        {section && <meta property="article:section" content={section} />}

        {tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card Meta Tags */}
        {title && <meta name="twitter:title" content={title} />}
        {description && (
          <meta name="twitter:description" content={description} />
        )}
        <meta name="twitter:image" content={defaultImage} />
        <meta name="twitter:card" content="summary_large_image" />

        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />

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

      {/* Breadcrumb Structured Data */}
      <BreadcrumbStructuredData params={params} />
    </>
  );
}

// Simplified version for basic pages
export function BasicLocalizedSEO({
  title,
  description,
  noIndex = false,
}: {
  title: string;
  description: string;
  noIndex?: boolean;
}) {
  return (
    <LocalizedSEO
      title={`${title} | Stakeados`}
      description={description}
      noIndex={noIndex}
    />
  );
}

// Article-specific SEO
export function ArticleLocalizedSEO({
  title,
  description,
  author,
  publishedTime,
  modifiedTime,
  tags = [],
  image,
  params,
}: {
  title: string;
  description: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  image?: string;
  params?: Record<string, string | string[]>;
}) {
  return (
    <LocalizedSEO
      title={`${title} | Stakeados`}
      description={description}
      type="article"
      author={author}
      publishedTime={publishedTime}
      modifiedTime={modifiedTime}
      tags={tags}
      image={image}
      params={params}
    />
  );
}

// News-specific SEO
export function NewsLocalizedSEO({
  title,
  description,
  publishedTime,
  image,
  keywords = [],
  params,
}: {
  title: string;
  description: string;
  publishedTime?: string;
  image?: string;
  keywords?: string[];
  params?: Record<string, string | string[]>;
}) {
  return (
    <LocalizedSEO
      title={`${title} | Stakeados News`}
      description={description}
      type="article"
      publishedTime={publishedTime}
      image={image}
      keywords={keywords}
      section="News"
      params={params}
    />
  );
}
