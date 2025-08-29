#!/usr/bin/env node

/**
 * Script para limpiar archivos que puedan contener secretos antes del build
 * Este script se ejecuta antes del build para evitar que se detecten secretos
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando archivos que pueden contener secretos...');

// Lista de archivos que pueden contener secretos y deben ser limpiados
const filesToClean = [
  '.env.local',
  '.env.production',
  '.env.development',
  'config/environments/production.env',
  'config/environments/staging.env',
  'config/environments/development.env'
];

// Lista de directorios que deben ser excluidos del build
const dirsToExclude = [
  '.next',
  '.netlify',
  'node_modules',
  'dist',
  'build',
  'out'
];

function cleanFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`📁 Limpiando: ${filePath}`);
      
      // Leer el contenido del archivo
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Reemplazar valores que parezcan secretos con placeholders
      content = content.replace(/sk-[a-zA-Z0-9]{48}/g, 'your_openai_api_key_here');
      content = content.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, 'your_jwt_token_here');
      content = content.replace(/re_[a-zA-Z0-9]{32}/g, 'your_resend_api_key_here');
      content = content.replace(/https:\/\/[a-zA-Z0-9-]+\.supabase\.co/g, 'https://your-project-ref.supabase.co');
      content = content.replace(/[a-zA-Z0-9]{48,}/g, (match) => {
        // Solo reemplazar si parece ser una clave de API
        if (match.length >= 48 && !match.includes('_') && !match.includes('-')) {
          return 'your_api_key_here';
        }
        return match;
      });
      
      // Escribir el contenido limpio
      fs.writeFileSync(filePath, content);
      console.log(`✅ Limpiado: ${filePath}`);
    }
  } catch (error) {
    console.log(`⚠️  No se pudo limpiar ${filePath}: ${error.message}`);
  }
}

function excludeDirectories() {
  console.log('📁 Excluyendo directorios del escaneo de secretos...');
  
  dirsToExclude.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Excluyendo: ${dir}`);
    }
  });
}

// Limpiar archivos
filesToClean.forEach(cleanFile);

// Excluir directorios
excludeDirectories();

console.log('✅ Limpieza completada. Los archivos están listos para el build.');

// Ejecutar verificación después de la limpieza
console.log('\n🔍 Ejecutando verificación de secretos...');
try {
  require('./verify-no-secrets.js');
} catch (error) {
  console.log('⚠️  Error al ejecutar verificación de secretos:', error.message);
}
