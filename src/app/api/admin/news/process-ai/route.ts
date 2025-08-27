import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for AI processing request
const processAISchema = z.object({
  news_ids: z.array(z.string().uuid()).optional(), // If not provided, process all unprocessed
  force_reprocess: z.boolean().default(false), // Force reprocess already processed items
  processing_options: z
    .object({
      generate_summary: z.boolean().default(true),
      extract_keywords: z.boolean().default(true),
      calculate_relevance: z.boolean().default(true),
      detect_duplicates: z.boolean().default(true),
      categorize: z.boolean().default(true),
    })
    .optional(),
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

// Mock AI processing function - in real implementation, this would call OpenAI or similar
async function processNewsWithAI(newsItem: any, options: any) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const processed = {
    summary: options.generate_summary
      ? newsItem.content.substring(0, 200) + '...'
      : newsItem.summary,
    keywords: options.extract_keywords ? extractKeywords(newsItem.content) : [],
    relevance_score: options.calculate_relevance
      ? Math.floor(Math.random() * 100)
      : newsItem.trending_score,
    ai_metadata: {
      processed_at: new Date().toISOString(),
      processing_version: '1.0',
      confidence_score: Math.floor(Math.random() * 100),
      language_detected: detectLanguage(newsItem.content),
      sentiment: analyzeSentiment(newsItem.content),
    },
  };

  return processed;
}

function extractKeywords(content: string): string[] {
  // Simple keyword extraction - in real implementation, use NLP
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4);

  const wordCount = words.reduce((acc: any, word: string) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(wordCount)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function detectLanguage(content: string): string {
  // Simple language detection - in real implementation, use proper language detection
  const spanishWords = [
    'el',
    'la',
    'de',
    'que',
    'y',
    'en',
    'un',
    'es',
    'se',
    'no',
  ];
  const englishWords = [
    'the',
    'of',
    'and',
    'to',
    'a',
    'in',
    'is',
    'it',
    'you',
    'that',
  ];

  const words = content.toLowerCase().split(/\s+/);
  const spanishCount = words.filter(word => spanishWords.includes(word)).length;
  const englishCount = words.filter(word => englishWords.includes(word)).length;

  return spanishCount > englishCount ? 'es' : 'en';
}

function analyzeSentiment(
  content: string
): 'positive' | 'neutral' | 'negative' {
  // Simple sentiment analysis - in real implementation, use proper sentiment analysis
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'bueno',
    'excelente',
    'increíble',
  ];
  const negativeWords = [
    'bad',
    'terrible',
    'awful',
    'horrible',
    'worst',
    'malo',
    'terrible',
    'horrible',
  ];

  const words = content.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word =>
    positiveWords.includes(word)
  ).length;
  const negativeCount = words.filter(word =>
    negativeWords.includes(word)
  ).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

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
    const validatedData = processAISchema.parse(body);

    const processingOptions = validatedData.processing_options || {
      generate_summary: true,
      extract_keywords: true,
      calculate_relevance: true,
      detect_duplicates: true,
      categorize: true,
    };

    // Build query to get news items to process
    let query = supabase.from('news').select('*');

    if (validatedData.news_ids && validatedData.news_ids.length > 0) {
      // Process specific news items
      query = query.in('id', validatedData.news_ids);
    } else {
      // Process all unprocessed items
      if (!validatedData.force_reprocess) {
        query = query.eq('processed', false);
      }
    }

    const { data: newsItems, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching news for processing:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch news items' },
        { status: 500 }
      );
    }

    if (!newsItems || newsItems.length === 0) {
      return NextResponse.json({
        message: 'No news items found for processing',
        processed: 0,
        skipped: 0,
        errors: [],
      });
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as any[],
    };

    // Process each news item
    for (const newsItem of newsItems) {
      try {
        // Skip if already processed and not forcing reprocess
        if (newsItem.processed && !validatedData.force_reprocess) {
          results.skipped++;
          continue;
        }

        // Process with AI
        const aiResults = await processNewsWithAI(newsItem, processingOptions);

        // Update the news item with AI results
        const updateData: any = {
          processed: true,
          trending_score: aiResults.relevance_score,
          updated_at: new Date().toISOString(),
        };

        // Add summary if generated
        if (aiResults.summary && aiResults.summary !== newsItem.summary) {
          updateData.summary = aiResults.summary;
        }

        const { error: updateError } = await supabase
          .from('news')
          .update(updateData)
          .eq('id', newsItem.id);

        if (updateError) {
          console.error(`Error updating news ${newsItem.id}:`, updateError);
          results.errors.push({
            news_id: newsItem.id,
            error: updateError.message,
          });
        } else {
          results.processed++;
        }
      } catch (error) {
        console.error(`Error processing news ${newsItem.id}:`, error);
        results.errors.push({
          news_id: newsItem.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: `AI processing completed`,
      results,
      total_items: newsItems.length,
      processing_options: processingOptions,
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
