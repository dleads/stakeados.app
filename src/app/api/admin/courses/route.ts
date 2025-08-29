import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCourseServer } from '@/lib/supabase/courses.server';
import { createClient } from '@/lib/supabase/server';

const createCourseSchema = z.object({
  // Basic minimal validation; align with your DB schema as needed
  title: z.any(),
  description: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // Validate minimal shape (extend as required)
    createCourseSchema.parse(body);

    const data = await createCourseServer(body);
    return NextResponse.json(data);
  } catch (err: any) {
    const message = err?.message || 'Failed to create course';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
