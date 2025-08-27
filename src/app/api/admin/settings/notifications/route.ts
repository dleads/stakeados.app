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

    // Get notification configuration from system settings
    const { data: settings, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', 'notification_config')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    // Default configuration if none exists
    const defaultConfig = {
      email: {
        enabled: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromAddress: '',
        fromName: 'Stakeados Admin',
      },
      slack: {
        enabled: false,
        webhookUrl: '',
        channel: '#admin-notifications',
      },
      inApp: {
        enabled: true,
        retentionDays: 30,
      },
      rules: [
        {
          id: '1',
          name: 'Article Published',
          event: 'article_published',
          channels: ['inApp'],
          conditions: [],
          enabled: true,
        },
        {
          id: '2',
          name: 'System Error',
          event: 'system_error',
          channels: ['inApp', 'email'],
          conditions: [],
          enabled: true,
        },
      ],
    };

    const config = settings?.value || defaultConfig;

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in notification config GET:', error);
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
    if (!config.email || !config.slack || !config.inApp || !config.rules) {
      return NextResponse.json(
        { error: 'Invalid configuration structure' },
        { status: 400 }
      );
    }

    // Upsert configuration
    const { error } = await (supabase as any).from('system_settings').upsert({
      key: 'notification_config',
      value: config,
      updated_by: admin.user.id,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving notification config:', error);
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notification config PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
