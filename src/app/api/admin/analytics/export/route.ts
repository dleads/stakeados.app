import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      exportType = 'articles', // 'articles', 'news', 'authors', 'categories', 'analytics'
      format = 'csv', // 'csv', 'json', 'xlsx'
      dateRange = { days: 30 },
      filters = {},
      includeMetrics = true,
    } = body;

    // Validate export type
    const validExportTypes = [
      'articles',
      'news',
      'authors',
      'categories',
      'analytics',
    ];
    if (!validExportTypes.includes(exportType)) {
      return NextResponse.json(
        { error: 'Invalid export type' },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['csv', 'json'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid export format. Only CSV and JSON are supported.' },
        { status: 400 }
      );
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (dateRange.days || 30));

    let exportData = [];
    let filename = '';

    switch (exportType) {
      case 'articles':
        const articlesResult = await exportArticles(
          supabase,
          startDate,
          filters,
          includeMetrics
        );
        exportData = articlesResult.data;
        filename = `articles_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'news':
        const newsResult = await exportNews(
          supabase,
          startDate,
          filters,
          includeMetrics
        );
        exportData = newsResult.data;
        filename = `news_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'authors':
        const authorsResult = await exportAuthors(
          supabase,
          startDate,
          filters,
          includeMetrics
        );
        exportData = authorsResult.data;
        filename = `authors_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'categories':
        const categoriesResult = await exportCategories(
          supabase,
          includeMetrics
        );
        exportData = categoriesResult.data;
        filename = `categories_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'analytics':
        const analyticsResult = await exportAnalytics(
          supabase,
          startDate,
          filters
        );
        exportData = analyticsResult.data;
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}`;
        break;
    }

    // Format data based on requested format
    let responseData;
    let contentType;

    if (format === 'csv') {
      responseData = convertToCSV(exportData);
      contentType = 'text/csv';
      filename += '.csv';
    } else {
      responseData = JSON.stringify(exportData, null, 2);
      contentType = 'application/json';
      filename += '.json';
    }

    // Return the export data
    return new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Export analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}

// Helper function to export articles
async function exportArticles(
  supabase: any,
  startDate: Date,
  filters: any,
  includeMetrics: boolean
) {
  let query = supabase
    .from('articles')
    .select(
      `
      id,
      title,
      slug,
      status,
      views,
      likes,
      reading_time,
      published_at,
      created_at,
      updated_at,
      language,
      author:profiles(id, full_name, email),
      category:categories(id, name),
      ${includeMetrics ? 'content_metrics:content_metrics(metric_type, value, recorded_at),' : ''}
      article_history:article_history(change_type, created_at, notes)
    `
    )
    .gte('created_at', startDate.toISOString());

  // Apply filters
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.authorId) query = query.eq('author_id', filters.authorId);

  const { data, error } = await query;
  if (error) throw error;

  // Flatten the data for export
  const flattenedData =
    data?.map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      status: article.status,
      views: article.views || 0,
      likes: article.likes || 0,
      reading_time: article.reading_time || 0,
      author_name: article.author?.full_name || '',
      author_email: article.author?.email || '',
      category_name: article.category?.name || '',
      published_at: article.published_at || '',
      created_at: article.created_at,
      updated_at: article.updated_at,
      language: article.language,
      total_metrics: includeMetrics ? article.content_metrics?.length || 0 : 0,
      total_changes: article.article_history?.length || 0,
    })) || [];

  return { data: flattenedData };
}

// Helper function to export news
async function exportNews(
  supabase: any,
  startDate: Date,
  filters: any,
  includeMetrics: boolean
) {
  let query = supabase
    .from('news')
    .select(
      `
      id,
      title,
      summary,
      source_name,
      source_url,
      published_at,
      created_at,
      updated_at,
      processed,
      trending_score,
      language,
      ai_metadata,
      category:categories(id, name),
      ${includeMetrics ? 'content_metrics:content_metrics(metric_type, value, recorded_at)' : ''}
    `
    )
    .gte('created_at', startDate.toISOString());

  // Apply filters
  if (filters.processed !== undefined)
    query = query.eq('processed', filters.processed);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.sourceId) query = query.eq('source_id', filters.sourceId);

  const { data, error } = await query;
  if (error) throw error;

  // Flatten the data for export
  const flattenedData =
    data?.map((news: any) => ({
      id: news.id,
      title: news.title,
      summary: news.summary || '',
      source_name: news.source_name || '',
      source_url: news.source_url || '',
      category_name: news.category?.name || '',
      published_at: news.published_at || '',
      created_at: news.created_at,
      updated_at: news.updated_at,
      processed: news.processed,
      trending_score: news.trending_score || 0,
      language: news.language,
      ai_relevance_score: news.ai_metadata?.relevance_score || 0,
      ai_sentiment: news.ai_metadata?.sentiment || '',
      ai_keywords: news.ai_metadata?.keywords?.join(', ') || '',
      is_duplicate: news.ai_metadata?.duplicate_check?.is_duplicate || false,
      total_metrics: includeMetrics ? news.content_metrics?.length || 0 : 0,
    })) || [];

  return { data: flattenedData };
}

// Helper function to export authors
async function exportAuthors(
  supabase: any,
  startDate: Date,
  _filters: any,
  _includeMetrics: boolean
) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      email,
      created_at,
      articles:articles(
        id,
        status,
        views,
        likes,
        created_at,
        published_at
      )
    `
    )
    .not('articles', 'is', null);

  if (error) throw error;

  // Process authors data
  const flattenedData =
    data?.map((author: any) => {
      const articles = author.articles || [];
      const recentArticles = articles.filter(
        (a: any) => new Date(a.created_at) >= startDate
      );
      const publishedArticles = articles.filter(
        (a: any) => a.status === 'published'
      );

      return {
        id: author.id,
        name: author.full_name,
        email: author.email,
        joined_at: author.created_at,
        total_articles: articles.length,
        published_articles: publishedArticles.length,
        draft_articles: articles.filter((a: any) => a.status === 'draft')
          .length,
        review_articles: articles.filter((a: any) => a.status === 'review')
          .length,
        recent_articles: recentArticles.length,
        total_views: publishedArticles.reduce(
          (sum: number, a: any) => sum + (a.views || 0),
          0
        ),
        total_likes: publishedArticles.reduce(
          (sum: number, a: any) => sum + (a.likes || 0),
          0
        ),
        avg_views_per_article:
          publishedArticles.length > 0
            ? Math.round(
                publishedArticles.reduce(
                  (sum: number, a: any) => sum + (a.views || 0),
                  0
                ) / publishedArticles.length
              )
            : 0,
      };
    }) || [];

  return { data: flattenedData };
}

