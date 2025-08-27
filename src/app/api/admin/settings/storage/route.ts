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

    // Get storage configuration from system settings
    const { data: settings, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', 'storage_config')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching storage config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    // Default configuration if none exists
    const defaultConfig = {
      limits: {
        maxFileSize: 10, // MB
        maxTotalStorage: 10, // GB
        allowedFileTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
          'video/mp4',
        ],
        imageOptimization: true,
        autoCleanup: false,
        cleanupAfterDays: 90,
      },
      cdn: {
        enabled: false,
        provider: 'cloudflare',
        baseUrl: '',
        apiKey: '',
        zoneId: '',
      },
      compression: {
        enabled: true,
        quality: 80,
        format: 'webp',
        generateThumbnails: true,
        thumbnailSizes: [150, 300, 600, 1200],
      },
    };

    const config = settings?.value || defaultConfig;

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in storage config GET:', error);
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
    if (!config.limits || !config.cdn || !config.compression) {
      return NextResponse.json(
        { error: 'Invalid configuration structure' },
        { status: 400 }
      );
    }

    // Upsert configuration
    const { error } = await (supabase as any).from('system_settings').upsert({
      key: 'storage_config',
      value: config,
      updated_by: admin.user.id,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving storage config:', error);
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in storage config PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
