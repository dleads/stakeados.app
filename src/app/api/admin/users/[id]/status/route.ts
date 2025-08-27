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
        { error: admin.error },
        { status: admin.status }
      );
    }
    const supabase = admin.supabase!;

    const { is_active } = await request.json();
    const userId = params.id;

    // Prevent admin from deactivating themselves
    if (userId === admin.user!.id && !is_active) {
      return NextResponse.json(
        {
          error: 'Cannot deactivate your own account',
        },
        { status: 400 }
      );
    }

    // Update user status in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating user status:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user status PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
