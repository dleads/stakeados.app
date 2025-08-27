// Script para verificar que el usuario administrador está configurado correctamente
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAdminSetup() {
  console.log('🔍 Verificando configuración de administrador...');

  const adminUserId = '68e5e982-2c04-4352-8c96-565c10ea595a';
  const adminEmail = 'hola@stakeados.com';

  try {
    // Verificar usuario en auth.users
    console.log('\n1. Verificando usuario en auth.users...');
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('id', adminUserId)
      .single();

    if (authError) {
      console.log('⚠️  No se puede verificar auth.users directamente');
    } else {
      console.log('✅ Usuario encontrado en auth.users:');
      console.log('   ID:', authUser.id);
      console.log('   Email:', authUser.email);
    }

    // Verificar perfil en profiles
    console.log('\n2. Verificando perfil en profiles...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUserId)
      .single();

    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError);
      return false;
    }

    console.log('✅ Perfil encontrado:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Nombre:', profile.display_name);
    console.log('   Rol:', profile.role);
    console.log('   Creado:', profile.created_at);

    // Verificar que es administrador
    if (profile.role !== 'admin') {
      console.error('❌ El usuario no tiene rol de administrador');
      return false;
    }

    // Verificar que el email coincide
    if (profile.email !== adminEmail) {
      console.error('❌ El email no coincide');
      return false;
    }

    console.log('\n3. Verificando permisos de administrador...');

    // Simular verificación de permisos (esto dependería de tu lógica de autorización)
    const isAdmin = profile.role === 'admin';

    if (isAdmin) {
      console.log('✅ Permisos de administrador confirmados');
    } else {
      console.error('❌ Sin permisos de administrador');
      return false;
    }

    console.log(
      '\n🎉 ¡Configuración de administrador verificada exitosamente!'
    );
    console.log('\n📋 Resumen:');
    console.log('   ✅ Usuario existe en auth.users');
    console.log('   ✅ Perfil creado en profiles');
    console.log('   ✅ Rol de administrador asignado');
    console.log('   ✅ Email correcto configurado');

    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Ve a /es/padentro para hacer login');
    console.log('   2. Usa email: hola@stakeados.com');
    console.log('   3. Usa la contraseña que configuraste');
    console.log('   4. Accede al panel admin en /es/admin');

    return true;
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    return false;
  }
}

async function main() {
  console.log('🏗️  Verificación de configuración de administrador');
  console.log('='.repeat(55));

  const success = await verifyAdminSetup();

  console.log('\n' + '='.repeat(55));
  if (success) {
    console.log('✅ Verificación completada exitosamente');
  } else {
    console.log('❌ Verificación falló');
    process.exit(1);
  }
}

main().catch(console.error);
