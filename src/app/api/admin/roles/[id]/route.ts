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
    const supabase = admin.supabase as any;

    const roleData = await request.json();
    const roleId = params.id;

    // Check if it's a system role (cannot be modified)
    const { data: existingRole } = await (supabase as any)
      .from('user_roles')
      .select('is_system')
      .eq('id', roleId)
      .single();

    if (existingRole?.is_system) {
      return NextResponse.json(
        {
          error: 'Cannot modify system roles',
        },
        { status: 400 }
      );
    }

    // Update custom role
    const { data: updatedRole, error } = await (supabase as any)
      .from('user_roles')
      .update({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error in role PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const supabase = admin.supabase as any;

    const roleId = params.id;

    // Check if it's a system role (cannot be deleted)
    const { data: existingRole } = await (supabase as any)
      .from('user_roles')
      .select('is_system, name')
      .eq('id', roleId)
      .single();

    if (existingRole?.is_system) {
      return NextResponse.json(
        {
          error: 'Cannot delete system roles',
        },
        { status: 400 }
      );
    }

    // Check if any users have this role
    const { count } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', existingRole?.name);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete role that is assigned to users',
        },
        { status: 400 }
      );
    }

    // Delete the role
    const { error } = await (supabase as any)
      .from('user_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      console.error('Error deleting role:', error);
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in role DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
