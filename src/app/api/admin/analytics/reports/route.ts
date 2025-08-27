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

    // TODO: Implement when admin_reports table is available
    // Get saved reports for the user
    // const { data: reports, error } = await supabase
    //   .from('admin_reports')
    //   .select('*')
    //   .eq('created_by', admin.user.id)
    //   .order('updated_at', { ascending: false });

    // if (error) {
    //   throw error;
    // }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Get reports API error:', error);
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

    const { name, description, config } = await request.json();

    if (!name || !config) {
      return NextResponse.json(
        { error: 'Name and config are required' },
        { status: 400 }
      );
    }

    // TODO: Create the admin_reports table when database schema is finalized
    // Create the admin_reports table if it doesn't exist
    // const createTableQuery = `
    //   CREATE TABLE IF NOT EXISTS admin_reports (
    //     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    //     name TEXT NOT NULL,
    //     description TEXT,
    //     config JSONB NOT NULL,
    //     created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    //     created_at TIMESTAMPTZ DEFAULT NOW(),
    //     updated_at TIMESTAMPTZ DEFAULT NOW(),
    //     last_run TIMESTAMPTZ,
    //     is_favorite BOOLEAN DEFAULT FALSE
    //   );
    // `;

    // await supabase.rpc('exec_sql', { sql: createTableQuery });

    // TODO: Implement when admin_reports table is available
    // Insert the new report
    // const { data: report, error } = await supabase
    //   .from('admin_reports')
    //   .insert({
    //     name,
    //     description,
    //     config,
    //     created_by: admin.user.id
    //   })
    //   .select()
    //   .single();

    // if (error) {
    //   throw error;
    // }

    return NextResponse.json({
      id: 'temp-id',
      name,
      description,
      config,
      created_by: admin.user.id,
    });
  } catch (error) {
    console.error('Create report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
