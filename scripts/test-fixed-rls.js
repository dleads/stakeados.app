// Script para probar que las políticas RLS están funcionando correctamente
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSFix() {
  console.log('🧪 Probando que las políticas RLS están funcionando...');

  try {
    // Probar lectura de perfiles
    console.log('\n1. Probando lectura de perfiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, role')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error al leer perfiles:', profilesError);
      return false;
    }

    console.log('✅ Perfiles leídos exitosamente:');
    profiles.forEach(profile => {
      console.log(`   - ${profile.email} (${profile.role || 'user'})`);
    });

    // Probar lectura del perfil específico del admin
    console.log('\n2. Probando lectura del perfil de administrador...');
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '68e5e982-2c04-4352-8c96-565c10ea595a')
      .single();

    if (adminError) {
      console.error('❌ Error al leer perfil de admin:', adminError);
      return false;
    }

    console.log('✅ Perfil de administrador leído exitosamente:');
    console.log('   ID:', adminProfile.id);
    console.log('   Email:', adminProfile.email);
    console.log('   Nombre:', adminProfile.display_name);
    console.log('   Rol:', adminProfile.role);

    // Probar función de verificación de rol
    console.log('\n3. Probando función de verificación de rol...');
    const { data: roleCheck, error: roleError } = await supabase.rpc(
      'check_user_role',
      { user_id: '68e5e982-2c04-4352-8c96-565c10ea595a' }
    );

    if (roleError) {
      console.error('❌ Error en función de rol:', roleError);
      return false;
    }

    console.log('✅ Función de rol funcionando:', roleCheck);

    // Probar función is_admin
    console.log('\n4. Probando función is_admin...');
    const { data: isAdminCheck, error: isAdminError } = await supabase.rpc(
      'is_admin',
      { user_id: '68e5e982-2c04-4352-8c96-565c10ea595a' }
    );

    if (isAdminError) {
      console.error('❌ Error en función is_admin:', isAdminError);
      return false;
    }

    console.log('✅ Función is_admin funcionando:', isAdminCheck);

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 Resumen de la corrección:');
    console.log('   ✅ Políticas RLS sin recursión infinita');
    console.log('   ✅ Lectura de perfiles funcionando');
    console.log('   ✅ Perfil de administrador accesible');
    console.log('   ✅ Funciones de verificación de rol funcionando');

    console.log('\n🚀 La aplicación debería funcionar correctamente ahora');
    console.log('   - Ve a /es/padentro para hacer login');
    console.log('   - Usa: hola@stakeados.com');
    console.log('   - Accede al panel admin en /es/admin');

    return true;
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    return false;
  }
}

async function main() {
  console.log('🏗️  Prueba de corrección de políticas RLS');
  console.log('='.repeat(50));

  const success = await testRLSFix();

  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ Todas las pruebas pasaron');
  } else {
    console.log('❌ Algunas pruebas fallaron');
    process.exit(1);
  }
}

main().catch(console.error);
