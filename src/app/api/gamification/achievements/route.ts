import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { gamificationService } from '@/lib/services/gamificationService';

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

    // TODO: Implement when contributor_achievements table is created
    // Return mock achievements for now
    const mockAchievements = [
      {
        id: '1',
        user_id: userId,
        achievement_type: 'first_article',
        title: 'First Article',
        description: 'Published your first article',
        earned_at: new Date().toISOString(),
        points: 100,
      },
      {
        id: '2',
        user_id: userId,
        achievement_type: 'community_contributor',
        title: 'Community Contributor',
        description: 'Made 10 community contributions',
        earned_at: new Date().toISOString(),
        points: 250,
      },
    ];

    return NextResponse.json({
      achievements: mockAchievements,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { userId } = body;

    // Check and award new achievements
    const newAchievements = await gamificationService.checkAndAwardAchievements(
      userId || user.id
    );

    return NextResponse.json({
      newAchievements,
      message: `${newAchievements.length} new achievements awarded`,
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
