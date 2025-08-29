import { createClient } from './server';
import type { Database } from './types';

type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];

export async function createCourseServer(course: CourseInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .insert(course as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourseServer(id: string, updates: CourseUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses' as any)
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourseServer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('courses' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true } as const;
}

export async function toggleCoursePublicationServer(
  id: string,
  isPublished: boolean
) {
  return updateCourseServer(id, { published: isPublished } as any);
}

export async function enrollUserInCourseServer(userId: string, courseId: string) {
  const supabase = await createClient();
  const { data: existing, error: checkError } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .limit(1);

  if (checkError) throw checkError;
  if (existing && existing.length > 0) {
    return { alreadyEnrolled: true } as const;
  }

  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      course_id: courseId,
      content_id: 'enrollment',
      created_at: new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error) throw error;
  return { data, alreadyEnrolled: false } as const;
}
