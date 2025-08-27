import { RSSFeedItem } from './newsProcessor';

// RSS feed sources for crypto news
export const RSS_FEEDS = [
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'General',
    priority: 'high' as const,
  },
  {
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'General',
    priority: 'high' as const,
  },
  {
    name: 'The Block',
    url: 'https://www.theblock.co/rss.xml',
    category: 'General',
    priority: 'high' as const,
  },
  {
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    category: 'General',
    priority: 'medium' as const,
  },
  {
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com/.rss/full/',
    category: 'Bitcoin',
    priority: 'medium' as const,
  },
  {
    name: 'Ethereum Foundation Blog',
    url: 'https://blog.ethereum.org/feed.xml',
    category: 'Ethereum',
    priority: 'high' as const,
  },
  {
    name: 'DeFi Pulse',
    url: 'https://defipulse.com/blog/feed/',
    category: 'DeFi',
    priority: 'medium' as const,
  },
  {
    name: 'NFT Now',
    url: 'https://nftnow.com/feed/',
    category: 'NFTs',
    priority: 'low' as const,
  },
] as const;

// Interface for RSS feed configuration
export interface RSSFeedConfig {
  name: string;
  url: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
  lastFetched?: Date;
  errorCount: number;
}

/**
 * Parse RSS feed XML (simplified implementation)
 * In production, you'd use a proper RSS parser library
 */
export async function parseRSSFeed(
  feedUrl: string,
  sourceName: string
): Promise<RSSFeedItem[]> {
  try {
    // Note: This is a simplified implementation
    // In production, you'd use a library like 'rss-parser' or similar
    // For now, we'll return mock data to demonstrate the structure

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Stakeados News Aggregator 1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();

    // This is a very basic XML parsing - in production use a proper library
    const items = extractRSSItems(xmlText, sourceName);

    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    return [];
  }
}

/**
 * Extract RSS items from XML (basic implementation)
 */
function extractRSSItems(xmlText: string, sourceName: string): RSSFeedItem[] {
  const items: RSSFeedItem[] = [];

  try {
    // Basic regex-based extraction (use proper XML parser in production)
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of itemMatches.slice(0, 10)) {
      // Limit to 10 items
      const title = extractXMLContent(itemXml, 'title');
      const description = extractXMLContent(itemXml, 'description');
      const link = extractXMLContent(itemXml, 'link');
      const pubDate = extractXMLContent(itemXml, 'pubDate');

      if (title && description && link) {
        items.push({
          title: cleanHTMLContent(title),
          content: cleanHTMLContent(description),
          sourceUrl: link,
          sourceName,
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
        });
      }
    }
  } catch (error) {
    console.error('Error extracting RSS items:', error);
  }

  return items;
}

/**
 * Extract content from XML tag
 */
function extractXMLContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Clean HTML content
 */
function cleanHTMLContent(html: string): string {
  return html
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Fetch all RSS feeds
 */
export async function fetchAllRSSFeeds(): Promise<{
  items: RSSFeedItem[];
  feedResults: Array<{
    feedName: string;
    itemCount: number;
    success: boolean;
    error?: string;
  }>;
}> {
  const allItems: RSSFeedItem[] = [];
  const feedResults: Array<{
    feedName: string;
    itemCount: number;
    success: boolean;
    error?: string;
  }> = [];

  // Fetch feeds in parallel with limited concurrency
  const concurrencyLimit = 3;
  for (let i = 0; i < RSS_FEEDS.length; i += concurrencyLimit) {
    const batch = RSS_FEEDS.slice(i, i + concurrencyLimit);

    const batchPromises = batch.map(async feed => {
      try {
        const items = await parseRSSFeed(feed.url, feed.name);
        allItems.push(...items);

        feedResults.push({
          feedName: feed.name,
          itemCount: items.length,
          success: true,
        });
      } catch (error) {
        console.error(`Error fetching feed ${feed.name}:`, error);
        feedResults.push({
          feedName: feed.name,
          itemCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    await Promise.all(batchPromises);

    // Add delay between batches
    if (i + concurrencyLimit < RSS_FEEDS.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Remove duplicates based on URL
  const uniqueItems = allItems.filter(
    (item, index, self) =>
      index === self.findIndex(other => other.sourceUrl === item.sourceUrl)
  );

  // Sort by publication date (newest first)
  uniqueItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return {
    items: uniqueItems,
    feedResults,
  };
}

/**
 * Get feed health status
 */
export async function getFeedHealthStatus(): Promise<
  Array<{
    feedName: string;
    status: 'healthy' | 'warning' | 'error';
    lastSuccessfulFetch?: Date;
    errorCount: number;
    avgItemsPerFetch: number;
  }>
> {
  // This would typically be stored in a database
  // For now, return mock data
  return RSS_FEEDS.map(feed => ({
    feedName: feed.name,
    status: 'healthy' as const,
    lastSuccessfulFetch: new Date(),
    errorCount: 0,
    avgItemsPerFetch: Math.floor(Math.random() * 10) + 5,
  }));
}

/**
 * Test RSS feed connectivity
 */
export async function testRSSFeedConnectivity(feedUrl: string): Promise<{
  success: boolean;
  responseTime: number;
  itemCount: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Stakeados News Aggregator 1.0',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        responseTime,
        itemCount: 0,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const xmlText = await response.text();
    const itemCount = (xmlText.match(/<item[^>]*>/gi) || []).length;

    return {
      success: true,
      responseTime,
      itemCount,
    };
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      itemCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
