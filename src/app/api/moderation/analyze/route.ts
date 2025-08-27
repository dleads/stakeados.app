import { NextRequest, NextResponse } from 'next/server';
import { ContentModerationService } from '@/lib/services/contentModerationService';

export async function POST(request: NextRequest) {
  try {
    const { content, title, contentId, contentType } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // If contentId and contentType are provided, perform auto-moderation
    if (contentId && contentType) {
      const result = await ContentModerationService.autoModerateContent(
        contentId,
        contentType,
        content,
        title
      );

      return NextResponse.json(result);
    }

    // Otherwise, just analyze the content
    const analysis = await ContentModerationService.analyzeContent(
      content,
      title
    );

    return NextResponse.json({
      flagged: analysis.moderation.flagged,
      analysis,
    });
  } catch (error) {
    console.error('Error in moderation analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe =
      (searchParams.get('timeframe') as 'day' | 'week' | 'month') || 'week';

    const stats = await ContentModerationService.getModerationStats(timeframe);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting moderation stats:', error);
    return NextResponse.json(
      { error: 'Failed to get moderation statistics' },
      { status: 500 }
    );
  }
}
