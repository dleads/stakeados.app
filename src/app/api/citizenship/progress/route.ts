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
    const userId = searchParams.get('userId') || user.id;

    // Get citizenship progress
    const progress =
      await citizenshipService.calculateCitizenshipProgress(userId);

    if (!progress) {
      return NextResponse.json(
        { error: 'Progress not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching citizenship progress:', error);
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
    const { userId, action } = body;

    const targetUserId = userId || user.id;

    if (action === 'check_eligibility') {
      // Check and update citizenship status
      const result =
        await citizenshipService.checkAndUpdateCitizenshipStatus(targetUserId);

      return NextResponse.json({
        ...result,
        message: result.newlyEligible
          ? 'Congratulations! You are now eligible for citizenship NFT!'
          : 'Citizenship status checked',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in citizenship progress API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
