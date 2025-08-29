import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateCourseServer, deleteCourseServer } from '@/lib/supabase/courses.server';
import { createClient } from '@/lib/supabase/server';

const updateCourseSchema = z.record(z.string(), z.any());

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    updateCourseSchema.parse(body);

    const data = await updateCourseServer(id, body);
    return NextResponse.json(data);
  } catch (err: any) {
    const message = err?.message || 'Failed to update course';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await deleteCourseServer(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const message = err?.message || 'Failed to delete course';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
