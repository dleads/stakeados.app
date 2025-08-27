import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { supabase } = authResult;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get all users with their profiles
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.display_name || '',
      avatar_url: user.avatar_url,
      role: user.role || 'user',
      permissions: [], // TODO: Implement permissions system
      last_sign_in_at: null, // Not available in profiles table
      created_at: user.created_at,
      is_active: true, // Not available in profiles table, default to true
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error in users GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { supabase } = authResult;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userData = await request.json();

    // Create user via Supabase Auth Admin API
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password || Math.random().toString(36).slice(-8), // Generate random password if not provided
        email_confirm: true,
        user_metadata: {
          display_name: userData.full_name,
          role: userData.role,
        },
      });

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Update profile with additional data
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: newUser.user.id,
      email: userData.email,
      display_name: userData.full_name,
      role: userData.role,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: newUser.user.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      is_active: userData.is_active ?? true,
    });
  } catch (error) {
    console.error('Error in users POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
