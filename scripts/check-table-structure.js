// Script para verificar la estructura de las tablas en Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de las tablas...');

  try {
    // Verificar estructura de news_sources
    console.log('\n1. Estructura de news_sources:');
    const { data: sourcesData, error: sourcesError } = await supabase
      .from('news_sources')
      .select('*')
      .limit(1);

    if (sourcesError) {
      console.log(
        `❌ Error al verificar news_sources: ${sourcesError.message}`
      );
    } else {
      console.log('✅ Tabla news_sources existe');
      if (sourcesData && sourcesData.length > 0) {
        console.log('   Columnas disponibles:', Object.keys(sourcesData[0]));
      }
    }

    // Verificar estructura de news
    console.log('\n2. Estructura de news:');
    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select('*')
      .limit(1);

    if (newsError) {
      console.log(`❌ Error al verificar news: ${newsError.message}`);
    } else {
      console.log('✅ Tabla news existe');
      if (newsData && newsData.length > 0) {
        console.log('   Columnas disponibles:', Object.keys(newsData[0]));
      }
    }

    // Verificar estructura de articles
    console.log('\n3. Estructura de articles:');
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .limit(1);

    if (articlesError) {
      console.log(`❌ Error al verificar articles: ${articlesError.message}`);
    } else {
      console.log('✅ Tabla articles existe');
      if (articlesData && articlesData.length > 0) {
        console.log('   Columnas disponibles:', Object.keys(articlesData[0]));
      }
    }

    // Verificar estructura de categories
    console.log('\n4. Estructura de categories:');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      console.log(
        `❌ Error al verificar categories: ${categoriesError.message}`
      );
    } else {
      console.log('✅ Tabla categories existe');
      console.log('   Categorías disponibles:');
      if (categoriesData && categoriesData.length > 0) {
        categoriesData.forEach(cat => {
          console.log(`   - ID: ${cat.id}, Nombre: ${cat.name}`);
        });
      }
    }

    // Verificar si existe la tabla ai_processing_jobs
    console.log('\n5. Verificando tabla ai_processing_jobs:');
    const { data: jobsData, error: jobsError } = await supabase
      .from('ai_processing_jobs')
      .select('*')
      .limit(1);

    if (jobsError) {
      console.log(
        `❌ Error al verificar ai_processing_jobs: ${jobsError.message}`
      );
    } else {
      console.log('✅ Tabla ai_processing_jobs existe');
      if (jobsData && jobsData.length > 0) {
        console.log('   Columnas disponibles:', Object.keys(jobsData[0]));
      }
    }

    // Listar todas las tablas disponibles
    console.log('\n6. Todas las tablas disponibles:');
    const { data: tablesData, error: tablesError } =
      await supabase.rpc('get_tables');

    if (tablesError) {
      console.log(`❌ Error al listar tablas: ${tablesError.message}`);
      // Intentar con una consulta alternativa
      const { data: altTables, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (altError) {
        console.log(`❌ Error alternativo: ${altError.message}`);
      } else {
        console.log('   Tablas encontradas:');
        altTables?.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
    } else {
      console.log('   Tablas encontradas:');
      tablesData?.forEach(table => {
        console.log(`   - ${table}`);
      });
    }
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

async function main() {
  console.log('🏗️  Verificación de Estructura de Tablas');
  console.log('='.repeat(55));

  await checkTableStructure();

  console.log('\n' + '='.repeat(55));
  console.log('✅ Verificación completada');
}

main().catch(console.error);
