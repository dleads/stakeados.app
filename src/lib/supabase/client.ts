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

