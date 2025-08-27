import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { NotificationPreferencesService } from '@/lib/services/notificationPreferencesService';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new NotificationPreferencesService(supabase);
    const status = await service.getQuietHoursStatus(user.id);

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error checking quiet hours status:', error);
    return NextResponse.json(
      { error: 'Failed to check quiet hours status' },
      { status: 500 }
    );
  }
}
