const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
  console.log('🔧 RESET: Contraseña de Usuario Admin');
  console.log('='.repeat(50));

  try {
    const adminEmail = 'hola@stakeados.com';
    const newPassword = 'admin123456';

    console.log(`\n1. Reseteando contraseña para: ${adminEmail}`);
    console.log(`   Nueva contraseña: ${newPassword}`);

    // Obtener el usuario admin desde profiles
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError.message);
      return;
    }

    console.log('✅ Usuario encontrado:', adminProfile.id);

    // Actualizar la contraseña usando la API REST
    const { data: updateData, error: updateError } =
      await supabase.auth.admin.updateUserById(adminProfile.id, {
        password: newPassword,
      });

    if (updateError) {
      console.error('❌ Error al actualizar contraseña:', updateError.message);
      return;
    }

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('\n📋 Credenciales de acceso:');
    console.log(`   • Email: ${adminEmail}`);
    console.log(`   • Password: ${newPassword}`);
    console.log('\n🚀 Ahora puedes hacer login en la aplicación');
  } catch (error) {
    console.error('❌ Error durante el reset:', error);
  }
}

resetAdminPassword().catch(console.error);
