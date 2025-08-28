import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export async function createServerClient() {
  return createSupabaseServerClient();
}

export async function getServerSession() {
  const sb = await createServerClient();

  try {
    const {
      data: { session },
      error,
    } = await sb.auth.getSession();
    return { session, error };
  } catch (error) {
    return { session: null, error };
  }
}

export async function requireAuth() {
  const { session, error } = await getServerSession();

  if (error || !session) {
    throw new Error('Authentication required');
  }

  return session;
}

export async function getCurrentUser() {
  const { session } = await getServerSession();
  return session?.user || null;
}
