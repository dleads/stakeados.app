export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase!;

    // Get backup configuration from system settings
    const { data: settings, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', 'backup_config')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching backup config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    // Default configuration if none exists
    const defaultConfig = {
      automatic: {
        enabled: false,
        frequency: '0 2 * * *', // Daily at 2 AM
        retention: 30, // days
        includeMedia: true,
        compression: true,
      },
      storage: {
        type: 'local',
        path: '/backups',
        credentials: {},
      },
    };

    const config = settings?.value || defaultConfig;

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in backup config GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase!;

    const config = await request.json();

    // Validate configuration
    if (!config.automatic || !config.storage) {
      return NextResponse.json(
        { error: 'Invalid configuration structure' },
        { status: 400 }
      );
    }

    // Upsert configuration
    const { error } = await (supabase as any).from('system_settings').upsert({
      key: 'backup_config',
      value: config,
      updated_by: admin.user.id,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving backup config:', error);
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in backup config PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
