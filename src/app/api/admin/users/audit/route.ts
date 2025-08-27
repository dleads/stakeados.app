import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }
    const supabase = admin.supabase!;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const userId = searchParams.get('user_id');

    // Build query
    let query = supabase
      .from('role_audit_log')
      .select(
        `
        *,
        user:profiles!role_audit_log_user_id_fkey(
          full_name,
          email,
          avatar_url
        ),
        changed_by_user:profiles!role_audit_log_changed_by_fkey(
          full_name,
          email,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply user filter if specified
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('role_audit_log')
      .select('*', { count: 'exact', head: true });

    if (userId) {
      countQuery = countQuery.eq('user_id', userId);
    }

    const { count } = await countQuery;

    // Get paginated results
    const { data: entries, error } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      console.error('Error fetching audit entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit entries' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      entries: entries || [],
      totalPages,
      currentPage: page,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error('Error in audit GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
