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

async function testApiAuth() {
  console.log('🔍 TEST: Simulación de Autenticación Frontend -> API');
  console.log('='.repeat(60));

  try {
    // 1. Simular login del usuario admin
    console.log('\n1. Simulando login del usuario admin...');
    const { data: signInData, error: signInError } =
      await supabaseClient.auth.signInWithPassword({
        email: 'hola@stakeados.com',
        password: 'admin123456', // Nueva contraseña reseteada
      });

    if (signInError) {
      console.error('❌ Error en login:', signInError.message);
      return;
    }

    console.log('✅ Login exitoso:');
    console.log(`   • User ID: ${signInData.user.id}`);
    console.log(`   • Email: ${signInData.user.email}`);
    console.log(`   • Session: ${signInData.session ? 'Activa' : 'No activa'}`);

    // 2. Obtener perfil del usuario
    console.log('\n2. Obteniendo perfil del usuario...');
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError.message);
      return;
    }

    console.log('✅ Perfil obtenido:');
    console.log(`   • Role: ${profile.role}`);
    console.log(`   • Display Name: ${profile.display_name}`);

    // 3. Simular llamada a API de artículos
    console.log('\n3. Simulando llamada a API de artículos...');

    // Obtener la sesión actual
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      console.error('❌ No hay sesión activa');
      return;
    }

    // Simular llamada HTTP a la API
    const response = await fetch(
      'http://localhost:3000/api/admin/articles?page=0&limit=20&sort_by=created_at&sort_order=desc',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          Cookie: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${session.access_token}`,
        },
      }
    );

    console.log(`   • Status: ${response.status}`);
    console.log(`   • Status Text: ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API response:', data);
    } else {
      const errorData = await response.text();
      console.error('❌ API error:', errorData);
    }

    // 4. Probar con diferentes métodos de autenticación
    console.log('\n4. Probando diferentes métodos de autenticación...');

    // Método 1: Solo con Authorization header
    const response1 = await fetch(
      'http://localhost:3000/api/admin/articles?page=0&limit=5',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );
    console.log(`   • Método 1 (Authorization): ${response1.status}`);

    // Método 2: Solo con Cookie
    const response2 = await fetch(
      'http://localhost:3000/api/admin/articles?page=0&limit=5',
      {
        method: 'GET',
        headers: {
          Cookie: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${session.access_token}`,
        },
      }
    );
    console.log(`   • Método 2 (Cookie): ${response2.status}`);

    // Método 3: Sin headers (debería usar cookies automáticamente)
    const response3 = await fetch(
      'http://localhost:3000/api/admin/articles?page=0&limit=5',
      {
        method: 'GET',
      }
    );
    console.log(`   • Método 3 (Sin headers): ${response3.status}`);

    console.log('\n🎉 Test de autenticación completado!');
  } catch (error) {
    console.error('❌ Error durante el test:', error);
  }
}

testApiAuth().catch(console.error);
