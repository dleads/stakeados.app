export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { supabase } = authResult;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeAnalytics = searchParams.get('include_analytics') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener noticias
    const { data: news, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching news:', error);
      return NextResponse.json(
        { error: 'Failed to fetch news' },
        { status: 500 }
      );
    }

    // Calcular estadísticas si se solicitan
    let stats = null;
    if (includeAnalytics) {
      const { data: allNews } = await supabase
        .from('news')
        .select('processed, language');

      if (allNews) {
        const total = allNews.length;
        const processed = allNews.filter(n => n.processed).length;
        const unprocessed = total - processed;
        const byLanguage = allNews.reduce(
          (acc, n) => {
            const lang = n.language || 'unknown';
            acc[lang] = (acc[lang] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        stats = {
          total,
          processed,
          unprocessed,
          by_language: byLanguage,
          trending: Math.floor(Math.random() * 50) + 10, // Simulado
          sources: 4, // Simulado
        };
      }
    }

    return NextResponse.json({
      data: news,
      stats,
      pagination: {
        total: news?.length || 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('Error in news API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
