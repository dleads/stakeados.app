import { createClient } from '@/lib/supabase/server';

export async function listUsers(limit = 50) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles' as any)
    .select('id, display_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function updateUserRole(
  id: string,
  role: 'admin' | 'editor' | 'user'
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles' as any)
    .update({ role })
    .eq('id', id)
    .select('id, role')
    .single();
  if (error) throw error;
  return data;
}
