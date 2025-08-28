import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
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

    const preferencesJson =
      await new NotificationPreferencesService(supabase).exportPreferences(user.id);

    return new NextResponse(preferencesJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition':
          'attachment; filename="notification-preferences.json"',
      },
    });
  } catch (error) {
    console.error('Error exporting notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to export notification preferences' },
      { status: 500 }
    );
  }
}
