import { createClient } from '@/lib/supabase/client';
import { processNewsArticle, detectDuplicateArticle } from './openai';

// Interface for RSS feed item
export interface RSSFeedItem {
  title: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt: Date;
  author?: string;
  imageUrl?: string;
}

// Interface for processing queue item
export interface ProcessingQueueItem {
  id: string;
  title: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt: Date;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Process and store news article
 */
export async function processAndStoreNewsArticle(
  feedItem: RSSFeedItem
): Promise<{ success: boolean; articleId?: string; error?: string }> {
  try {
    // Check for duplicates first
    const isDuplicate = await checkForDuplicateArticle(
      feedItem.title,
      feedItem.content
    );
    if (isDuplicate) {
      return { success: false, error: 'Duplicate article detected' };
    }

    // Process with AI
    const aiResult = await processNewsArticle(feedItem.title, feedItem.content);

    // Filter out low-relevance articles
    if (aiResult.relevanceAssessment.score < 3) {
      return { success: false, error: 'Article relevance score too low' };
    }

    // Prepare article data
    const articleData: any = {
      title: feedItem.title,
      content: feedItem.content,
      summary: aiResult.summary.mainPoints.join('. '),
      tags: aiResult.keywords,
      language: 'en',
      published_at: feedItem.publishedAt.toISOString(),
      status: 'published',
      slug: feedItem.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    };

    // Store in database
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();

    if (error) {
      console.error('Error storing news article:', error);
      return { success: false, error: error.message };
    }

    return { success: true, articleId: data.id };
  } catch (error) {
    console.error('Error processing news article:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check for duplicate articles
 */
export async function checkForDuplicateArticle(
  title: string,
  content: string
): Promise<boolean> {
  try {
    // First check by URL (exact duplicates)
    const supabase = createClient();
    const { data: existingByUrl } = await supabase
      .from('articles')
      .select('id')
      .eq('title', title) // Check by title for now
      .limit(1);

    if (existingByUrl && existingByUrl.length > 0) {
      return true;
    }

    // Check recent articles for content similarity
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentArticles } = await supabase
      .from('articles')
      .select('title, content')
      .gte('created_at', oneDayAgo.toISOString())
      .limit(10);

    if (!recentArticles || recentArticles.length === 0) {
      return false;
    }

    // Use AI to detect semantic duplicates
    for (const article of recentArticles) {
      const titleEn = article.title || '';
      const contentEn = article.content || '';

      if (titleEn && contentEn) {
        const duplicateResult = await detectDuplicateArticle(
          title,
          content,
          titleEn,
          contentEn
        );

        if (duplicateResult.isDuplicate) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return false; // Allow processing if duplicate check fails
  }
}

/**
 * Batch process RSS feed items
 */
export async function batchProcessRSSFeed(feedItems: RSSFeedItem[]): Promise<{
  processed: number;
  stored: number;
  duplicates: number;
  lowRelevance: number;
  errors: number;
}> {
  const results = {
    processed: 0,
    stored: 0,
    duplicates: 0,
    lowRelevance: 0,
    errors: 0,
  };

  // Process items in batches to avoid overwhelming the API
  const batchSize = 3;
  for (let i = 0; i < feedItems.length; i += batchSize) {
    const batch = feedItems.slice(i, i + batchSize);

    const batchPromises = batch.map(async item => {
      results.processed++;

      const result = await processAndStoreNewsArticle(item);

      if (result.success) {
        results.stored++;
      } else if (result.error?.includes('Duplicate')) {
        results.duplicates++;
      } else if (result.error?.includes('relevance')) {
        results.lowRelevance++;
      } else {
        results.errors++;
      }
    });

    await Promise.all(batchPromises);

    // Add delay between batches
    if (i + batchSize < feedItems.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Reprocess existing articles with updated AI
 */
export async function reprocessExistingArticles(limit: number = 10): Promise<{
  processed: number;
  updated: number;
  errors: number;
}> {
  const results = {
    processed: 0,
    updated: 0,
    errors: 0,
  };

  try {
    // Get articles that haven't been AI processed or need reprocessing
    const supabase = createClient();
    const { data: articles } = await supabase
      .from('news')
      .select('*')
      .eq('ai_processed', false)
      .limit(limit);

    if (!articles || articles.length === 0) {
      return results;
    }

    for (const article of articles) {
      results.processed++;

      try {
        const titleEn = article.title || '';
        const contentEn = (article as any).description || article.content || '';

        if (!titleEn || !contentEn) {
          results.errors++;
          continue;
        }

        // Process with AI
        const aiResult = await processNewsArticle(titleEn, contentEn);

        // Update article with AI results
        const { error } = await supabase
          .from('articles')
          .update({
            tags: aiResult.keywords,
            summary: aiResult.summary.mainPoints.join('. '),
          } as any)
          .eq('id', article.id);

        if (error) {
          console.error('Error updating article:', error);
          results.errors++;
        } else {
          results.updated++;
        }
      } catch (error) {
        console.error('Error reprocessing article:', error);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('Error in reprocessExistingArticles:', error);
  }

  return results;
}

/**
 * Get processing statistics
 */
export async function getProcessingStatistics(): Promise<{
  totalArticles: number;
  processedArticles: number;
  averageRelevanceScore: number;
  topCategories: Array<{ category: string; count: number }>;
  processingRate: number;
}> {
  try {
    const supabase = createClient();
    const { data: articles } = await supabase
      .from('news')
      .select('tags, importance_score, ai_processed, fetched_at');

    if (!articles) {
      return {
        totalArticles: 0,
        processedArticles: 0,
        averageRelevanceScore: 0,
        topCategories: [],
        processingRate: 0,
      };
    }

    const totalArticles = articles.length;
    const processedArticles = articles.filter((a: any) => a.summary).length;

    // Calculate average relevance score (simplified)
    const averageRelevanceScore = 5; // Default score

    // Calculate top categories (using tags for now)
    const categoryCount: Record<string, number> = {};
    articles.forEach((article: any) => {
      if (article.tags) {
        article.tags.forEach((tag: any) => {
          categoryCount[tag] = (categoryCount[tag] || 0) + 1;
        });
      }
    });

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate processing rate (articles processed in last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentlyProcessed = articles.filter(
      (a: any) =>
        a.summary && a.created_at && new Date(a.created_at) > oneDayAgo
    ).length;

    return {
      totalArticles,
      processedArticles,
      averageRelevanceScore: Math.round(averageRelevanceScore * 100) / 100,
      topCategories,
      processingRate: recentlyProcessed,
    };
  } catch (error) {
    console.error('Error getting processing statistics:', error);
    return {
      totalArticles: 0,
      processedArticles: 0,
      averageRelevanceScore: 0,
      topCategories: [],
      processingRate: 0,
    };
  }
}

/**
 * Clean up low-quality articles
 */
export async function cleanupLowQualityArticles(): Promise<{
  deleted: number;
  errors: number;
}> {
  const results = { deleted: 0, errors: 0 };

  try {
    const supabase = createClient();
    const { data: lowQualityArticles } = await supabase
      .from('articles')
      .select('id')
      .is('summary', null);

    if (!lowQualityArticles || lowQualityArticles.length === 0) {
      return results;
    }

    // Delete in batches
    const batchSize = 10;
    for (let i = 0; i < lowQualityArticles.length; i += batchSize) {
      const batch = lowQualityArticles.slice(i, i + batchSize);
      const ids = batch.map(article => article.id);

      const { error } = await supabase.from('articles').delete().in('id', ids);

      if (error) {
        console.error('Error deleting low-quality articles:', error);
        results.errors += batch.length;
      } else {
        results.deleted += batch.length;
      }
    }
  } catch (error) {
    console.error('Error in cleanupLowQualityArticles:', error);
    results.errors++;
  }

  return results;
}
