import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

// TEMPORAL: Flag para debuggear - cambiar a true solo si se requiere simular admin
const DEBUG_MODE = false;

export async function getAuthenticatedUser(request: NextRequest) {
  // TEMPORAL: En modo debug, simular usuario admin
  if (DEBUG_MODE) {
    console.log('🔍 API Auth: Modo debug activado - simulando usuario admin');
    const supabase = createAnonClient();
    return {
      user: {
        id: '68e5e982-2c04-4352-8c96-565c10ea595a',
        email: 'hola@stakeados.com',
      } as any,
      supabase,
    };
  }

  try {
    // Método 1: Intentar con createRouteHandlerClient (método preferido)
    try {
      const cookieStore = cookies();
      const supabaseWithCookies = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 });
            },
          },
        }
      );

      const {
        data: { user: cookieUser },
        error: cookieError,
      } = await supabaseWithCookies.auth.getUser();

      if (cookieUser && !cookieError) {
        console.log('🔍 API Auth: Usuario autenticado via cookies (método 1)');
        return { user: cookieUser, supabase: supabaseWithCookies };
      }

      if (cookieError) {
        console.log(
          '🔍 API Auth: Error con cookies (método 1):',
          cookieError.message
        );
      }
    } catch (cookieError) {
      console.log(
        '🔍 API Auth: Error al crear cliente con cookies:',
        cookieError
      );
    }

    // Método 2: Intentar con Authorization header (usar cliente anónimo)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);

        // Crear cliente anónimo (válido para validar JWT del usuario)
        const supabaseWithToken = createAnonClient();

        // Verificar el token
        const {
          data: { user: tokenUser },
          error: tokenError,
        } = await supabaseWithToken.auth.getUser(token);

        if (tokenUser && !tokenError) {
          console.log('🔍 API Auth: Usuario autenticado via token (método 2)');
          return { user: tokenUser, supabase: supabaseWithToken };
        }

        if (tokenError) {
          console.log(
            '🔍 API Auth: Error con token (método 2):',
            tokenError.message
          );
        }
      } catch (tokenError) {
        console.log('🔍 API Auth: Error al procesar token:', tokenError);
      }
    }

    // Método 3: Intentar con cliente directo (fallback) usando cliente anónimo
    try {
      const supabaseDirect = createAnonClient();
      const {
        data: { user: directUser },
        error: directError,
      } = await supabaseDirect.auth.getUser();

      if (directUser && !directError) {
        console.log(
          '🔍 API Auth: Usuario autenticado via cliente directo (método 3)'
        );
        return { user: directUser, supabase: supabaseDirect };
      }

      if (directError) {
        console.log(
          '🔍 API Auth: Error con cliente directo (método 3):',
          directError.message
        );
      }
    } catch (directError) {
      console.log('🔍 API Auth: Error al crear cliente directo:', directError);
    }

    console.log(
      '🔍 API Auth: No se pudo autenticar al usuario con ningún método'
    );
    return { user: null, supabase: null };
  } catch (error) {
    console.error('🔍 API Auth: Error general durante autenticación:', error);
    return { user: null, supabase: null };
  }
}

export async function requireAdmin(request: NextRequest) {
  // TEMPORAL: En modo debug, simular admin exitoso
  if (DEBUG_MODE) {
    console.log('🔍 API Auth: Modo debug activado - simulando admin exitoso');
    const supabase = createClient();
    return {
      success: true,
      user: {
        id: '68e5e982-2c04-4352-8c96-565c10ea595a',
        email: 'hola@stakeados.com',
      } as any,
      profile: { role: 'admin' },
      supabase,
      step: 'debug_mode',
    };
  }

  const { user, supabase } = await getAuthenticatedUser(request);

  if (!user || !supabase) {
    return {
      success: false,
      error: 'Unauthorized',
      status: 401,
      step: 'no_user',
    };
  }

  // Verificar rol de admin
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('🔍 API Auth: Error al obtener perfil:', profileError);
      return {
        success: false,
        error: 'Profile not found',
        status: 500,
        step: 'profile_error',
      };
    }

    if (profile.role !== 'admin') {
      console.log('🔍 API Auth: Usuario no es admin:', profile.role);
      return {
        success: false,
        error: 'Forbidden',
        status: 403,
        step: 'not_admin',
        role: profile.role,
      };
    }

    console.log('🔍 API Auth: Admin verificado exitosamente');
    return {
      success: true,
      user,
      profile,
      supabase,
      step: 'success',
    };
  } catch (error) {
    console.error('🔍 API Auth: Error durante verificación de admin:', error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500,
      step: 'verification_error',
    };
  }
}
