// Cliente del navegador - para Client Components
export { createClient } from './client';

// Cliente del servidor - para Server Components, Server Actions y Route Handlers  
export { createClient as createServerClient } from './server';

// Utilidades de middleware
export { updateSession } from './middleware';

// Re-export auth functions (server-side)
export { getUser, getCurrentUser } from './auth';

// Re-export backward-compatible instance for existing code
export { supabase } from './client';

// Anonymous client for server-side operations without auth
export { createAnonClient } from './anon';

// Re-export tipos útiles
export type { DatabaseExtended } from '@/types/database-extended';

import type { DatabaseExtended } from '@/types/database-extended';
import type { SupabaseClient } from '@supabase/supabase-js';

// Optimized admin client with service role key - singleton pattern
let _adminClient: SupabaseClient<DatabaseExtended> | null = null;

export const supabaseAdmin = (): SupabaseClient<DatabaseExtended> => {
  if (!_adminClient) {
    const { createClient } = require('@supabase/supabase-js');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
    
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    ) as SupabaseClient<DatabaseExtended>;
  }
  
  return _adminClient;
};
