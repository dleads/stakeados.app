import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/types/database-extended';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabaseServerInstance: ReturnType<
  typeof createSupabaseClient<DatabaseExtended>
> | null = null;

export const createClient = () => {
  if (!supabaseServerInstance) {
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

// Default server client instance
export const supabaseServer = createClient();
