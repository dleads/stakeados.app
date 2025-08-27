import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/types/database-extended';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseAnonInstance: ReturnType<
  typeof createSupabaseClient<DatabaseExtended>
> | null = null;

export const createAnonClient = () => {
  if (!supabaseAnonInstance) {
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
