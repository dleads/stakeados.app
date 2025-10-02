import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { DatabaseExtended } from '@/types/database-extended';

// Singleton instance for browser client optimization
let _client: ReturnType<typeof createBrowserClient<DatabaseExtended>> | null = null;
let _serverClient: ReturnType<typeof createServerClient<DatabaseExtended>> | null = null;

// Optimized client creation for browser environment
export const createClient = () => {
  if (typeof window === 'undefined') {
    // SSR-safe fallback: create a server client without cookies (read-only friendly)
    if (!_serverClient) {
      _serverClient = createServerClient<DatabaseExtended>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return [] as any;
            },
            setAll() {
              // no-op during prerender/SSR fallback
            },
          },
        }
      );
    }
    return _serverClient as any;
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
