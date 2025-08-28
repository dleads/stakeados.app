import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/types/database-extended';

let supabaseAnonInstance: ReturnType<
  typeof createSupabaseClient<DatabaseExtended>
> | null = null;

// Optimized anonymous client for server-side operations that don't need auth
export const createAnonClient = () => {
  if (!supabaseAnonInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
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
