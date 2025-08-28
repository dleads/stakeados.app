import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/types/database-extended';

let supabaseAnonInstance: ReturnType<
  typeof createSupabaseClient<DatabaseExtended>
> | null = null;

export const createAnonClient = () => {
  if (!supabaseAnonInstance) {
    const supabaseUrl =
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase anon env vars. Set SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }

    supabaseAnonInstance = createSupabaseClient<DatabaseExtended>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAnonInstance;
};
