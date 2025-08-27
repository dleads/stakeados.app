import {
  Locale,
  LocalizedContent,
  Article,
  NewsArticle,
} from '@/types/content';

export interface SEOMetadata {
  title: LocalizedContent;
  description: LocalizedContent;
  keywords: string[];
  canonicalUrl: string;
  alternateUrls: Record<Locale, string>;
  openGraph: {
    title: LocalizedContent;
    description: LocalizedContent;
    image: string;
    type: 'article' | 'website';
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: LocalizedContent;
    description: LocalizedContent;
    image: string;
    creator?: string;
  };
  jsonLd: object;
  robots: string;
  hreflang: Record<Locale, string>;
}

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority: number;
  alternateUrls: Record<Locale, string>;
}

class SEOService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Generate SEO metadata for articles
   */
  generateArticleSEO(article: Article, locale: Locale): SEOMetadata {
    const articlePath = locale === 'es' ? 'articulos' : 'articles';
    const slug = this.generateSlug(article.title[locale]);
    const canonicalUrl = `${this.baseUrl}/${locale}/${articlePath}/${slug}`;

    const alternateUrls = {
      en: `${this.baseUrl}/en/articles/${this.generateSlug(article.title.en)}`,
      es: `${this.baseUrl}/es/articulos/${this.generateSlug(article.title.es)}`,
    };

    const hreflang = {
      en: alternateUrls.en,
      es: alternateUrls.es,
    };

    // Generate optimized meta descriptions if not provided
    const optimizedDescription = {
      en:
        article.meta_description.en ||
        this.generateMetaDescription(article.content.en, 'en'),
      es:
        article.meta_description.es ||
        this.generateMetaDescription(article.content.es, 'es'),
    };

    const featuredImage =
      article.featured_image_url || `${this.baseUrl}/og-article-default.jpg`;

    return {
      title: {
        en: `${article.title.en} | Stakeados`,
        es: `${article.title.es} | Stakeados`,
      },
      description: optimizedDescription,
      keywords: article.tags,
      canonicalUrl,
      alternateUrls,
      hreflang,
      openGraph: {
        title: article.title,
        description: optimizedDescription,
        image: featuredImage,
        type: 'article',
        publishedTime: article.published_at,
        modifiedTime: article.updated_at,
        section: article.category,
        tags: article.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: optimizedDescription,
        image: featuredImage,
      },
      jsonLd: this.generateArticleJsonLd(article, locale, canonicalUrl),
      robots:
        'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    };
  }

  /**
   * Generate SEO metadata for news articles
   */
  generateNewsSEO(news: NewsArticle, locale: Locale): SEOMetadata {
    const newsPath = locale === 'es' ? 'noticias' : 'news';
    const slug = this.generateSlug(news.title[locale]);
    const canonicalUrl = `${this.baseUrl}/${locale}/${newsPath}/${slug}`;

    const alternateUrls = {
      en: `${this.baseUrl}/en/news/${this.generateSlug(news.title.en)}`,
      es: `${this.baseUrl}/es/noticias/${this.generateSlug(news.title.es)}`,
    };

    const hreflang = {
      en: alternateUrls.en,
      es: alternateUrls.es,
    };

    const featuredImage =
      news.image_url || `${this.baseUrl}/og-news-default.jpg`;

    return {
      title: {
        en: `${news.title.en} | Stakeados News`,
        es: `${news.title.es} | Noticias Stakeados`,
      },
      description: news.summary,
      keywords: news.keywords,
      canonicalUrl,
      alternateUrls,
      hreflang,
      openGraph: {
        title: news.title,
        description: news.summary,
        image: featuredImage,
        type: 'article',
        publishedTime: news.published_at,
        section: news.categories[0] || 'News',
      },
      twitter: {
        card: 'summary_large_image',
        title: news.title,
        description: news.summary,
        image: featuredImage,
      },
      jsonLd: this.generateNewsJsonLd(news, locale, canonicalUrl),
      robots:
        'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    };
  }

  /**
   * Generate Article JSON-LD structured data
   */
  private generateArticleJsonLd(
    article: Article,
    locale: Locale,
    url: string
  ): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title[locale],
      description: article.meta_description[locale],
      image:
        article.featured_image_url || `${this.baseUrl}/og-article-default.jpg`,
      url: url,
      datePublished: article.published_at,
      dateModified: article.updated_at,
      author: {
        '@type': 'Person',
        name: 'Stakeados Team', // This should be dynamic based on actual author
      },
      publisher: {
        '@type': 'Organization',
        name: 'Stakeados',
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      articleSection: article.category,
      keywords: article.tags.join(', '),
      wordCount: this.estimateWordCount(article.content[locale]),
      timeRequired: `PT${article.reading_time || 5}M`,
      inLanguage: locale,
      isAccessibleForFree: true,
      creativeWorkStatus: 'Published',
    };
  }

  /**
   * Generate News JSON-LD structured data
   */
  private generateNewsJsonLd(
    news: NewsArticle,
    locale: Locale,
    url: string
  ): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: news.title[locale],
      description: news.summary[locale],
      image: news.image_url || `${this.baseUrl}/og-news-default.jpg`,
      url: url,
      datePublished: news.published_at,
      dateModified: news.created_at,
      author: {
        '@type': 'Person',
        name: news.author_name || 'Stakeados News Team',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Stakeados',
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      articleSection: news.categories[0] || 'News',
      keywords: news.keywords.join(', '),
      inLanguage: locale,
      isAccessibleForFree: true,
      dateline: news.source_name,
      sourceOrganization: {
        '@type': 'Organization',
        name: news.source_name,
      },
    };
  }

  /**
   * Generate sitemap entries for articles
   */
  async generateArticleSitemapEntries(): Promise<SitemapEntry[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/articles?status=published&limit=1000`
      );
      const articles: Article[] = await response.json();

      return articles.map(article => ({
        url: `${this.baseUrl}/en/articles/${this.generateSlug(article.title.en)}`,
        lastModified: article.updated_at,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternateUrls: {
          en: `${this.baseUrl}/en/articles/${this.generateSlug(article.title.en)}`,
          es: `${this.baseUrl}/es/articulos/${this.generateSlug(article.title.es)}`,
        },
      }));
    } catch (error) {
      console.error('Error generating article sitemap entries:', error);
      return [];
    }
  }

  /**
   * Generate sitemap entries for news
   */
  async generateNewsSitemapEntries(): Promise<SitemapEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/news?limit=1000`);
      const news: NewsArticle[] = await response.json();

      return news.map(item => ({
        url: `${this.baseUrl}/en/news/${this.generateSlug(item.title.en)}`,
        lastModified: item.created_at,
        changeFrequency: 'daily' as const,
        priority: 0.6,
        alternateUrls: {
          en: `${this.baseUrl}/en/news/${this.generateSlug(item.title.en)}`,
          es: `${this.baseUrl}/es/noticias/${this.generateSlug(item.title.es)}`,
        },
      }));
    } catch (error) {
      console.error('Error generating news sitemap entries:', error);
      return [];
    }
  }

  /**
   * Generate complete sitemap XML
   */
  async generateSitemap(): Promise<string> {
    const staticPages = [
      {
        url: `${this.baseUrl}/en`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
        alternateUrls: {
          en: `${this.baseUrl}/en`,
          es: `${this.baseUrl}/es`,
        },
      },
      {
        url: `${this.baseUrl}/es`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
        alternateUrls: {
          en: `${this.baseUrl}/en`,
          es: `${this.baseUrl}/es`,
        },
      },
      {
        url: `${this.baseUrl}/en/articles`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
        alternateUrls: {
          en: `${this.baseUrl}/en/articles`,
          es: `${this.baseUrl}/es/articulos`,
        },
      },
      {
        url: `${this.baseUrl}/es/articulos`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
        alternateUrls: {
          en: `${this.baseUrl}/en/articles`,
          es: `${this.baseUrl}/es/articulos`,
        },
      },
      {
        url: `${this.baseUrl}/en/news`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
        alternateUrls: {
          en: `${this.baseUrl}/en/news`,
          es: `${this.baseUrl}/es/noticias`,
        },
      },
      {
        url: `${this.baseUrl}/es/noticias`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
        alternateUrls: {
          en: `${this.baseUrl}/en/news`,
          es: `${this.baseUrl}/es/noticias`,
        },
      },
    ];

    const [articleEntries, newsEntries] = await Promise.all([
      this.generateArticleSitemapEntries(),
      this.generateNewsSitemapEntries(),
    ]);

    const allEntries = [...staticPages, ...articleEntries, ...newsEntries];

    return this.generateSitemapXML(allEntries);
  }

  /**
   * Generate sitemap XML from entries
   */
  private generateSitemapXML(entries: SitemapEntry[]): string {
    const urlElements = entries
      .map(entry => {
        const alternateLinks = Object.entries(entry.alternateUrls)
          .map(
            ([locale, url]) =>
              `    <xhtml:link rel="alternate" hreflang="${locale}" href="${url}" />`
          )
          .join('\n');

        return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
${alternateLinks}
  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`;
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /dashboard/

# Allow specific paths
Allow: /api/og/

# Crawl delay
Crawl-delay: 1`;
  }

  /**
   * Generate meta description from content
   */
  private generateMetaDescription(content: string, _locale: Locale): string {
    if (!content) return '';

    // Remove markdown and HTML tags
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Take first 150 characters and ensure it ends at a word boundary
    let description = cleanContent.substring(0, 150);
    const lastSpaceIndex = description.lastIndexOf(' ');

    if (lastSpaceIndex > 100) {
      description = description.substring(0, lastSpaceIndex);
    }

    return (
      description + (description.length < cleanContent.length ? '...' : '')
    );
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    if (!title) return 'untitled';

    return title
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 60); // Limit length
  }

  /**
   * Estimate word count from content
   */
  private estimateWordCount(content: string): number {
    if (!content) return 0;

    const cleanContent = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return cleanContent.split(' ').filter(word => word.length > 0).length;
  }

  /**
   * Validate and optimize SEO metadata
   */
  validateSEOMetadata(
    metadata: SEOMetadata,
    locale: Locale
  ): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Title validation
    const title = metadata.title[locale];
    if (!title) {
      warnings.push('Title is missing');
    } else {
      if (title.length < 30) {
        suggestions.push(
          'Title is quite short, consider making it more descriptive'
        );
      }
      if (title.length > 60) {
        warnings.push('Title is too long (over 60 characters)');
      }
    }

    // Description validation
    const description = metadata.description[locale];
    if (!description) {
      warnings.push('Meta description is missing');
    } else {
      if (description.length < 120) {
        suggestions.push('Meta description could be longer for better SEO');
      }
      if (description.length > 160) {
        warnings.push('Meta description is too long (over 160 characters)');
      }
    }

    // Keywords validation
    if (metadata.keywords.length === 0) {
      suggestions.push('Consider adding relevant keywords');
    } else if (metadata.keywords.length > 10) {
      suggestions.push('Too many keywords might dilute SEO effectiveness');
    }

    // Image validation
    if (!metadata.openGraph.image) {
      warnings.push('Open Graph image is missing');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
    };
  }
}

export const seoService = new SEOService();
export default seoService;
