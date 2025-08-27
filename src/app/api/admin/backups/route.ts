import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Check if user is authenticated and has admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get backups from system_backups table (if it exists)
    // For now, return mock data since we don't have the table structure
    const mockBackups = [
      {
        id: '1',
        name: 'Automatic Backup - ' + new Date().toLocaleDateString(),
        size: 1024 * 1024 * 50, // 50MB
        createdAt: new Date().toISOString(),
        type: 'automatic',
        status: 'completed',
        includesMedia: true,
      },
      {
        id: '2',
        name:
          'Manual Backup - ' +
          new Date(Date.now() - 86400000).toLocaleDateString(),
        size: 1024 * 1024 * 45, // 45MB
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        type: 'manual',
        status: 'completed',
        includesMedia: false,
      },
    ];

    return NextResponse.json(mockBackups);
  } catch (error) {
    console.error('Error in backups GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated and has admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const backupData = await request.json();

    // Create a new backup (mock implementation)
    const newBackup = {
      id: Date.now().toString(),
      name: `Manual Backup - ${new Date().toLocaleDateString()}`,
      size: Math.floor(Math.random() * 1024 * 1024 * 100), // Random size up to 100MB
      createdAt: new Date().toISOString(),
      type: backupData.type || 'manual',
      status: 'in_progress',
      includesMedia: backupData.includeMedia || false,
    };

    // In a real implementation, you would:
    // 1. Create a backup job
    // 2. Export database data
    // 3. Optionally include media files
    // 4. Compress the backup
    // 5. Store it in the configured location

    // Simulate backup completion after a delay
    setTimeout(() => {
      // Update backup status to completed
      console.log(`Backup ${newBackup.id} completed`);
    }, 5000);

    return NextResponse.json(newBackup);
  } catch (error) {
    console.error('Error in backups POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
