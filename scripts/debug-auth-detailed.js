const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

// Simular cliente del frontend
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

async function debugAuthDetailed() {
  console.log('🔍 DEBUG DETALLADO: Autenticación y Cookies');
  console.log('='.repeat(60));

  try {
    // 1. Simular login del usuario admin
    console.log('\n1. Simulando login del usuario admin...');
    const { data: signInData, error: signInError } =
      await supabaseClient.auth.signInWithPassword({
        email: 'hola@stakeados.com',
        password: 'admin123456',
      });

    if (signInError) {
      console.error('❌ Error en login:', signInError.message);
      return;
    }

    console.log('✅ Login exitoso:');
    console.log(`   • User ID: ${signInData.user.id}`);
    console.log(`   • Email: ${signInData.user.email}`);
    console.log(`   • Session: ${signInData.session ? 'Activa' : 'No activa'}`);

    // 2. Obtener la sesión actual
    console.log('\n2. Obteniendo sesión actual...');
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      console.error('❌ No hay sesión activa');
      return;
    }

    console.log('✅ Sesión obtenida:');
    console.log(
      `   • Access Token: ${session.access_token.substring(0, 20)}...`
    );
    console.log(
      `   • Refresh Token: ${session.refresh_token.substring(0, 20)}...`
    );
    console.log(
      `   • Expires At: ${new Date(session.expires_at * 1000).toISOString()}`
    );

    // 3. Obtener cookies de sesión
    console.log('\n3. Obteniendo cookies de sesión...');
    const {
      data: { session: sessionWithCookies },
    } = await supabaseClient.auth.getSession();

    // 4. Simular llamada HTTP con diferentes configuraciones
    console.log('\n4. Probando llamadas HTTP...');

    // Configurar fetch con cookies
    const cookieName = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    const cookieValue = session.access_token;

    console.log(`   • Cookie Name: ${cookieName}`);
    console.log(`   • Cookie Value: ${cookieValue.substring(0, 20)}...`);

    // Método 1: Con cookies en headers
    console.log('\n   Método 1: Con cookies en headers...');
    const response1 = await fetch(
      'http://localhost:3000/api/admin/articles?page=0&limit=5',
      {
        method: 'GET',
        headers: {
          Cookie: `${cookieName}=${cookieValue}`,
        },
      }
    );

    console.log(`   • Status: ${response1.status}`);
    if (!response1.ok) {
      const errorText = await response1.text();
      console.log(`   • Error: ${errorText}`);
    }

    // Método 2: Con Authorization header
    console.log('\n   Método 2: Con Authorization header...');
    const response2 = await fetch(
      'http://localhost:3000/api/admin/articles?page=0&limit=5',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    console.log(`   • Status: ${response2.status}`);
    if (!response2.ok) {
      const errorText = await response2.text();
      console.log(`   • Error: ${errorText}`);
    }

    // Método 3: Con ambos headers
    console.log('\n   Método 3: Con ambos headers...');
    const response3 = await fetch(
      'http://localhost:3000/api/admin/articles?page=0&limit=5',
      {
        method: 'GET',
        headers: {
          Cookie: `${cookieName}=${cookieValue}`,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    console.log(`   • Status: ${response3.status}`);
    if (!response3.ok) {
      const errorText = await response3.text();
      console.log(`   • Error: ${errorText}`);
    }

    // Método 4: Sin headers (debería usar cookies automáticamente)
    console.log('\n   Método 4: Sin headers...');
    const response4 = await fetch(
      'http://localhost:3000/api/admin/articles?page=0&limit=5',
      {
        method: 'GET',
      }
    );

    console.log(`   • Status: ${response4.status}`);
    if (!response4.ok) {
      const errorText = await response4.text();
      console.log(`   • Error: ${errorText}`);
    }

    // 5. Probar una ruta simple para verificar que el servidor funciona
    console.log('\n5. Probando ruta simple...');
    const responseSimple = await fetch(
      'http://localhost:3000/api/admin/analytics/dashboard'
    );
    console.log(`   • Status: ${responseSimple.status}`);
    if (!responseSimple.ok) {
      const errorText = await responseSimple.text();
      console.log(`   • Error: ${errorText}`);
    }

    console.log('\n🎉 Debug detallado completado!');
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  }
}

debugAuthDetailed().catch(console.error);
