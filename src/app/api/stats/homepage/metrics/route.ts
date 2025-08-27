import { NextRequest, NextResponse } from 'next/server';
import { homepageStatsService } from '@/lib/services/homepageStatsService';

export const runtime = 'nodejs';

/**
 * Get homepage stats cache metrics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for admin authorization (you might want to add proper auth here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await homepageStatsService.getCacheMetrics();

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching cache metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cache metrics',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
