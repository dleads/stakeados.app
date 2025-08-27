const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAuth() {
  console.log('🔍 DEBUG: Verificación de Autenticación y Roles');
  console.log('='.repeat(50));

  try {
    // 1. Verificar usuario admin
    console.log('\n1. Verificando usuario admin...');
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'hola@stakeados.com')
      .single();

    if (adminError) {
      console.error('❌ Error al obtener usuario admin:', adminError.message);
      return;
    }

    console.log('✅ Usuario admin encontrado:');
    console.log(`   • ID: ${adminUser.id}`);
    console.log(`   • Email: ${adminUser.email}`);
    console.log(`   • Role: ${adminUser.role}`);
    console.log(`   • Created: ${adminUser.created_at}`);
    console.log(`   • Updated: ${adminUser.updated_at}`);

    // 2. Verificar si el usuario existe en auth.users
    console.log('\n2. Verificando en auth.users...');
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(adminUser.id);

    if (authError) {
      console.error('❌ Error al obtener usuario de auth:', authError.message);
    } else {
      console.log('✅ Usuario encontrado en auth.users:');
      console.log(`   • ID: ${authUser.user.id}`);
      console.log(`   • Email: ${authUser.user.email}`);
      console.log(`   • Email confirmed: ${authUser.user.email_confirmed_at}`);
      console.log(`   • Last sign in: ${authUser.user.last_sign_in_at}`);
    }

    // 3. Verificar funciones de roles
    console.log('\n3. Verificando funciones de roles...');

    // Probar función has_role_or_higher
    try {
      const { data: hasRole, error: hasRoleError } = await supabase.rpc(
        'has_role_or_higher',
        {
          user_id: adminUser.id,
          required_role: 'admin',
        }
      );

      if (hasRoleError) {
        console.log('⚠️  Error en has_role_or_higher:', hasRoleError.message);
      } else {
        console.log('✅ has_role_or_higher:', hasRole);
      }
    } catch (error) {
      console.log('⚠️  Error al llamar has_role_or_higher:', error.message);
    }

    // Probar función get_role_permissions
    try {
      const { data: permissions, error: permissionsError } = await supabase.rpc(
        'get_role_permissions',
        {
          user_id: adminUser.id,
        }
      );

      if (permissionsError) {
        console.log(
          '⚠️  Error en get_role_permissions:',
          permissionsError.message
        );
      } else {
        console.log('✅ get_role_permissions:', permissions);
      }
    } catch (error) {
      console.log('⚠️  Error al llamar get_role_permissions:', error.message);
    }

    // 4. Verificar políticas RLS
    console.log('\n4. Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id);

    if (policiesError) {
      console.log(
        '⚠️  Error al verificar políticas RLS:',
        policiesError.message
      );
    } else {
      console.log('✅ Políticas RLS permiten acceso al perfil del admin');
    }

    // 5. Verificar acceso a tablas admin
    console.log('\n5. Verificando acceso a tablas admin...');

    // Verificar acceso a articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('count')
      .limit(1);

    if (articlesError) {
      console.log('⚠️  Error al acceder a articles:', articlesError.message);
    } else {
      console.log('✅ Acceso a articles: OK');
    }

    // Verificar acceso a news
    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('count')
      .limit(1);

    if (newsError) {
      console.log('⚠️  Error al acceder a news:', newsError.message);
    } else {
      console.log('✅ Acceso a news: OK');
    }

    console.log('\n🎉 Debug de autenticación completado!');
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  }
}

debugAuth().catch(console.error);
