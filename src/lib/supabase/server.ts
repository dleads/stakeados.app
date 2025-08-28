import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/types/database-extended';

let supabaseServerInstance: ReturnType<
  typeof createSupabaseClient<DatabaseExtended>
> | null = null;

export const createClient = () => {
  if (!supabaseServerInstance) {
    const supabaseUrl =
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase server env vars. Set SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    supabaseServerInstance = createSupabaseClient<DatabaseExtended>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseServerInstance;
};

// Note: do NOT instantiate at module scope to avoid build-time env issues on Netlify
