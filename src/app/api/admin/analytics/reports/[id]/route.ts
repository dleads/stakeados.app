import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Implement when admin_reports table is available
    // const reportId = params.id;
    // Verify the report belongs to the user
    // const { data: report } = await supabase
    //   .from('admin_reports')
    //   .select('created_by')
    //   .eq('id', reportId)
    //   .single();

    // if (!report || report.created_by !== user.id) {
    //   return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    // }

    // Delete the report
    // const { error } = await supabase
    //   .from('admin_reports')
    //   .delete()
    //   .eq('id', reportId);

    // if (error) {
    //   throw error;
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Implement when admin_reports table is available
    // const reportId = params.id;
    const {
      name: _name,
      description: _description,
      config: _config,
      is_favorite: _is_favorite,
    } = await request.json();
    // Verify the report belongs to the user
    // const { data: report } = await supabase
    //   .from('admin_reports')
    //   .select('created_by')
    //   .eq('id', reportId)
    //   .single();

    // if (!report || report.created_by !== user.id) {
    //   return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    // }

    // Update the report
    // const updateData: any = { updated_at: new Date().toISOString() };

    // if (name !== undefined) updateData.name = name;
    // if (description !== undefined) updateData.description = description;
    // if (config !== undefined) updateData.config = config;
    // if (is_favorite !== undefined) updateData.is_favorite = is_favorite;

    // const { data: updatedReport, error } = await supabase
    //   .from('admin_reports')
    //   .update(updateData)
    //   .eq('id', reportId)
    //   .select()
    //   .single();

    // if (error) {
    //   throw error;
    // }

    // return NextResponse.json(updatedReport);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
