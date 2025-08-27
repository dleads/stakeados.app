// Script para limpiar la sesión de autenticación y verificar el estado
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAuthSession() {
  console.log('🧹 Limpiando sesión de autenticación...');

  try {
    // Verificar el estado actual de autenticación
    console.log('\n1. Verificando estado actual de autenticación...');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log(
        'ℹ️  Error al obtener usuario (normal si no hay sesión):',
        userError.message
      );
    }

    if (user) {
      console.log('⚠️  Usuario actualmente logueado:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Última actividad:', user.last_sign_in_at);
    } else {
      console.log('ℹ️  No hay usuario logueado actualmente');
    }

    // Cerrar sesión si hay una activa
    console.log('\n2. Cerrando sesión...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.log(
        'ℹ️  Error al cerrar sesión (normal si no había sesión):',
        signOutError.message
      );
    } else {
      console.log('✅ Sesión cerrada exitosamente');
    }

    // Verificar que la sesión se cerró
    console.log('\n3. Verificando que la sesión se cerró...');
    const {
      data: { user: userAfter },
      error: userAfterError,
    } = await supabase.auth.getUser();

    if (userAfter) {
      console.log('⚠️  Aún hay un usuario logueado:', userAfter.email);
    } else {
      console.log('✅ No hay usuario logueado - sesión limpia');
    }

    console.log('\n📋 Instrucciones para el navegador:');
    console.log('1. Abre las herramientas de desarrollador (F12)');
    console.log('2. Ve a la pestaña "Application" o "Aplicación"');
    console.log('3. En el panel izquierdo, busca "Local Storage"');
    console.log('4. Haz clic en tu dominio (localhost:3000)');
    console.log('5. Busca y elimina cualquier clave que contenga "supabase"');
    console.log(
      '6. También ve a "Session Storage" y elimina claves de "supabase"'
    );
    console.log('7. Recarga la página');

    console.log('\n🔄 Alternativamente, puedes:');
    console.log('- Abrir una ventana de incógnito/privada');
    console.log(
      '- O limpiar todos los datos del sitio en configuración del navegador'
    );

    return true;
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    return false;
  }
}

async function main() {
  console.log('🏗️  Limpieza de sesión de autenticación');
  console.log('='.repeat(50));

  const success = await clearAuthSession();

  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ Proceso completado');
    console.log('\n🚀 Ahora intenta:');
    console.log('1. Recargar la página de login');
    console.log(
      '2. Debería mostrarse el formulario sin redirección automática'
    );
    console.log('3. Ingresar email: hola@stakeados.com');
    console.log('4. Ingresar la contraseña que configuraste');
  } else {
    console.log('❌ Proceso falló');
  }
}

main().catch(console.error);
