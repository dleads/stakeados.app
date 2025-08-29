import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { NotificationPreferencesServiceServer } from '@/lib/services/notificationPreferencesService.server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new NotificationPreferencesServiceServer(supabase);
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
