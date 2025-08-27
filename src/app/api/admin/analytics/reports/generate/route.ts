import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ReportConfig {
  name: string;
  dataSource: 'articles' | 'news' | 'categories' | 'authors' | 'mixed';
  dateRange: {
    type: 'relative' | 'absolute';
    days?: number;
    startDate?: string;
    endDate?: string;
  };
  filters: {
    categories?: string[];
    authors?: string[];
    status?: string[];
    tags?: string[];
    language?: string[];
  };
  metrics: string[];
  groupBy: string[];
  chartType: 'table' | 'line' | 'bar' | 'pie' | 'area' | 'doughnut';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit?: number;
  includeComparisons: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

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

    const config: ReportConfig = await request.json();

    // Calculate date range
    let startDate: Date, endDate: Date;

    if (config.dateRange.type === 'relative') {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - (config.dateRange.days || 30));
    } else {
      startDate = new Date(config.dateRange.startDate || '');
      endDate = new Date(config.dateRange.endDate || '');
    }

    let query;
    let data: any[] = [];
    let columns: Array<{ key: string; label: string; type: string }> = [];

    // Build query based on data source
    switch (config.dataSource) {
      case 'articles':
        query = supabase
          .from('articles')
          .select(
            `
            id,
            title,
            slug,
            status,
            published_at,
            created_at,
            updated_at,
            views,
            likes,
            reading_time,
            language,
            profiles!articles_author_id_fkey (
              id,
              full_name
            ),
            categories (
              id,
              name
            )
          `
          )
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        // Apply filters
        if (config.filters.status?.length) {
          query = query.in('status', config.filters.status);
        }
        if (config.filters.language?.length) {
          query = query.in('language', config.filters.language);
        }
        if (config.filters.categories?.length) {
          query = query.in('category_id', config.filters.categories);
        }
        if (config.filters.authors?.length) {
          query = query.in('author_id', config.filters.authors);
        }

        // Apply sorting
        query = query.order(config.sortBy, {
          ascending: config.sortOrder === 'asc',
        });

        // Apply limit
        if (config.limit) {
          query = query.limit(config.limit);
        }

        const { data: articlesData, error: articlesError } = await query;

        if (articlesError) {
          throw articlesError;
        }

        data = articlesData || [];
        columns = [
          { key: 'title', label: 'Title', type: 'string' },
          { key: 'author', label: 'Author', type: 'string' },
          { key: 'category', label: 'Category', type: 'string' },
          { key: 'status', label: 'Status', type: 'string' },
          { key: 'views', label: 'Views', type: 'number' },
          { key: 'likes', label: 'Likes', type: 'number' },
          { key: 'reading_time', label: 'Reading Time', type: 'number' },
          { key: 'published_at', label: 'Published', type: 'date' },
          { key: 'created_at', label: 'Created', type: 'date' },
        ];

        // Transform data for display
        data = data.map(article => ({
          id: article.id,
          title: article.title,
          author: article.profiles?.full_name || 'Unknown',
          category: article.categories?.name || 'Uncategorized',
          status: article.status,
          views: article.views || 0,
          likes: article.likes || 0,
          reading_time: article.reading_time || 0,
          published_at: article.published_at
            ? new Date(article.published_at).toLocaleDateString()
            : 'Not published',
          created_at: new Date(article.created_at).toLocaleDateString(),
        }));
        break;

      case 'news':
        query = supabase
          .from('news')
          .select(
            `
            id,
            title,
            source_name,
            published_at,
            created_at,
            processed,
            trending_score,
            language,
            categories (
              id,
              name
            )
          `
          )
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        // Apply filters
        if (config.filters.language?.length) {
          query = query.in('language', config.filters.language);
        }
        if (config.filters.categories?.length) {
          query = query.in('category_id', config.filters.categories);
        }

        query = query.order(config.sortBy, {
          ascending: config.sortOrder === 'asc',
        });

        if (config.limit) {
          query = query.limit(config.limit);
        }

        const { data: newsData, error: newsError } = await query;

        if (newsError) {
          throw newsError;
        }

        data = newsData || [];
        columns = [
          { key: 'title', label: 'Title', type: 'string' },
          { key: 'source_name', label: 'Source', type: 'string' },
          { key: 'category', label: 'Category', type: 'string' },
          { key: 'processed', label: 'Processed', type: 'boolean' },
          { key: 'trending_score', label: 'Trending Score', type: 'number' },
          { key: 'published_at', label: 'Published', type: 'date' },
          { key: 'created_at', label: 'Created', type: 'date' },
        ];

        data = data.map(news => ({
          id: news.id,
          title: news.title,
          source_name: news.source_name || 'Unknown',
          category: news.categories?.name || 'Uncategorized',
          processed: news.processed ? 'Yes' : 'No',
          trending_score: news.trending_score || 0,
          published_at: news.published_at
            ? new Date(news.published_at).toLocaleDateString()
            : 'Unknown',
          created_at: new Date(news.created_at).toLocaleDateString(),
        }));
        break;

      case 'categories':
        const { data: categoriesData, error: categoriesError } =
          await supabase.from('categories').select(`
            id,
            name,
            description,
            created_at,
            articles!articles_category_id_fkey (count),
            news!news_category_id_fkey (count)
          `);

        if (categoriesError) {
          throw categoriesError;
        }

        data = categoriesData || [];
        columns = [
          { key: 'name', label: 'Name', type: 'string' },
          { key: 'description', label: 'Description', type: 'string' },
          { key: 'articles_count', label: 'Articles', type: 'number' },
          { key: 'news_count', label: 'News', type: 'number' },
          { key: 'total_content', label: 'Total Content', type: 'number' },
          { key: 'created_at', label: 'Created', type: 'date' },
        ];

        data = data.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description || '',
          articles_count: category.articles?.length || 0,
          news_count: category.news?.length || 0,
          total_content:
            (category.articles?.length || 0) + (category.news?.length || 0),
          created_at: new Date(category.created_at).toLocaleDateString(),
        }));
        break;

      case 'authors':
        const { data: authorsData, error: authorsError } = await supabase
          .from('profiles')
          .select(
            `
            id,
            full_name,
            email,
            created_at,
            articles!articles_author_id_fkey (
              id,
              views,
              likes,
              created_at
            )
          `
          )
          .eq('role', 'admin');

        if (authorsError) {
          throw authorsError;
        }

        data = authorsData || [];
        columns = [
          { key: 'full_name', label: 'Name', type: 'string' },
          { key: 'email', label: 'Email', type: 'string' },
          { key: 'articles_count', label: 'Articles', type: 'number' },
          { key: 'total_views', label: 'Total Views', type: 'number' },
          { key: 'total_likes', label: 'Total Likes', type: 'number' },
          {
            key: 'avg_views_per_article',
            label: 'Avg Views/Article',
            type: 'number',
          },
          { key: 'created_at', label: 'Joined', type: 'date' },
        ];

        data = data.map(author => {
          const articles = author.articles || [];
          const totalViews = articles.reduce(
            (sum: number, article: any) => sum + (article.views || 0),
            0
          );
          const totalLikes = articles.reduce(
            (sum: number, article: any) => sum + (article.likes || 0),
            0
          );

          return {
            id: author.id,
            full_name: author.full_name || 'Unknown',
            email: author.email,
            articles_count: articles.length,
            total_views: totalViews,
            total_likes: totalLikes,
            avg_views_per_article:
              articles.length > 0
                ? Math.round(totalViews / articles.length)
                : 0,
            created_at: new Date(author.created_at).toLocaleDateString(),
          };
        });
        break;

      default:
        throw new Error('Invalid data source');
    }

    // Generate chart data based on groupBy and metrics
    let chartData: any[] = [];

    if (config.groupBy.includes('created_date') && config.metrics.length > 0) {
      // Group by date
      const dateGroups = new Map();

      data.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dateGroups.has(date)) {
          dateGroups.set(date, { name: date, count: 0, views: 0, likes: 0 });
        }

        const group = dateGroups.get(date);
        group.count++;
        if (item.views) group.views += item.views;
        if (item.likes) group.likes += item.likes;
      });

      chartData = Array.from(dateGroups.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } else if (config.groupBy.includes('category')) {
      // Group by category
      const categoryGroups = new Map();

      data.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, {
            name: category,
            count: 0,
            views: 0,
            likes: 0,
          });
        }

        const group = categoryGroups.get(category);
        group.count++;
        if (item.views) group.views += item.views;
        if (item.likes) group.likes += item.likes;
      });

      chartData = Array.from(categoryGroups.values());
    } else {
      // Default: use raw data for chart
      chartData = data.slice(0, 20).map(item => ({
        name: item.title || item.name || item.full_name,
        value: item.views || item.articles_count || item.total_content || 1,
      }));
    }

    const response = {
      data,
      summary: {
        totalRecords: data.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        generatedAt: new Date().toISOString(),
      },
      chartData,
      metadata: {
        columns,
        filters: config.filters,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Report generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
