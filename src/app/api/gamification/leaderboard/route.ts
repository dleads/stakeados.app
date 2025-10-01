export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { gamificationServiceServer } from '@/lib/services/gamificationService.server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || 'points'; // points, articles, quality

    // Get leaderboard
    const leaderboard = await gamificationServiceServer.getLeaderboard(limit);

    // Sort based on type
    let sortedLeaderboard = leaderboard;
    switch (type) {
      case 'articles':
        sortedLeaderboard = leaderboard.sort(
          (a, b) => b.totalArticles - a.totalArticles
        );
        break;
      case 'quality':
        sortedLeaderboard = leaderboard.sort(
          (a, b) => b.averageQualityScore - a.averageQualityScore
        );
        break;
      case 'points':
      default:
        sortedLeaderboard = leaderboard.sort(
          (a, b) => b.totalPoints - a.totalPoints
        );
        break;
    }

    // Update rank positions based on sort
    sortedLeaderboard.forEach((entry, index) => {
      entry.rankPosition = index + 1;
    });

    return NextResponse.json({
      leaderboard: sortedLeaderboard,
      type,
      total: sortedLeaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
