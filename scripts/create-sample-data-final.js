// Script final corregido para crear datos de ejemplo en Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para generar slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

async function createSampleData() {
  console.log('🔧 Creando datos de ejemplo para el dashboard...');

  try {
    // Obtener las categorías existentes
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name');

    if (categoriesError) {
      console.error('❌ Error al obtener categorías:', categoriesError.message);
      return;
    }

    console.log(
      '📋 Categorías disponibles:',
      categories.map(c => `${c.name} (${c.id})`)
    );

    // 1. Crear fuentes de noticias de ejemplo (estructura corregida)
    console.log('\n1. Creando fuentes de noticias...');

    const sampleSources = [
      {
        name: 'CoinDesk Español',
        url: 'https://www.coindesk.com/es/feed/',
        description:
          'Fuente principal de noticias sobre criptomonedas en español',
        is_active: true,
        fetch_status: 'success',
        last_fetched_at: new Date().toISOString(),
      },
      {
        name: 'CriptoNoticias',
        url: 'https://www.criptonoticias.com/feed/',
        description: 'Noticias especializadas en blockchain y criptomonedas',
        is_active: true,
        fetch_status: 'success',
        last_fetched_at: new Date().toISOString(),
      },
      {
        name: 'Bitcoin.com News',
        url: 'https://news.bitcoin.com/feed/',
        description: 'Noticias sobre Bitcoin y criptomonedas',
        is_active: true,
        fetch_status: 'success',
        last_fetched_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
      },
      {
        name: 'Decrypt',
        url: 'https://decrypt.co/feed',
        description: 'Noticias sobre blockchain y tecnología descentralizada',
        is_active: false,
        fetch_status: 'error',
        error_message: 'Connection timeout',
        last_fetched_at: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
      },
    ];

    for (const source of sampleSources) {
      const { data, error } = await supabase
        .from('news_sources')
        .insert([source])
        .select();

      if (error) {
        console.log(
          `⚠️  Error al crear fuente ${source.name}: ${error.message}`
        );
      } else {
        console.log(`✅ Fuente creada: ${source.name}`);
      }
    }

    // 2. Crear noticias de ejemplo (estructura corregida)
    console.log('\n2. Creando noticias de ejemplo...');

    const sampleNews = [
      {
        title: 'Bitcoin alcanza nuevo máximo histórico en 2024',
        content:
          'El precio de Bitcoin ha alcanzado un nuevo máximo histórico, superando los $70,000 USD. Los analistas atribuyen este crecimiento a la adopción institucional y la reducción de la oferta disponible.',
        summary:
          'Bitcoin rompe récord de precio con fuerte impulso institucional',
        source_name: 'CoinDesk Español',
        source_url: 'https://www.coindesk.com/es/bitcoin-maximo-historico-2024',
        processed: true,
        trending_score: 95, // Cambiado a entero
        language: 'es',
        category_id: categories.find(c => c.name === 'DeFi')?.id,
        published_at: new Date().toISOString(),
      },
      {
        title:
          'Ethereum 2.0 mejora significativamente la eficiencia energética',
        content:
          'La actualización de Ethereum a Proof of Stake ha reducido el consumo energético en más del 99%, marcando un hito importante en la sostenibilidad de las criptomonedas.',
        summary: 'Ethereum logra reducción masiva en consumo energético',
        source_name: 'CriptoNoticias',
        source_url: 'https://www.criptonoticias.com/ethereum-2-0-eficiencia',
        processed: true,
        trending_score: 88, // Cambiado a entero
        language: 'es',
        category_id: categories.find(c => c.name === 'DeFi')?.id,
        published_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        title: 'Nuevo proyecto NFT revoluciona el arte digital',
        content:
          'Un innovador proyecto NFT está transformando la forma en que los artistas digitales monetizan su trabajo, ofreciendo nuevas oportunidades de ingresos.',
        summary: 'Proyecto NFT innovador para artistas digitales',
        source_name: 'Bitcoin.com News',
        source_url: 'https://news.bitcoin.com/nft-arte-digital',
        processed: false,
        trending_score: 75, // Cambiado a entero
        language: 'es',
        category_id: categories.find(c => c.name === 'NFTs')?.id,
        published_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        title: 'Base Network registra crecimiento exponencial en usuarios',
        content:
          'La red Base de Coinbase ha experimentado un crecimiento masivo en usuarios activos, consolidándose como una de las principales L2 de Ethereum.',
        summary: 'Base Network crece exponencialmente en adopción',
        source_name: 'CoinDesk Español',
        source_url: 'https://www.coindesk.com/es/base-network-crecimiento',
        processed: true,
        trending_score: 82, // Cambiado a entero
        language: 'es',
        category_id: categories.find(c => c.name === 'Base')?.id,
        published_at: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        title: 'Regulaciones de criptomonedas en Europa se endurecen',
        content:
          'La Unión Europea ha anunciado nuevas regulaciones más estrictas para el sector de las criptomonedas, afectando a exchanges y proveedores de servicios.',
        summary: 'UE anuncia regulaciones más estrictas para criptomonedas',
        source_name: 'CriptoNoticias',
        source_url: 'https://www.criptonoticias.com/ue-regulaciones-cripto',
        processed: true,
        trending_score: 70, // Cambiado a entero
        language: 'es',
        category_id: categories.find(c => c.name === 'Technology')?.id,
        published_at: new Date(Date.now() - 14400000).toISOString(),
      },
    ];

    for (const news of sampleNews) {
      const { data, error } = await supabase
        .from('news')
        .insert([news])
        .select();

      if (error) {
        console.log(
          `⚠️  Error al crear noticia "${news.title}": ${error.message}`
        );
      } else {
        console.log(`✅ Noticia creada: ${news.title}`);
      }
    }

    // 3. Crear artículos de ejemplo (estructura corregida)
    console.log('\n3. Creando artículos de ejemplo...');

    const sampleArticles = [
      {
        title: 'Guía completa de DeFi: DeFi 101',
        slug: generateSlug('Guía completa de DeFi: DeFi 101'),
        content:
          'Una guía completa para principiantes sobre finanzas descentralizadas (DeFi), explicando conceptos básicos, protocolos principales y cómo empezar.',
        summary: 'Guía introductoria a las finanzas descentralizadas',
        status: 'published',
        author_id: '68e5e982-2c04-4352-8c96-565c10ea595a', // Admin user
        category_id: categories.find(c => c.name === 'DeFi')?.id,
        language: 'es',
        views: 1250,
        likes: 89,
        published_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        title: 'El futuro de los NFTs en el arte digital',
        slug: generateSlug('El futuro de los NFTs en el arte digital'),
        content:
          'Análisis profundo sobre cómo los NFTs están transformando el mercado del arte digital y las nuevas oportunidades que presentan para artistas.',
        summary: 'Análisis del impacto de NFTs en el arte digital',
        status: 'published',
        author_id: '68e5e982-2c04-4352-8c96-565c10ea595a',
        category_id: categories.find(c => c.name === 'NFTs')?.id,
        language: 'es',
        views: 890,
        likes: 67,
        published_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        title: 'Base Network: La L2 que está revolucionando Ethereum',
        slug: generateSlug(
          'Base Network: La L2 que está revolucionando Ethereum'
        ),
        content:
          'Exploración detallada de Base Network, la solución de capa 2 de Coinbase que está ganando popularidad rápidamente.',
        summary: 'Análisis completo de Base Network',
        status: 'draft',
        author_id: '68e5e982-2c04-4352-8c96-565c10ea595a',
        category_id: categories.find(c => c.name === 'Base')?.id,
        language: 'es',
        views: 0,
        likes: 0,
      },
    ];

    for (const article of sampleArticles) {
      const { data, error } = await supabase
        .from('articles')
        .insert([article])
        .select();

      if (error) {
        console.log(
          `⚠️  Error al crear artículo "${article.title}": ${error.message}`
        );
      } else {
        console.log(`✅ Artículo creado: ${article.title}`);
      }
    }

    console.log('\n🎉 Datos de ejemplo creados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   ✅ 4 fuentes de noticias creadas');
    console.log('   ✅ 5 noticias de ejemplo creadas');
    console.log('   ✅ 3 artículos de ejemplo creados');

    console.log('\n🚀 Ahora puedes:');
    console.log('   1. Hacer login en /es/padentro');
    console.log('   2. Acceder al dashboard admin en /es/admin');
    console.log('   3. Ver datos reales en todas las secciones');
  } catch (error) {
    console.error('❌ Error durante la creación de datos:', error);
  }
}

async function main() {
  console.log('🏗️  Creación de Datos de Ejemplo (Final)');
  console.log('='.repeat(55));

  await createSampleData();

  console.log('\n' + '='.repeat(55));
  console.log('✅ Proceso completado');
}

main().catch(console.error);
