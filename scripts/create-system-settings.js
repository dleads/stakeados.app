const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSystemSettings() {
  console.log('🔧 Creando tabla system_settings...');

  try {
    // Create table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS system_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          value JSONB NOT NULL,
          description TEXT,
          created_by UUID REFERENCES auth.users(id),
          updated_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (createError) {
      console.log(
        '⚠️  Error al crear tabla (puede que ya exista):',
        createError.message
      );
    } else {
      console.log('✅ Tabla system_settings creada');
    }

    // Create index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);',
    });

    if (indexError) {
      console.log('⚠️  Error al crear índice:', indexError.message);
    } else {
      console.log('✅ Índice creado');
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;',
    });

    if (rlsError) {
      console.log('⚠️  Error al habilitar RLS:', rlsError.message);
    } else {
      console.log('✅ RLS habilitado');
    }

    // Insert default settings
    const defaultSettings = [
      {
        key: 'ai_processing_config',
        value: {
          openai: {
            model: 'gpt-4-turbo',
            temperature: 0.7,
            maxTokens: 2000,
            timeout: 30,
          },
          processing: {
            batchSize: 10,
            retryAttempts: 3,
            duplicateThreshold: 85,
            autoProcessing: true,
            processingSchedule: '0 * * * *',
          },
          translation: {
            enabled: true,
            targetLanguages: ['es', 'en'],
            qualityThreshold: 80,
          },
          summarization: {
            enabled: true,
            maxLength: 300,
            minLength: 100,
          },
        },
        description: 'AI Processing Configuration',
      },
      {
        key: 'notification_settings',
        value: {
          email: {
            enabled: true,
            templates: {
              welcome: 'default',
              article_published: 'default',
              role_change: 'default',
            },
          },
          push: {
            enabled: false,
            vapid_public_key: null,
          },
        },
        description: 'Notification Settings',
      },
      {
        key: 'seo_settings',
        value: {
          default_title:
            'Stakeados - Plataforma de Aprendizaje Descentralizada',
          default_description:
            'Descubre artículos, noticias y cursos sobre aprendizaje descentralizado',
          default_keywords:
            'educación blockchain, aprendizaje descentralizado, cursos crypto',
          og_image: '/images/og-default.jpg',
          twitter_card: 'summary_large_image',
        },
        description: 'SEO Settings',
      },
    ];

    for (const setting of defaultSettings) {
      const { error: insertError } = await supabase
        .from('system_settings')
        .upsert(setting, { onConflict: 'key' });

      if (insertError) {
        console.log(
          `⚠️  Error al insertar ${setting.key}:`,
          insertError.message
        );
      } else {
        console.log(`✅ Configuración ${setting.key} insertada`);
      }
    }

    console.log('🎉 Proceso completado');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createSystemSettings();
