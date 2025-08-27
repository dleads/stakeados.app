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

    // Get storage statistics from content_uploads table
    const query = await (supabase as any)
      .from('content_uploads')
      .select('file_size, file_type, created_at');
    const error = (query as any).error;
    const uploads = ((query as any).data as any[]) || [];

    if (error) {
      console.error('Error fetching storage stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch storage statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalUsed = uploads.reduce(
      (sum: number, upload: any) => sum + (upload.file_size || 0),
      0
    );
    const totalLimit = 10 * 1024 * 1024 * 1024; // 10GB default limit
    const fileCount = uploads?.length || 0;

    // Categorize files by type
    const breakdown = {
      images: { count: 0, size: 0 },
      documents: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
    };

    uploads.forEach((upload: any) => {
      const size = upload.file_size || 0;
      if (upload.file_type?.startsWith('image/')) {
        breakdown.images.count++;
        breakdown.images.size += size;
      } else if (upload.file_type?.startsWith('video/')) {
        breakdown.videos.count++;
        breakdown.videos.size += size;
      } else if (
        upload.file_type?.includes('pdf') ||
        upload.file_type?.includes('document')
      ) {
        breakdown.documents.count++;
        breakdown.documents.size += size;
      } else {
        breakdown.other.count++;
        breakdown.other.size += size;
      }
    });

    const stats = {
      totalUsed,
      totalLimit,
      fileCount,
      breakdown,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in storage stats GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
