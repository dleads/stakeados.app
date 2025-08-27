import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

// Default system roles
const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'admin',
    description: 'Full system access',
    permissions: [
      'articles.create',
      'articles.edit',
      'articles.delete',
      'articles.publish',
      'articles.review',
      'news.create',
      'news.edit',
      'news.delete',
      'news.process',
      'categories.manage',
      'tags.manage',
      'users.manage',
      'settings.manage',
      'analytics.view',
      'backup.manage',
    ],
    is_system: true,
  },
  {
    id: 'student',
    name: 'student',
    description: 'Acceso básico de estudiante',
    permissions: [],
    is_system: true,
  },
];

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

    // Get custom roles from database
    const { data: customRoles, error } = await (supabase as any)
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    let warningHeader: string | null = null;
    if (error) {
      console.error('Error fetching custom roles:', error);
      // Continue with default roles only
      warningHeader = 'custom_roles_unavailable: falling back to default roles';
    }

    // Combine default roles with custom roles, avoiding duplicates
    const customRoleNames = ((customRoles as any[]) || []).map(
      (role: any) => role.name
    );
    const filteredDefaultRoles = DEFAULT_ROLES.filter(
      role => !customRoleNames.includes(role.name)
    );

    const allRoles = [...filteredDefaultRoles, ...(customRoles || [])];

    const response = NextResponse.json(allRoles);
    if (warningHeader) {
      response.headers.set('X-Roles-Warning', warningHeader);
    }
    return response;
  } catch (error) {
    console.error('Error in roles GET:', error);
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
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase as any;
    const user = (admin as any).user;

    const roleData = await request.json();

    // Create custom role
    const { data: newRole, error } = await (supabase as any)
      .from('user_roles')
      .insert({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      const msg = (error as any)?.message || '';
      const relationMissing =
        msg.includes('relation') && msg.includes('does not exist');
      return NextResponse.json(
        {
          error: relationMissing
            ? 'Custom roles store is unavailable in this phase'
            : 'Failed to create role',
        },
        { status: relationMissing ? 400 : 500 }
      );
    }

    return NextResponse.json({
      ...newRole,
      is_system: false,
    });
  } catch (error) {
    console.error('Error in roles POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
