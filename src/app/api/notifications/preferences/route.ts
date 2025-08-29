import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { NotificationPreferencesServiceServer } from '@/lib/services/notificationPreferencesService.server';
import type { NotificationPreferences } from '@/types/notifications';

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

    const preferences = await new NotificationPreferencesServiceServer(supabase).getUserPreferences(
      user.id
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<NotificationPreferences>;

    // Validate digest frequency if provided
    if (
      body.digestFrequency &&
      !['none', 'daily', 'weekly'].includes(body.digestFrequency)
    ) {
      return NextResponse.json(
        { error: 'Invalid digest frequency' },
        { status: 400 }
      );
    }

    // Validate time format if provided
    if (
      body.quietHoursStart &&
      !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(body.quietHoursStart)
    ) {
      return NextResponse.json(
        { error: 'Invalid quiet hours start time format' },
        { status: 400 }
      );
    }

    if (
      body.quietHoursEnd &&
      !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(body.quietHoursEnd)
    ) {
      return NextResponse.json(
        { error: 'Invalid quiet hours end time format' },
        { status: 400 }
      );
    }

    const preferences =
      await new NotificationPreferencesServiceServer(supabase).updateUserPreferences(user.id, body);

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const supabase = createServerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await new NotificationPreferencesServiceServer(supabase).resetToDefaults(
      user.id
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to reset notification preferences' },
      { status: 500 }
    );
  }
}
