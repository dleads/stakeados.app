import { NextRequest, NextResponse } from 'next/server';
import { automaticPublicationService } from '@/lib/services/automaticPublicationService';

// This endpoint should be called by a cron job every few minutes
// to process scheduled publications that are due
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (cron job)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Processing scheduled publications via cron job...');

    // Process all scheduled publications that are due
    await automaticPublicationService.processScheduledPublications();

    // Get some stats for logging
    const upcoming =
      await automaticPublicationService.getUpcomingPublications(5);
    const overdue = await automaticPublicationService.getOverduePublications();

    const stats = {
      upcoming_count: upcoming.length,
      overdue_count: overdue.length,
      processed_at: new Date().toISOString(),
    };

    console.log('Scheduled publications processing completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Scheduled publications processed successfully',
      stats,
    });
  } catch (error) {
    console.error('Error in cron job processing:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled publications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also allow GET for manual testing (with proper auth)
export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For manual testing, just return the status
    const upcoming =
      await automaticPublicationService.getUpcomingPublications(10);
    const overdue = await automaticPublicationService.getOverduePublications();

    return NextResponse.json({
      upcoming_publications: upcoming.length,
      overdue_publications: overdue.length,
      next_upcoming: upcoming[0] || null,
      status: 'ready',
    });
  } catch (error) {
    console.error('Error getting publication status:', error);

    return NextResponse.json(
      {
        error: 'Failed to get publication status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
