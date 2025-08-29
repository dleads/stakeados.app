import { NextRequest, NextResponse } from 'next/server';
import { PublicationWorkflowServiceServer } from '@/lib/services/publicationWorkflowService.server';

export async function POST(_request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or scheduled task
    // In production, you'd want to add authentication/authorization

    const result =
      await PublicationWorkflowServiceServer.processScheduledPublications();

    return NextResponse.json({
      message: 'Scheduled publications processed',
      ...result,
    });
  } catch (error) {
    console.error('Error processing scheduled publications:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled publications' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe =
      (searchParams.get('timeframe') as 'week' | 'month' | 'quarter') ||
      'month';

    const analytics =
      await PublicationWorkflowServiceServer.getWorkflowAnalytics(timeframe);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error getting workflow analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow analytics' },
      { status: 500 }
    );
  }
}
