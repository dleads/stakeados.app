import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enrollUserInCourseServer } from '@/lib/supabase/courses.server';
import { createClient } from '@/lib/supabase/server';

const enrollSchema = z.object({ userId: z.string().min(1) });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: courseId } = params;
    const body = await req.json();
    const { userId } = enrollSchema.parse(body);

    const result = await enrollUserInCourseServer(userId, courseId);
    return NextResponse.json(result);
  } catch (err: any) {
    const message = err?.message || 'Failed to enroll user in course';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
