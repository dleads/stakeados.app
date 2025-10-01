export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export interface NewsFilters {
  categories?: string[];
  keywords?: string[];
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  minRelevanceScore?: number;
  personalized?: boolean;
  trending?: boolean;
}

export interface NewsQueryParams extends NewsFilters {
  page?: number;
  limit?: number;
  sortBy?:
    | 'published_at'
    | 'relevance_score'
    | 'trending_score'
    | 'engagement_score';
  sortOrder?: 'asc' | 'desc';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 items per page
    const sortBy = (searchParams.get('sortBy') ||
      'published_at') as NewsQueryParams['sortBy'];
    const sortOrder = (searchParams.get('sortOrder') ||
      'desc') as NewsQueryParams['sortOrder'];

    // Parse filters
    const categories =
      searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const keywords =
      searchParams.get('keywords')?.split(',').filter(Boolean) || [];
    const source = searchParams.get('source') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const minRelevanceScore = searchParams.get('minRelevanceScore')
      ? parseFloat(searchParams.get('minRelevanceScore')!)
      : undefined;
    const personalized = searchParams.get('personalized') === 'true';
    const trending = searchParams.get('trending') === 'true';

    // Get user for personalization
    // Note: User personalization is not implemented yet
    /*
    let user = null;
    if (personalized) {
      try {
        user = await getUser();
      } catch (error) {
        // Continue without personalization if user not authenticated
        console.warn('Failed to get user for personalization:', error);
      }
    }
    */

    // Build query
    let query = supabase.from('news').select(`
        id,
        title,
        summary,
        content,
        source_url,
        source_name,
        author_name,
        image_url,
        categories,
        keywords,
        relevance_score,
        trending_score,
        engagement_score,
        read_time,
        related_articles,
        user_interactions,
        ai_processed_at,
        published_at,
        created_at,
        updated_at
      `);

    // Apply filters
    if (categories.length > 0) {
      query = query.overlaps('categories', categories);
    }

    if (keywords.length > 0) {
      query = query.overlaps('keywords', keywords);
    }

    if (source) {
      query = query.eq('source_name', source);
    }

    if (dateFrom) {
      query = query.gte('published_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('published_at', dateTo);
    }

    if (minRelevanceScore !== undefined) {
      query = query.gte('relevance_score', minRelevanceScore);
    }

    if (trending) {
      query = query.gte('trending_score', 5.0);
    }

    // Apply sorting
    const sortColumn =
      sortBy === 'published_at'
        ? 'published_at'
        : sortBy === 'relevance_score'
          ? 'relevance_score'
          : sortBy === 'trending_score'
            ? 'trending_score'
            : 'engagement_score';

    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Error fetching news articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch news articles' },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;
    const hasNextPage = page < totalPages - 1;
    const hasPrevPage = page > 0;

    return NextResponse.json({
      articles: articles || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      filters: {
        categories,
        keywords,
        source,
        dateFrom,
        dateTo,
        minRelevanceScore,
        personalized,
        trending,
      },
    });
  } catch (error) {
    console.error('Unexpected error in news API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
