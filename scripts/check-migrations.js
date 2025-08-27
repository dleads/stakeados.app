// Script para verificar el estado de las migraciones de la base de datos
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigrations() {
  console.log('🔍 Verificando estado de las migraciones...');

  try {
    // Verificar tablas principales
    console.log('\n1. Verificando tablas principales...');

    const tables = [
      'profiles',
      'categories',
      'articles',
      'news',
      'role_audit_log',
      'role_permissions_cache',
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: ${err.message}`);
      }
    }

    // Verificar funciones
    console.log('\n2. Verificando funciones...');

    const functions = [
      'has_role_or_higher',
      'get_role_permissions',
      'update_user_role',
      'update_updated_at_column',
    ];

    for (const func of functions) {
      try {
        // Intentar llamar la función con parámetros mínimos
        const { data, error } = await supabase.rpc(func, {});

        if (
          error &&
          error.message.includes('function') &&
          error.message.includes('does not exist')
        ) {
          console.log(`❌ Función ${func}: No existe`);
        } else if (error) {
          console.log(
            `⚠️  Función ${func}: Existe pero error en llamada - ${error.message}`
          );
        } else {
          console.log(`✅ Función ${func}: OK`);
        }
      } catch (err) {
        console.log(`❌ Función ${func}: ${err.message}`);
      }
    }

    // Verificar políticas RLS
    console.log('\n3. Verificando políticas RLS...');

    const { data: rlsPolicies, error: rlsError } = await supabase
      .from('information_schema.policies')
      .select('schemaname, tablename, policyname')
      .eq('schemaname', 'public');

    if (rlsError) {
      console.log(`❌ Error al verificar políticas RLS: ${rlsError.message}`);
    } else {
      console.log(`✅ Políticas RLS encontradas: ${rlsPolicies?.length || 0}`);
      if (rlsPolicies && rlsPolicies.length > 0) {
        rlsPolicies.forEach(policy => {
          console.log(`   - ${policy.tablename}.${policy.policyname}`);
        });
      }
    }

    // Verificar datos de ejemplo
    console.log('\n4. Verificando datos de ejemplo...');

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(5);

    if (categoriesError) {
      console.log(
        `❌ Error al verificar categorías: ${categoriesError.message}`
      );
    } else {
      console.log(`✅ Categorías encontradas: ${categories?.length || 0}`);
      if (categories && categories.length > 0) {
        categories.forEach(cat => {
          console.log(`   - ${cat.name}`);
        });
      }
    }

    // Verificar usuario admin
    console.log('\n5. Verificando usuario administrador...');

    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, role, display_name')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      console.log(`❌ Error al verificar admin: ${adminError.message}`);
    } else if (adminProfile && adminProfile.length > 0) {
      console.log(`✅ Usuario admin encontrado: ${adminProfile[0].email}`);
    } else {
      console.log(`⚠️  No se encontró usuario admin`);
    }

    console.log('\n🎉 Verificación de migraciones completada!');
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

async function main() {
  console.log('🏗️  Verificación de Estado de Migraciones');
  console.log('='.repeat(55));

  await checkMigrations();

  console.log('\n' + '='.repeat(55));
  console.log('✅ Verificación completada');
}

main().catch(console.error);
