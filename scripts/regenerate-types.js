#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Regenerando tipos de Supabase...');

try {
  // Verificar si Supabase está ejecutándose
  console.log('📡 Verificando Supabase local...');
  execSync('npx supabase status', { stdio: 'pipe' });
  
  // Generar tipos desde el proyecto local
  console.log('📝 Generando tipos desde Supabase local...');
  execSync('npx supabase gen types typescript --local > src/types/supabase.ts', { stdio: 'inherit' });
  
  console.log('✅ Tipos regenerados exitosamente');
  
  // Verificar que el archivo se generó correctamente
  const typesPath = path.join(process.cwd(), 'src/types/supabase.ts');
  if (fs.existsSync(typesPath)) {
    const stats = fs.statSync(typesPath);
    console.log(`📊 Archivo generado: ${stats.size} bytes`);
  }
  
} catch (error) {
  console.error('❌ Error regenerando tipos:', error.message);
  
  if (error.message.includes('not running')) {
    console.log('💡 Iniciando Supabase local...');
    try {
      execSync('npx supabase start', { stdio: 'inherit' });
      console.log('🔄 Intentando regenerar tipos nuevamente...');
      execSync('npx supabase gen types typescript --local > src/types/supabase.ts', { stdio: 'inherit' });
      console.log('✅ Tipos regenerados exitosamente');
    } catch (startError) {
      console.error('❌ Error iniciando Supabase:', startError.message);
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
}

console.log('🎉 Proceso completado');
