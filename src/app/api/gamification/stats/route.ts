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

    // Get contributor stats
    const stats = await gamificationService.getContributorStats(userId);

    if (!stats) {
      return NextResponse.json({ error: 'Stats not found' }, { status: 404 });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching contributor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
