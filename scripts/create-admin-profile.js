// Script para crear perfil de administrador para usuario existente
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.log(
    'Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminProfile() {
  console.log('🚀 Creando perfil de administrador...');

  const adminUserId = '68e5e982-2c04-4352-8c96-565c10ea595a';
  const adminEmail = 'hola@stakeados.com';

  try {
    // Crear perfil de administrador usando upsert para evitar conflictos
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: adminUserId,
          email: adminEmail,
          display_name: 'Administrador Stakeados',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_points: 0,
          is_genesis: false,
          genesis_nft_verified: false,
        },
        {
          onConflict: 'id',
        }
      )
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Perfil de administrador creado exitosamente:');
    console.log('   ID:', newProfile.id);
    console.log('   Email:', newProfile.email);
    console.log('   Nombre:', newProfile.display_name);
    console.log('   Rol:', newProfile.role);

    // Verificar que el perfil se creó correctamente
    console.log('\n🔍 Verificando perfil creado...');

    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUserId)
      .single();

    if (verifyError) {
      console.warn('⚠️  Error al verificar perfil:', verifyError.message);
    } else {
      console.log('✅ Verificación exitosa:');
      console.log('   Rol confirmado:', verifyProfile.role);
      console.log('   Email:', verifyProfile.email);
    }

    // Verificar función RPC si existe
    try {
      const { data: roleCheck, error: roleError } = await supabase.rpc(
        'check_user_role',
        { user_id: adminUserId }
      );

      if (roleError) {
        console.log(
          'ℹ️  Función RPC check_user_role no disponible:',
          roleError.message
        );
      } else {
        console.log('✅ Verificación RPC exitosa:', roleCheck);
      }
    } catch (rpcError) {
      console.log('ℹ️  Función RPC no disponible');
    }

    console.log('\n🎉 ¡Usuario administrador configurado correctamente!');
    console.log('\n📋 Información de acceso:');
    console.log('   Email:', adminEmail);
    console.log('   Rol: Administrador');
    console.log('   Login: /es/padentro');
    console.log('   Panel Admin: /es/admin');
  } catch (error) {
    console.error('❌ Error al crear perfil de administrador:', error);

    if (error.code === '23503') {
      console.log('\n💡 El usuario no existe en auth.users');
      console.log(
        '   Verifica que el UID sea correcto: 68e5e982-2c04-4352-8c96-565c10ea595a'
      );
    } else if (error.code === '23505') {
      console.log('\n💡 El perfil ya existe, actualizando...');
      await updateExistingProfile(adminUserId);
    }

    process.exit(1);
  }
}

async function updateExistingProfile(userId) {
  try {
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Perfil actualizado a administrador:');
    console.log('   ID:', updatedProfile.id);
    console.log('   Rol:', updatedProfile.role);
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
  }
}

// Función para verificar la conexión a Supabase
async function verifyConnection() {
  console.log('🔍 Verificando conexión a Supabase...');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }

    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error al verificar conexión:', error);
    return false;
  }
}

async function main() {
  console.log('🏗️  Script de creación de perfil administrador');
  console.log('='.repeat(50));

  // Verificar conexión
  const connected = await verifyConnection();
  if (!connected) {
    console.log('❌ No se puede continuar sin conexión a Supabase');
    process.exit(1);
  }

  // Crear perfil admin
  await createAdminProfile();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Script completado exitosamente');
}

main().catch(console.error);
