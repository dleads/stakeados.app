const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSystemSettings() {
  console.log('🔍 Verificando tabla system_settings...');

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error al acceder a system_settings:', error.message);
      return false;
    }

    console.log('✅ Tabla system_settings existe');
    console.log('📊 Datos encontrados:', data?.length || 0);

    if (data && data.length > 0) {
      console.log('📋 Configuraciones disponibles:');
      data.forEach(setting => {
        console.log(
          `  - ${setting.key}: ${setting.description || 'Sin descripción'}`
        );
      });
    }

    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

checkSystemSettings().then(exists => {
  if (exists) {
    console.log('🎉 Verificación completada exitosamente');
  } else {
    console.log('⚠️  La tabla system_settings no existe o no es accesible');
  }
});
