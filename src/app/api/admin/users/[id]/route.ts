import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase!;

    const userData = await request.json();
    const userId = params.id;

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    // Update user metadata via Auth Admin API if needed
    if (userData.full_name || userData.role) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            full_name: userData.full_name,
            role: userData.role,
          },
        }
      );

      if (authError) {
        console.error('Error updating user metadata:', authError);
        // Don't fail the request if metadata update fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
