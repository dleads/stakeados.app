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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resource_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('user_activity_log')
      .select(
        `
        *,
        user:profiles!user_activity_log_user_id_fkey(
          full_name,
          email,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (search) {
      // Search in action, resource_type, or user details
      query = query.or(
        `action.ilike.%${search}%,resource_type.ilike.%${search}%`
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true });

    // Get paginated results
    const { data: activities, error } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      activities: activities || [],
      totalPages,
      currentPage: page,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error('Error in activity GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }
    const supabase = admin.supabase!;

    const activityData = await request.json();
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Log the activity
    const { data: activity, error } = await supabase
      .from('user_activity_log')
      .insert({
        user_id: activityData.user_id || admin.user!.id,
        action: activityData.action,
        resource_type: activityData.resource_type,
        resource_id: activityData.resource_id,
        details: activityData.details || {},
        ip_address: clientIP,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error in activity POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
