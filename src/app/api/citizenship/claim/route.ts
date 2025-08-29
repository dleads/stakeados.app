import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { citizenshipService } from '@/lib/services/citizenshipService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nftTokenId } = body;

    // Check if user is eligible
    const isEligible = await citizenshipService.checkCitizenshipEligibility(
      user.id
    );

    if (!isEligible) {
      return NextResponse.json(
        { error: 'User is not eligible for citizenship NFT' },
        { status: 403 }
      );
    }

    // Check if already claimed
    // Note: citizenship_nft_claimed column doesn't exist in profiles table
    // This check is disabled for now
    /*
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('citizenship_nft_claimed')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    if (profile?.citizenship_nft_claimed) {
      return NextResponse.json(
        { error: 'Citizenship NFT already claimed' },
        { status: 409 }
      )
    }
    */

    // Mark as claimed
    await citizenshipService.markCitizenshipNFTClaimed(user.id);

    return NextResponse.json({
      success: true,
      message: 'Citizenship NFT claimed successfully',
      nftTokenId,
    });

    return NextResponse.json({
      success: true,
      message: 'Citizenship NFT claimed successfully',
      nftTokenId,
    });
  } catch (error) {
    console.error('Error claiming citizenship NFT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
