import { createBrowserClient } from '@supabase/ssr';
import type { DatabaseExtended } from '@/types/database-extended';

// Singleton instance for browser client optimization
let _client: ReturnType<typeof createBrowserClient<DatabaseExtended>> | null = null;

// Optimized client creation for browser environment
export const createClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Browser client cannot be used on the server. Use createServerClient instead.');
  }

  if (!_client) {
    _client = createBrowserClient<DatabaseExtended>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  return _client;
};

// Backward-compatible instance for legacy code
// SSR-safe: throws clear error if accessed on server
export const supabase = (() => {
  if (typeof window === 'undefined') {
    return new Proxy(
      {},
      {
        get() {
          throw new Error('Legacy supabase instance accessed on server. Use createServerClient instead.');
        },
      }
    );
  }
  return createClient();
})();
