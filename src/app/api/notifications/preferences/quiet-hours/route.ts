import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationPreferencesServiceServer } from '@/lib/services/notificationPreferencesService.server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new NotificationPreferencesServiceServer(supabase);
    const prefs = await service.getUserPreferences(user.id);
    // Compute quiet hours locally
    const toMinutes = (hhmm?: string | null) =>
      hhmm ? (() => { const [h,m] = hhmm.split(':').map(Number); return (h%24)*60 + (m%60); })() : null;
    const now = new Date();
    const cur = now.getHours()*60 + now.getMinutes();
    const s = toMinutes(prefs.quietHoursStart);
    const e = toMinutes(prefs.quietHoursEnd);
    let inQuietHours = false;
    if (s !== null && e !== null) {
      inQuietHours = s > e ? (cur >= s || cur < e) : (cur >= s && cur < e);
    }
    const status = { inQuietHours };

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error checking quiet hours status:', error);
    return NextResponse.json(
      { error: 'Failed to check quiet hours status' },
      { status: 500 }
    );
  }
}
