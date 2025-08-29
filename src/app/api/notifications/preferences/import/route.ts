import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { NotificationPreferencesServiceServer } from '@/lib/services/notificationPreferencesService.server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.preferences) {
      return NextResponse.json(
        { error: 'Missing preferences data' },
        { status: 400 }
      );
    }

    const preferencesJson =
      typeof body.preferences === 'string'
        ? body.preferences
        : JSON.stringify(body.preferences);

    const preferences = await new NotificationPreferencesServiceServer(supabase).importPreferences(
      user.id,
      preferencesJson
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error importing notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to import notification preferences' },
      { status: 500 }
    );
  }
}
