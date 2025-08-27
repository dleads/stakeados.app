import { NextRequest, NextResponse } from 'next/server';
import { ContentModerationService } from '@/lib/services/contentModerationService';

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (!item.id || !item.type || !item.content) {
        return NextResponse.json(
          { error: 'Each item must have id, type, and content' },
          { status: 400 }
        );
      }
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 items per batch' },
        { status: 400 }
      );
    }

    const results = await ContentModerationService.batchModerate(items);

    // Process results to separate successful and failed operations
    const processed = results.map((result, index) => ({
      id: items[index].id,
      status: result.status,
      ...(result.status === 'fulfilled'
        ? { result: result.value }
        : { error: result.reason?.message || 'Unknown error' }),
    }));

    const successful = processed.filter(r => r.status === 'fulfilled').length;
    const failed = processed.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      total: items.length,
      successful,
      failed,
      results: processed,
    });
  } catch (error) {
    console.error('Error in batch moderation:', error);
    return NextResponse.json(
      { error: 'Failed to process batch moderation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    if (daysOld < 1 || daysOld > 365) {
      return NextResponse.json(
        { error: 'daysOld must be between 1 and 365' },
        { status: 400 }
      );
    }

    await ContentModerationService.cleanupOldEntries(daysOld);

    return NextResponse.json({
      message: `Cleaned up moderation entries older than ${daysOld} days`,
    });
  } catch (error) {
    console.error('Error cleaning up moderation entries:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup old entries' },
      { status: 500 }
    );
  }
}
