import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { tagServiceServer } from '@/lib/services/tagService.server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deletedCount = await tagServiceServer.cleanupUnusedTags();

    return NextResponse.json({ deletedCount });
  } catch (error) {
    console.error('Error cleaning up tags:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup tags' },
      { status: 500 }
    );
  }
}
