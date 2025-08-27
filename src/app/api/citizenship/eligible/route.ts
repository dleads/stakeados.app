import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { citizenshipService } from '@/lib/services/citizenshipService';

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
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get eligible users
    const eligibleUsers = await citizenshipService.getEligibleUsers(limit);

    // Get citizenship statistics
    const stats = await citizenshipService.getCitizenshipStats();

    return NextResponse.json({
      eligibleUsers,
      stats,
    });
  } catch (error) {
    console.error('Error fetching eligible users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
