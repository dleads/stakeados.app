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
    const supabase = admin.supabase as any;

    // Get files from content_uploads table
    const { data: uploads, error } = await (supabase as any)
      .from('content_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Limit to recent 100 files

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const files =
      uploads?.map((upload: any) => ({
        id: upload.id,
        name: upload.original_filename || 'Unknown',
        type: upload.file_type || 'application/octet-stream',
        size: upload.file_size || 0,
        url: upload.file_url || '',
        createdAt: upload.created_at,
        lastAccessed: upload.last_accessed_at,
        isOptimized: upload.is_optimized || false,
      })) || [];

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error in storage files GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
