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

    const preferencesJson =
      await new NotificationPreferencesServiceServer(supabase).exportPreferences(user.id);

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
