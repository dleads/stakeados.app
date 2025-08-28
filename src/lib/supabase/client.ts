import { createBrowserClient } from '@supabase/ssr';
import type { DatabaseExtended } from '@/types/database-extended';

// Crear cliente de Supabase para el lado del cliente
export const createClient = () =>
  createBrowserClient<DatabaseExtended>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1];
          return cookie || '';
        },
        set: (name: string, value: string, options: any) => {
          document.cookie = `${name}=${value}; ${Object.entries(options)
            .map(([key, val]) => `${key}=${val}`)
            .join('; ')}`;
        },
        remove: (name: string, options: any) => {
          document.cookie = `${name}=; Max-Age=0; ${Object.entries(options)
            .map(([key, val]) => `${key}=${val}`)
            .join('; ')}`;
        },
      },
    }
  );

// Backward-compatible instance for modules importing { supabase }
// SSR-safe: only instantiate on the client. On the server, expose a proxy that throws if accessed.
let _client: ReturnType<typeof createClient> | null = null;
export const supabase = ((): any => {
  if (typeof window === 'undefined') {
    return new Proxy(
      {},
      {
        get() {
          throw new Error('Supabase browser client accessed on the server. Use server client instead.');
        },
      }
    );
  }
  if (!_client) _client = createClient();
  return _client;
})();
