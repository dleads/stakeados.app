import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Query parameters schema for duplicate detection
const duplicateQuerySchema = z.object({
  similarity_threshold: z.coerce.number().min(0).max(1).default(0.8), // 80% similarity threshold
  include_processed: z.coerce.boolean().default(true),
  date_range_days: z.coerce.number().min(1).max(365).default(30), // Look for duplicates in last 30 days
  limit: z.coerce.number().min(1).max(100).default(50),
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

// Enhanced text similarity using multiple algorithms
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);

  const tokens1 = new Set(normalize(text1));
  const tokens2 = new Set(normalize(text2));

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

// Cosine similarity using word frequency vectors
function calculateCosineSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);

  const words1 = normalize(text1);
  const words2 = normalize(text2);

  // Create word frequency maps
  const freq1 = words1.reduce((acc: any, word: string) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const freq2 = words2.reduce((acc: any, word: string) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  // Get all unique words
  const allWords = new Set([...words1, ...words2]);

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (const word of allWords) {
    const f1 = freq1[word] || 0;
    const f2 = freq2[word] || 0;

    dotProduct += f1 * f2;
    magnitude1 += f1 * f1;
    magnitude2 += f2 * f2;
  }

  const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

// Levenshtein distance for string similarity
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen > 0 ? 1 - matrix[len2][len1] / maxLen : 1;
}

// N-gram similarity for better fuzzy matching
function calculateNGramSimilarity(
  text1: string,
  text2: string,
  n: number = 3
): number {
  const normalize = (text: string) =>
    text.toLowerCase().replace(/[^\w\sáéíóúñü]/g, '');

  const norm1 = normalize(text1);
  const norm2 = normalize(text2);

  if (norm1.length < n || norm2.length < n) {
    return calculateLevenshteinSimilarity(norm1, norm2);
  }

  const ngrams1 = new Set();
  const ngrams2 = new Set();

  for (let i = 0; i <= norm1.length - n; i++) {
    ngrams1.add(norm1.substring(i, i + n));
  }

  for (let i = 0; i <= norm2.length - n; i++) {
    ngrams2.add(norm2.substring(i, i + n));
  }

  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

// Enhanced content similarity with multiple algorithms and weighting
function calculateContentSimilarity(
  item1: any,
  item2: any,
  config: any = {}
): number {
  const titleWeight = config.title_weight || 0.6;
  const contentWeight = config.content_weight || 0.4;

  // Calculate title similarities using multiple methods
  const titleJaccard = calculateJaccardSimilarity(item1.title, item2.title);
  const titleCosine = calculateCosineSimilarity(item1.title, item2.title);
  const titleLevenshtein = calculateLevenshteinSimilarity(
    item1.title,
    item2.title
  );
  const titleNGram = calculateNGramSimilarity(item1.title, item2.title);

  // Weighted average of title similarities
  const titleSimilarity =
    titleJaccard * 0.3 +
    titleCosine * 0.3 +
    titleLevenshtein * 0.2 +
    titleNGram * 0.2;

  // Calculate content similarities (use first 1000 chars for performance)
  const content1 = item1.content.substring(0, 1000);
  const content2 = item2.content.substring(0, 1000);

  const contentJaccard = calculateJaccardSimilarity(content1, content2);
  const contentCosine = calculateCosineSimilarity(content1, content2);
  const contentNGram = calculateNGramSimilarity(content1, content2);

  // Weighted average of content similarities
  const contentSimilarity =
    contentJaccard * 0.4 + contentCosine * 0.4 + contentNGram * 0.2;

  // Final weighted similarity
  return titleSimilarity * titleWeight + contentSimilarity * contentWeight;
}

// Advanced duplicate detection with multiple criteria
function detectAdvancedDuplicates(
  item1: any,
  item2: any,
  config: any = {}
): {
  isDuplicate: boolean;
  similarity: number;
  reasons: string[];
  confidence: number;
} {
  const reasons = [];
  let confidence = 0;

  // Check for exact URL match (strongest indicator)
  if (
    item1.source_url &&
    item2.source_url &&
    item1.source_url === item2.source_url
  ) {
    return {
      isDuplicate: true,
      similarity: 1.0,
      reasons: ['identical_source_url'],
      confidence: 1.0,
    };
  }

  // Check for very similar URLs (same domain, similar path)
  if (item1.source_url && item2.source_url) {
    try {
      const url1 = new URL(item1.source_url);
      const url2 = new URL(item2.source_url);

      if (url1.hostname === url2.hostname) {
        const pathSimilarity = calculateLevenshteinSimilarity(
          url1.pathname,
          url2.pathname
        );
        if (pathSimilarity > 0.8) {
          reasons.push('similar_source_url');
          confidence += 0.3;
        }
      }
    } catch (e) {
      // Invalid URLs, skip URL comparison
    }
  }

  // Calculate content similarity
  const similarity = calculateContentSimilarity(item1, item2, config);

  // Check title similarity specifically
  const titleSimilarity = calculateCosineSimilarity(item1.title, item2.title);
  if (titleSimilarity > 0.9) {
    reasons.push('very_similar_title');
    confidence += 0.4;
  } else if (titleSimilarity > 0.7) {
    reasons.push('similar_title');
    confidence += 0.2;
  }

  // Check for similar publication times (might indicate same story)
  if (item1.published_at && item2.published_at) {
    const timeDiff = Math.abs(
      new Date(item1.published_at).getTime() -
        new Date(item2.published_at).getTime()
    );
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 2) {
      reasons.push('published_within_2_hours');
      confidence += 0.1;
    } else if (hoursDiff < 24) {
      reasons.push('published_same_day');
      confidence += 0.05;
    }
  }

  // Check content length similarity
  const lengthRatio =
    Math.min(item1.content.length, item2.content.length) /
    Math.max(item1.content.length, item2.content.length);
  if (lengthRatio > 0.8) {
    reasons.push('similar_content_length');
    confidence += 0.1;
  }

  // Final confidence calculation
  confidence = Math.min(1.0, confidence + similarity * 0.5);

  const threshold = config.similarity_threshold || 0.8;
  const isDuplicate = similarity >= threshold && confidence >= 0.6;

  return {
    isDuplicate,
    similarity,
    reasons,
    confidence,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedParams = duplicateQuerySchema.parse(queryParams);

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - validatedParams.date_range_days);

    // Build query to get news items for duplicate detection
    let query = supabase
      .from('news')
      .select(
        `
        id,
        title,
        content,
        summary,
        source_url,
        source_name,
        published_at,
        created_at,
        processed,
        trending_score
      `
      )
      .gte('created_at', dateFrom.toISOString())
      .order('created_at', { ascending: false });

    if (!validatedParams.include_processed) {
      query = query.eq('processed', false);
    }

    const { data: newsItems, error } = await query;

    if (error) {
      console.error('Error fetching news for duplicate detection:', error);
      return NextResponse.json(
        { error: 'Failed to fetch news items' },
        { status: 500 }
      );
    }

    if (!newsItems || newsItems.length < 2) {
      return NextResponse.json({
        duplicates: [],
        total_checked: newsItems?.length || 0,
        duplicates_found: 0,
        similarity_threshold: validatedParams.similarity_threshold,
      });
    }

    // Enhanced duplicate detection with advanced algorithms
    const duplicateGroups: any[] = [];
    const processedIds = new Set<string>();
    const detectionConfig = {
      similarity_threshold: validatedParams.similarity_threshold,
      title_weight: 0.6,
      content_weight: 0.4,
    };

    console.log(
      `Starting duplicate detection for ${newsItems.length} items with threshold ${validatedParams.similarity_threshold}`
    );

    for (let i = 0; i < newsItems.length; i++) {
      const item1 = newsItems[i];

      if (processedIds.has(item1.id)) continue;

      const duplicates = [
        {
          item: item1,
          similarity: 1.0,
          reasons: ['original'],
          confidence: 1.0,
        },
      ];

      for (let j = i + 1; j < newsItems.length; j++) {
        const item2 = newsItems[j];

        if (processedIds.has(item2.id)) continue;

        // Use advanced duplicate detection
        const detection = detectAdvancedDuplicates(
          item1,
          item2,
          detectionConfig
        );

        if (detection.isDuplicate) {
          duplicates.push({
            item: item2,
            similarity: detection.similarity,
            reasons: detection.reasons,
            confidence: detection.confidence,
          });
          processedIds.add(item2.id);
        }
      }

      // If we found duplicates, add to results
      if (duplicates.length > 1) {
        // Sort by confidence and processing status
        duplicates.sort((a, b) => {
          // Prioritize processed items
          if (a.item.processed !== b.item.processed) {
            return a.item.processed ? -1 : 1;
          }
          // Then by confidence
          if (Math.abs(a.confidence - b.confidence) > 0.1) {
            return b.confidence - a.confidence;
          }
          // Finally by creation date (newest first)
          const dateA = a.item.created_at
            ? new Date(a.item.created_at).getTime()
            : 0;
          const dateB = b.item.created_at
            ? new Date(b.item.created_at).getTime()
            : 0;
          return dateB - dateA;
        });

        const primaryDuplicate = duplicates[0];
        const otherDuplicates = duplicates.slice(1);

        // Calculate group statistics
        const avgSimilarity =
          otherDuplicates.reduce((sum, dup) => sum + dup.similarity, 0) /
          otherDuplicates.length;
        const avgConfidence =
          otherDuplicates.reduce((sum, dup) => sum + dup.confidence, 0) /
          otherDuplicates.length;

        // Determine recommended action based on confidence and similarity
        let recommendedAction = 'keep_primary_delete_others';
        if (avgConfidence < 0.7) {
          recommendedAction = 'manual_review_required';
        } else if (avgSimilarity > 0.95) {
          recommendedAction = 'auto_delete_duplicates';
        }

        duplicateGroups.push({
          group_id: `group_${duplicateGroups.length + 1}`,
          primary_item: primaryDuplicate.item,
          duplicate_items: otherDuplicates.map(dup => dup.item),
          detection_details: otherDuplicates.map(dup => ({
            id: dup.item.id,
            similarity: dup.similarity,
            confidence: dup.confidence,
            reasons: dup.reasons,
            title:
              dup.item.title.substring(0, 100) +
              (dup.item.title.length > 100 ? '...' : ''),
          })),
          group_statistics: {
            total_items: duplicates.length,
            avg_similarity: Math.round(avgSimilarity * 100) / 100,
            avg_confidence: Math.round(avgConfidence * 100) / 100,
            min_similarity: Math.min(...otherDuplicates.map(d => d.similarity)),
            max_similarity: Math.max(...otherDuplicates.map(d => d.similarity)),
          },
          recommended_action: recommendedAction,
          risk_level:
            avgConfidence > 0.8
              ? 'low'
              : avgConfidence > 0.6
                ? 'medium'
                : 'high',
        });

        processedIds.add(item1.id);
      }
    }

    console.log(
      `Duplicate detection completed. Found ${duplicateGroups.length} duplicate groups`
    );

    // Limit results
    const limitedGroups = duplicateGroups.slice(0, validatedParams.limit);

    // Calculate statistics
    const stats = {
      total_checked: newsItems.length,
      duplicates_found: duplicateGroups.length,
      total_duplicate_items: duplicateGroups.reduce(
        (sum, group) => sum + group.duplicate_items.length,
        0
      ),
      by_source: duplicateGroups.reduce((acc: any, group) => {
        const source = group.primary_item.source_name || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {}),
      similarity_threshold: validatedParams.similarity_threshold,
      date_range_days: validatedParams.date_range_days,
    };

    return NextResponse.json({
      duplicates: limitedGroups,
      stats,
      has_more: duplicateGroups.length > validatedParams.limit,
    });
  } catch (error) {
    console.error('API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
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

// POST endpoint to resolve duplicates (delete or merge)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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
    const { action, group_id, keep_id, delete_ids } = body;

    if (!action || !keep_id || !delete_ids || !Array.isArray(delete_ids)) {
      return NextResponse.json(
        {
          error: 'Missing required fields: action, keep_id, delete_ids',
        },
        { status: 400 }
      );
    }

    if (action !== 'resolve_duplicates') {
      return NextResponse.json(
        {
          error: 'Invalid action. Only "resolve_duplicates" is supported',
        },
        { status: 400 }
      );
    }

    // Verify the item to keep exists
    const { data: keepItem, error: keepError } = await supabase
      .from('news')
      .select('id, title')
      .eq('id', keep_id)
      .single();

    if (keepError || !keepItem) {
      return NextResponse.json(
        { error: 'Item to keep not found' },
        { status: 404 }
      );
    }

    // Delete the duplicate items
    const { error: deleteError } = await supabase
      .from('news')
      .delete()
      .in('id', delete_ids);

    if (deleteError) {
      console.error('Error deleting duplicate news items:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete duplicate items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Duplicates resolved successfully',
      group_id,
      kept_item: keepItem,
      deleted_count: delete_ids.length,
      deleted_ids: delete_ids,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
