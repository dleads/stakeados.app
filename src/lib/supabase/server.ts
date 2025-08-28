import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { DatabaseExtended } from '@/types/database-extended';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<DatabaseExtended>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component cannot write cookies
            // This is handled in middleware
          }
        },
      },
    }
  );
}

// Note: do NOT instantiate at module scope to avoid build-time env issues on Netlify
