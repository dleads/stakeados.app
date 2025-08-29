import { createClient } from '@/lib/supabase/server';
import { newsSourceServiceServer } from './newsSourceService.server';
import type { NewsSource, RawNewsArticle } from '@/types/news';
import { XMLParser } from 'fast-xml-parser';

export class NewsFetchingService {
  private async db() {
    return await createClient();
  }

  // Fetch news from RSS feeds
  async fetchFromRSS(source: NewsSource): Promise<RawNewsArticle[]> {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Stakeados News Aggregator 1.0',
          ...source.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const articles = await this.parseRSSFeed(xmlText, source);

      return articles;
    } catch (error) {
      throw new Error(
        `Failed to fetch RSS from ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Parse RSS/XML feed
  private async parseRSSFeed(
    xmlText: string,
    source: NewsSource
  ): Promise<RawNewsArticle[]> {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        trimValues: true,
      });
      const doc = parser.parse(xmlText);

      // Support RSS 2.0 (rss.channel.item) and Atom (feed.entry)
      const rssItems = doc?.rss?.channel?.item;
      const atomEntries = doc?.feed?.entry;
      const items: any[] = Array.isArray(rssItems)
        ? rssItems
        : rssItems
        ? [rssItems]
        : Array.isArray(atomEntries)
        ? atomEntries
        : atomEntries
        ? [atomEntries]
        : [];

      const articles: RawNewsArticle[] = [];
      for (const item of items) {
        try {
          const title: string | undefined = item.title?.['#text'] || item.title;
          const link: string | undefined =
            typeof item.link === 'string'
              ? item.link
              : item.link?.href || item.link?.url;
          const description: string | undefined =
            item.description || item.summary || item.content || item['content:encoded'];
          const pubDate: string | undefined =
            item.pubDate || item.published || item.updated;
          const author:
            | string
            | undefined = item.author?.name || item.author || item['dc:creator'];

          // Try image candidates (media:content, media:thumbnail, enclosure, etc.)
          const imageUrl: string | undefined =
            item?.['media:content']?.url ||
            item?.['media:thumbnail']?.url ||
            (typeof item.enclosure === 'object' ? item.enclosure?.url : undefined);

          if (title && (link || item.id)) {
            const finalLink = (link || item.id) as string;
            articles.push({
              title: title.trim(),
              content: (description || '').trim(),
              summary: this.extractSummary(description || ''),
              url: finalLink.trim(),
              published_at: pubDate ? new Date(pubDate) : new Date(),
              author: author?.trim(),
              image_url: imageUrl,
              source_id: source.id,
              metadata: {
                raw_item: item,
                source_categories: source.categories,
              },
            });
          }
        } catch (itemError) {
          console.warn('Failed to parse RSS/Atom item:', itemError);
        }
      }

      return articles;
    } catch (error) {
      throw new Error(
        `Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Helper to get text content from XML elements
  private getTextContent(item: Element, selectors: string): string | null {
    const selectorList = selectors.split(',').map(s => s.trim());

    for (const selector of selectorList) {
      const element = item.querySelector(selector);
      if (element) {
        return element.textContent || element.innerHTML;
      }
    }

    return null;
  }

  // Helper to get attribute content from XML elements
  private getAttributeContent(
    item: Element,
    selector: string,
    attribute: string
  ): string | null {
    const element = item.querySelector(selector);
    return element?.getAttribute(attribute) || null;
  }

  // Extract image URL from various possible locations in RSS item
  private getImageUrl(item: Element): string | null {
    // Try different image sources
    const imageSources = [
      'media\\:thumbnail',
      'media\\:content[medium="image"]',
      'enclosure[type^="image"]',
      'image',
      'media\\:group media\\:content[type^="image"]',
    ];

    for (const source of imageSources) {
      const element = item.querySelector(source);
      if (element) {
        const url =
          element.getAttribute('url') ||
          element.getAttribute('href') ||
          element.textContent;
        if (url) return url.trim();
      }
    }

    // Try to extract image from description/content
    const description = this.getTextContent(item, 'description, content');
    if (description) {
      const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) return imgMatch[1];
    }

    return null;
  }

  // Extract summary from content
  private extractSummary(content: string, maxLength: number = 200): string {
    // Remove HTML tags
    const textContent = content.replace(/<[^>]*>/g, '').trim();

    if (textContent.length <= maxLength) {
      return textContent;
    }

    // Find the last complete sentence within the limit
    const truncated = textContent.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');

    if (lastSentence > maxLength * 0.7) {
      return truncated.substring(0, lastSentence + 1);
    }

    // If no good sentence break, just truncate at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  // Fetch news from API sources
  async fetchFromAPI(source: NewsSource): Promise<RawNewsArticle[]> {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Stakeados News Aggregator 1.0',
        'Content-Type': 'application/json',
        ...source.headers,
      };

      if (source.api_key) {
        headers['Authorization'] = `Bearer ${source.api_key}`;
      }

      const response = await fetch(source.api_endpoint || source.url, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAPIResponse(data, source);
    } catch (error) {
      throw new Error(
        `Failed to fetch from API ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Parse API response (generic structure)
  private parseAPIResponse(data: any, source: NewsSource): RawNewsArticle[] {
    const articles: RawNewsArticle[] = [];

    // Handle different API response structures
    let items: any[] = [];

    if (Array.isArray(data)) {
      items = data;
    } else if (data.articles && Array.isArray(data.articles)) {
      items = data.articles;
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.results && Array.isArray(data.results)) {
      items = data.results;
    }

    items.forEach(item => {
      try {
        const title = item.title || item.headline || item.name;
        const url = item.url || item.link || item.permalink;
        const content =
          item.content || item.description || item.summary || item.body;
        const publishedAt =
          item.published_at || item.publishedAt || item.date || item.created_at;
        const author = item.author || item.writer || item.byline;
        const imageUrl =
          item.image || item.image_url || item.thumbnail || item.featured_image;

        if (title && url) {
          articles.push({
            title: title.trim(),
            content: content?.trim() || '',
            summary: this.extractSummary(content || ''),
            url: url.trim(),
            published_at: publishedAt ? new Date(publishedAt) : new Date(),
            author: author?.trim(),
            image_url: imageUrl?.trim(),
            source_id: source.id,
            metadata: {
              raw_item: item,
              source_categories: source.categories,
            },
          });
        }
      } catch (itemError) {
        console.warn('Failed to parse API item:', itemError);
      }
    });

    return articles;
  }

  // Main method to fetch news from a source
  async fetchNewsFromSource(source: NewsSource): Promise<RawNewsArticle[]> {
    const startTime = Date.now();
    let articles: RawNewsArticle[] = [];
    let error: Error | null = null;

    try {
      switch (source.source_type) {
        case 'rss':
          articles = await this.fetchFromRSS(source);
          break;
        case 'api':
          articles = await this.fetchFromAPI(source);
          break;
        case 'scraper':
          // For now, scraper is not implemented
          throw new Error('Scraper sources are not yet implemented');
        default:
          throw new Error(`Unsupported source type: ${source.source_type}`);
      }

      // Record successful health check
      await newsSourceServiceServer.updateSourceHealth(
        source.id,
        'healthy',
        Date.now() - startTime,
        articles.length
      );
    } catch (fetchError) {
      error =
        fetchError instanceof Error ? fetchError : new Error('Unknown error');

      // Record failed health check
      await newsSourceServiceServer.updateSourceHealth(
        source.id,
        'error',
        Date.now() - startTime,
        0,
        error.message
      );

      throw error;
    }

    return articles;
  }

  // Fetch news from all ready sources
  async fetchNewsFromAllSources(): Promise<{
    totalArticles: number;
    successfulSources: number;
    failedSources: number;
    errors: Array<{ sourceId: string; sourceName: string; error: string }>;
  }> {
    const sources = await newsSourceServiceServer.getSourcesReadyForFetch();
    const results = {
      totalArticles: 0,
      successfulSources: 0,
      failedSources: 0,
      errors: [] as Array<{
        sourceId: string;
        sourceName: string;
        error: string;
      }>,
    };

    // Process sources in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = [];
    for (let i = 0; i < sources.length; i += concurrencyLimit) {
      chunks.push(sources.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async source => {
        try {
          const articles = await this.fetchNewsFromSource(source);

          // Store articles in database
          if (articles.length > 0) {
            await this.storeRawArticles(articles);
          }

          results.totalArticles += articles.length;
          results.successfulSources++;

          return { success: true, source, articles };
        } catch (error) {
          results.failedSources++;
          results.errors.push({
            sourceId: source.id,
            sourceName: source.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          return { success: false, source, error };
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  // Store raw articles in database (temporary storage before AI processing)
  private async storeRawArticles(articles: RawNewsArticle[]): Promise<void> {
    // For now, we'll store them in a simple table
    // In a production system, you might want to use a queue system like Redis
    const supabase = await this.db();
    const { error } = await supabase
      .from('raw_news_articles' as any)
      .insert(
        articles.map(article => ({
          title: article.title,
          content: article.content,
          summary: article.summary,
          url: article.url,
          published_at: article.published_at.toISOString(),
          author: article.author,
          image_url: article.image_url,
          source_id: article.source_id,
          metadata: article.metadata,
          created_at: new Date().toISOString(),
        })) as any
      );

    if (error) {
      console.error('Failed to store raw articles:', error);
      throw new Error(`Failed to store articles: ${error.message}`);
    }
  }

  // Deduplication service
  async deduplicateArticles(
    articles: RawNewsArticle[]
  ): Promise<RawNewsArticle[]> {
    if (articles.length === 0) return articles;

    const uniqueArticles: RawNewsArticle[] = [];
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();

    // Sort by published date (newest first) to prefer newer articles
    const sortedArticles = [...articles].sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    for (const article of sortedArticles) {
      const normalizedUrl = this.normalizeUrl(article.url);
      const normalizedTitle = this.normalizeTitle(article.title);

      // Skip if we've seen this URL or very similar title
      if (seenUrls.has(normalizedUrl)) {
        continue;
      }

      // Check for similar titles (fuzzy matching)
      let isDuplicate = false;
      for (const seenTitle of seenTitles) {
        if (this.calculateSimilarity(normalizedTitle, seenTitle) > 0.85) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        uniqueArticles.push(article);
        seenUrls.add(normalizedUrl);
        seenTitles.add(normalizedTitle);
      }
    }

    return uniqueArticles;
  }

  // Normalize URL for comparison
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove tracking parameters and fragments
      const paramsToRemove = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'ref',
        'source',
      ];
      paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
      urlObj.hash = '';
      return urlObj.toString().toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  // Normalize title for comparison
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Calculate similarity between two strings (Jaccard similarity)
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  // Content validation and quality checks
  async validateArticleQuality(article: RawNewsArticle): Promise<{
    isValid: boolean;
    score: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    let score = 100;

    // Check title length
    if (article.title.length < 10) {
      issues.push('Title too short');
      score -= 20;
    } else if (article.title.length > 200) {
      issues.push('Title too long');
      score -= 10;
    }

    // Check content length
    if (article.content.length < 50) {
      issues.push('Content too short');
      score -= 30;
    }

    // Check for spam indicators
    const spamKeywords = [
      'click here',
      'buy now',
      'limited time',
      'act fast',
      'guaranteed',
    ];
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();

    for (const keyword of spamKeywords) {
      if (titleLower.includes(keyword) || contentLower.includes(keyword)) {
        issues.push(`Contains spam keyword: ${keyword}`);
        score -= 15;
      }
    }

    // Check URL validity
    try {
      new URL(article.url);
    } catch {
      issues.push('Invalid URL');
      score -= 25;
    }

    // Check published date (not too old, not in future)
    const now = new Date();
    const publishedAt = new Date(article.published_at);
    const daysDiff =
      (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 30) {
      issues.push('Article too old');
      score -= 10;
    } else if (daysDiff < -1) {
      issues.push('Article published in future');
      score -= 20;
    }

    return {
      isValid: score >= 50,
      score: Math.max(0, score),
      issues,
    };
  }
}

export const newsFetchingService = new NewsFetchingService();
