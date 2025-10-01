import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { DatabaseExtended } from '@/types/database-extended';

export async function createClient() {
  try {
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
            }
          },
        },
      }
    );
  } catch (_e) {
    // Fallback when cookies() is unavailable (e.g., during prerender)
    return createServerClient<DatabaseExtended>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [] as any;
          },
          setAll() {
            // no-op in prerender
          },
        },
      }
    );
  }
}

// Backward-compat: some routes import createServerClient from this module
export { createServerClient };
// Note: do NOT instantiate at module scope to avoid build-time env issues on Netlify