// Helper function to export categories
async function exportCategories(supabase: any, _includeMetrics: boolean) {
  const { data, error } = await supabase.from('categories').select(`
      id,
      name,
      slug,
      description,
      color,
      icon,
      parent_id,
      sort_order,
      created_at,
      updated_at,
      articles:articles(count),
      news:news(count)
    `);

  if (error) throw error;

  // Flatten the data for export
  const flattenedData =
    data?.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '',
      icon: category.icon || '',
      parent_id: category.parent_id || '',
      sort_order: category.sort_order,
      created_at: category.created_at,
      updated_at: category.updated_at,
      article_count: category.articles?.[0]?.count || 0,
      news_count: category.news?.[0]?.count || 0,
      total_content:
        (category.articles?.[0]?.count || 0) + (category.news?.[0]?.count || 0),
    })) || [];

  return { data: flattenedData };
}

// Helper function to export analytics summary
async function exportAnalytics(supabase: any, startDate: Date, _filters: any) {
  // Get summary analytics data
  const [articles, news, metrics] = await Promise.all([
    supabase
      .from('articles')
      .select('id, status, views, likes, created_at, published_at')
      .gte('created_at', startDate.toISOString()),

    supabase
      .from('news')
      .select('id, processed, trending_score, created_at')
      .gte('created_at', startDate.toISOString()),

    supabase
      .from('content_metrics')
      .select('metric_type, value, recorded_at')
      .gte('recorded_at', startDate.toISOString()),
  ]);

  const analyticsData = [
    {
      metric: 'Total Articles',
      value: articles.data?.length || 0,
      period: `Last ${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
    },
    {
      metric: 'Published Articles',
      value:
        articles.data?.filter((a: any) => a.status === 'published').length || 0,
      period: `Last ${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
    },
    {
      metric: 'Total News',
      value: news.data?.length || 0,
      period: `Last ${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
    },
    {
      metric: 'Processed News',
      value: news.data?.filter((n: any) => n.processed).length || 0,
      period: `Last ${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
    },
    {
      metric: 'Total Views',
      value:
        articles.data?.reduce(
          (sum: number, a: any) => sum + (a.views || 0),
          0
        ) || 0,
      period: `Last ${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
    },
    {
      metric: 'Total Likes',
      value:
        articles.data?.reduce(
          (sum: number, a: any) => sum + (a.likes || 0),
          0
        ) || 0,
      period: `Last ${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
    },
    {
      metric: 'Total Engagement Events',
      value: metrics.data?.length || 0,
      period: `Last ${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
    },
  ];

  return { data: analyticsData };
}

// Helper function to convert data to CSV format
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Escape commas and quotes in values
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}
