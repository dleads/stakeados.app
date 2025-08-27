import { NextRequest, NextResponse } from 'next/server';
import { queryOptimizer } from '@/lib/database/queryOptimizer';
import { contentCache } from '@/lib/cache/contentCache';

async function getPerformanceData(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'queries':
        const queryStats = await queryOptimizer.getQueryPerformanceStats();
        return NextResponse.json({ data: queryStats });

      case 'tables':
        const tableStats = await queryOptimizer.getTableStats();
        return NextResponse.json({ data: tableStats });

      case 'indexes':
        const indexStats = await queryOptimizer.getIndexUsageStats();
        return NextResponse.json({ data: indexStats });

      case 'cache':
        const cacheStats = await contentCache.getCacheStats();
        return NextResponse.json({ data: cacheStats });

      case 'overview':
      default:
        const [queries, tables, indexes, cache] = await Promise.all([
          queryOptimizer.getQueryPerformanceStats(),
          queryOptimizer.getTableStats(),
          queryOptimizer.getIndexUsageStats(),
          contentCache.getCacheStats(),
        ]);

        return NextResponse.json({
          data: {
            queries: queries.slice(0, 5), // Top 5 slow queries
            tables: tables.slice(0, 10), // Top 10 largest tables
            indexes: indexes
              .filter(idx => idx.usageLevel === 'Unused')
              .slice(0, 5), // Unused indexes
            cache: cache,
            summary: {
              totalQueries: queries.length,
              totalTables: tables.length,
              totalIndexes: indexes.length,
              cacheConnected: cache?.connected || false,
            },
          },
        });
    }
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'refresh_views':
        const refreshResult = await queryOptimizer.refreshMaterializedViews();
        return NextResponse.json({ success: refreshResult });

      case 'update_counts':
        const updateResult = await queryOptimizer.updateArticleViewCounts();
        return NextResponse.json({ success: updateResult });

      case 'clear_cache':
        await contentCache.clearAllCache();
        return NextResponse.json({ success: true });

      case 'analyze_query':
        const { query } = await request.json();
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required' },
            { status: 400 }
          );
        }

        const analysis = await queryOptimizer.analyzeQueryPerformance(query);
        return NextResponse.json({ data: analysis });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute performance action' },
      { status: 500 }
    );
  }
}

// Export GET function
export async function GET(request: NextRequest) {
  return getPerformanceData(request);
}
