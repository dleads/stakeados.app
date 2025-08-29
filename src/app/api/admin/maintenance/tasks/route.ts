import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

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

    // Return predefined maintenance tasks
    const maintenanceTasks = [
      {
        id: 'cleanup-old-files',
        name: 'Cleanup Old Files',
        description: 'Remove unused files and optimize storage',
        lastRun: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
        nextRun: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'idle',
      },
      {
        id: 'optimize-database',
        name: 'Optimize Database',
        description: 'Analyze and optimize database performance',
        lastRun: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
        nextRun: new Date(Date.now() + 86400000 * 4).toISOString(), // In 4 days
        status: 'idle',
      },
      {
        id: 'update-search-index',
        name: 'Update Search Index',
        description: 'Rebuild search indexes for better performance',
        lastRun: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        nextRun: new Date(Date.now() + 86400000 * 6).toISOString(), // In 6 days
        status: 'idle',
      },
      {
        id: 'generate-sitemaps',
        name: 'Generate Sitemaps',
        description: 'Update XML sitemaps for search engines',
        status: 'idle',
      },
    ];

    return NextResponse.json(maintenanceTasks);
  } catch (error) {
    console.error('Error in maintenance tasks GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
