import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data for now - in production this would come from your database
    const stats = {
      totalArticles: 156,
      totalNews: 342,
      totalCourses: 28,
      activeUsers: 1247,
      totalCategories: 12,
      totalTags: 89,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching homepage stats:', error);

    // Return fallback data on error
    const fallbackStats = {
      totalArticles: 100,
      totalNews: 250,
      totalCourses: 20,
      activeUsers: 1000,
      totalCategories: 10,
      totalTags: 50,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(fallbackStats, { status: 200 });
  }
}
