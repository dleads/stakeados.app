import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for manual fetch request
const fetchRequestSchema = z.object({
  source_ids: z.array(z.string().uuid()).optional(), // If not provided, fetch from all active sources
  force: z.boolean().default(false), // Force fetch even if recently fetched
  max_articles: z.number().min(1).max(100).default(20), // Limit articles per source
});

async function checkAdminPermissions(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return false;
  }
  return true;
}

// TODO: Implement RSS feed parsing when news_sources table is available
// async function parseRSSFeed(content: string, maxArticles: number = 20) {
//   const articles = []
//
//   try {
//     // Basic RSS/Atom parsing - in a real implementation, you'd use a proper XML parser
//     const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/g
//     let match
//     let count = 0
//
//     while ((match = itemRegex.exec(content)) !== null && count < maxArticles) {
//       const itemContent = match[1]
//
//       // Extract title
//       const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/)
//       const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim() : null
//
//       // Extract description/content
//       const descMatch = itemContent.match(/<description[^>]*>([\s\S]*?)<\/description>|<content[^>]*>([\s\S]*?)<\/content>|<summary[^>]*>([\s\S]*?)<\/summary>/)
//       const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim() : null
//
//       // Extract link
//       const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>|<link[^>]*href=["'](.*?)["']/)
//       const link = linkMatch ? (linkMatch[1] || linkMatch[2]).trim() : null
//
//       // Extract publication date
//       const dateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>|<published[^>]*>([\s\S]*?)<\/published>|<updated[^>]*>([\s\S]*?)<\/updated>/)
//       const pubDate = dateMatch ? dateMatch[1].trim() : null
//
//       if (title && (description || link)) {
//         articles.push({
//           title: title.substring(0, 500), // Limit title length
//           content: description ? description.substring(0, 2000) : '', // Limit content length
//           summary: description ? description.substring(0, 300) : '', // Limit content length
//           source_url: link,
//           published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
//         })
//         count++
//       }
//     }
//   } catch (error) {
//     console.error('Error parsing RSS feed:', error)
//   }
//
//   return articles
// }

// TODO: Implement RSS source fetching when news_sources table is available
// async function fetchFromRSSSource(source: any, maxArticles: number = 20) {
//   const startTime = Date.now()
//
//   try {
//     const response = await fetch(source.url, {
//       method: 'GET',
//       headers: {
//         'User-Agent': 'Stakeados News Aggregator/1.0',
//         'Accept': 'application/rss+xml, application/xml, text/xml',
//         ...(source.headers || {})
//       },
//       // timeout: 15000 // 15 second timeout for fetching - not supported in fetch
//     })

//     const responseTime = Date.now() - startTime

//     if (!response.ok) {
//       return {
//         success: false,
//         source_id: source.id,
//         source_name: source.name,
//         status: 'error',
//         response_time: responseTime,
//         error_message: `HTTP ${response.status}: ${response.statusText}`,
//         articles_fetched: 0,
//         articles: []
//       }
//     }

//     const content = await response.text()
//     const articles = await parseRSSFeed(content, maxArticles)

//     return {
//       success: true,
//       source_id: source.id,
//       source_name: source.name,
//       status: 'healthy',
//       response_time: responseTime,
//       articles_fetched: articles.length,
//       articles: articles.map(article => ({
//         ...article,
//         source_name: source.name,
//         language: source.language || 'en',
//         processed: false,
//         trending_score: 0
//       }))
//     }

//   } catch (error: any) {
//     const responseTime = Date.now() - startTime
//
//     return {
//       success: false,
//       source_id: source.id,
//       source_name: source.name,
//       status: error.name === 'AbortError' ? 'timeout' : 'error',
//       response_time: responseTime,
//       error_message: error.message || 'Unknown error occurred',
//       articles_fetched: 0,
//       articles: []
//     }
//   }
// }

// TODO: Implement API source fetching when news_sources table is available
// async function fetchFromAPISource(source: any, maxArticles: number = 20) {
//   const startTime = Date.now()
//
//   try {
//     const requestHeaders: Record<string, string> = {
//       'User-Agent': 'Stakeados News Aggregator/1.0',
//       'Accept': 'application/json',
//       ...(source.headers || {})
//     }

//     if (source.api_key) {
//       requestHeaders['Authorization'] = `Bearer ${source.api_key}`
//     }

//     const url = source.api_endpoint || source.url
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: requestHeaders,
//       // timeout: 15000 // 15 second timeout - not supported in fetch
//     })

//     const responseTime = Date.now() - startTime

//     if (!response.ok) {
//       return {
//         success: false,
//         source_id: source.id,
//         source_name: source.name,
//         status: 'error',
//         response_time: responseTime,
//         error_message: `HTTP ${response.status}: ${response.statusText}`,
//         articles_fetched: 0,
//         articles: []
//       }
//     }

//     const data = await response.json()
//     const articles = Array.isArray(data) ? data.slice(0, maxArticles) : (data.data || []).slice(0, maxArticles)

//     // Transform API response to our news format
//     const transformedArticles = articles.map((item: any) => ({
//       title: item.title || item.headline || item.name || 'Untitled',
//       content: item.content || item.description || item.body || '',
//       summary: item.summary || item.excerpt || (item.content || item.description || '').substring(0, 300),
//       source_url: item.url || item.link || item.source_url,
//       source_name: source.name,
//       language: source.language || 'en',
//       published_at: item.published_at || item.publishedAt || item.date || new Date().toISOString(),
//       processed: false,
//       trending_score: 0
//     }))

//     return {
//       success: true,
//       source_id: source.id,
//       source_name: source.name,
//       status: 'healthy',
//       response_time: responseTime,
//       articles_fetched: transformedArticles.length,
//       articles: transformedArticles
//     }

//   } catch (error: any) {
//     const responseTime = Date.now() - startTime
//
//     return {
//       success: false,
//       source_id: source.id,
//       source_name: source.name,
//       status: error.name === 'AbortError' ? 'timeout' : 'error',
//       response_time: responseTime,
//       error_message: error.message || 'Unknown error occurred',
//       articles_fetched: 0,
//       articles: []
//     }
//   }
// }

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const hasPermission = await checkAdminPermissions(supabase, user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    // TODO: Use these variables when news_sources table is available
    // const { source_ids, force, max_articles } = fetchRequestSchema.parse(body)
    fetchRequestSchema.parse(body); // Validate the request but don't use the variables yet

    // For now, return a placeholder since the news_sources table doesn't exist
    return NextResponse.json({
      message: 'News sources functionality not available',
      results: [],
      summary: {
        total_sources: 0,
        successful: 0,
        failed: 0,
        total_articles: 0,
        average_response_time: 0,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
