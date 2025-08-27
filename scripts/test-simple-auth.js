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

async function testSimpleAuth() {
  console.log('🔍 TEST: Ruta Simple de Autenticación');
  console.log('='.repeat(50));

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

    console.log('✅ Login exitoso');

    // 2. Obtener la sesión actual
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      console.error('❌ No hay sesión activa');
      return;
    }

    console.log('✅ Sesión obtenida');

    // 3. Probar la ruta de test
    console.log('\n2. Probando ruta de test de autenticación...');

    const response = await fetch('http://localhost:3000/api/admin/test-auth', {
      method: 'GET',
    });

    console.log(`   • Status: ${response.status}`);
    console.log(`   • Status Text: ${response.statusText}`);

    const responseText = await response.text();
    console.log(`   • Response: ${responseText}`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Autenticación exitosa:', data);
    } else {
      console.error('❌ Error de autenticación');
    }

    console.log('\n🎉 Test completado!');
  } catch (error) {
    console.error('❌ Error durante el test:', error);
  }
}

testSimpleAuth().catch(console.error);
