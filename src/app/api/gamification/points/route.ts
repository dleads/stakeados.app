import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { gamificationService } from '@/lib/services/gamificationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      contentId,
      contentType,
      contributionType,
      basePoints,
      qualityScore,
    } = body;

    // Validate required fields
    if (!userId || !contentId || !contentType || !contributionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Award points
    const contribution = await gamificationService.awardContentPoints({
      userId,
      contentId,
      contentType,
      contributionType,
      basePoints,
      qualityScore,
    });

    if (!contribution) {
      return NextResponse.json(
        { error: 'Failed to award points' },
        { status: 500 }
      );
    }

    // Check for new achievements
    const newAchievements =
      await gamificationService.checkAndAwardAchievements(userId);

    return NextResponse.json({
      contribution,
      newAchievements,
      message: 'Points awarded successfully',
    });
  } catch (error) {
    console.error('Error in points API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user contributions
    const contributions = await gamificationService.getUserContributions(
      userId,
      limit
    );

    // Get points breakdown
    const breakdown = await gamificationService.getPointsBreakdown(userId);

    return NextResponse.json({
      contributions,
      breakdown,
    });
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
