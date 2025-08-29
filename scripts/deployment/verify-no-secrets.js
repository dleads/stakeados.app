#!/usr/bin/env node

/**
 * Script para verificar que no hay secretos en el código antes del build
 * Este script se ejecuta después de la limpieza para asegurar que no hay secretos
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando que no hay secretos en el código...');

// Patrones que indican posibles secretos
const secretPatterns = [
  {
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    name: 'OpenAI API Key',
    severity: 'high'
  },
  {
    pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    name: 'JWT Token',
    severity: 'high'
  },
  {
    pattern: /re_[a-zA-Z0-9]{32}/g,
    name: 'Resend API Key',
    severity: 'high'
  },
  {
    pattern: /[a-zA-Z0-9]{48,}/g,
    name: 'Long API Key',
    severity: 'medium'
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/gi,
    name: 'Hardcoded Password',
    severity: 'high'
  },
  {
    pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi,
    name: 'Hardcoded API Key',
    severity: 'high'
  }
];

// Archivos y directorios a verificar
const filesToCheck = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx',
  'components/**/*.ts',
  'components/**/*.tsx',
  'lib/**/*.ts',
  'lib/**/*.js',
  'config/**/*.env',
  'config/**/*.js',
  'config/**/*.ts'
];

// Archivos y directorios a excluir
const excludePatterns = [
  'node_modules',
  '.next',
  '.netlify',
  'dist',
  'build',
  'out',
  'coverage',
  '.git',
  'test-reports'
];

function shouldExcludeFile(filePath) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function checkFileForSecrets(filePath) {
  try {
    if (!fs.existsSync(filePath) || shouldExcludeFile(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];

    secretPatterns.forEach(({ pattern, name, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({
          file: filePath,
          pattern: name,
          severity,
          count: matches.length,
          examples: matches.slice(0, 3) // Solo mostrar los primeros 3 ejemplos
        });
      }
    });

    return findings;
  } catch (error) {
    console.log(`⚠️  Error al verificar ${filePath}: ${error.message}`);
    return [];
  }
}

function findFiles(pattern) {
  const glob = require('glob');
  try {
    return glob.sync(pattern, { ignore: excludePatterns });
  } catch (error) {
    console.log(`⚠️  Error al buscar archivos con patrón ${pattern}: ${error.message}`);
    return [];
  }
}

// Verificar archivos
let allFindings = [];

filesToCheck.forEach(pattern => {
  const files = findFiles(pattern);
  files.forEach(file => {
    const findings = checkFileForSecrets(file);
    allFindings = allFindings.concat(findings);
  });
});

// Mostrar resultados
if (allFindings.length === 0) {
  console.log('✅ No se encontraron secretos en el código.');
  process.exit(0);
} else {
  console.log(`❌ Se encontraron ${allFindings.length} posibles secretos:`);
  
  allFindings.forEach(finding => {
    console.log(`\n📁 ${finding.file}`);
    console.log(`   Patrón: ${finding.pattern}`);
    console.log(`   Severidad: ${finding.severity}`);
    console.log(`   Cantidad: ${finding.count}`);
    console.log(`   Ejemplos: ${finding.examples.join(', ')}`);
  });

  const highSeverityFindings = allFindings.filter(f => f.severity === 'high');
  
  if (highSeverityFindings.length > 0) {
    console.log(`\n🚨 Se encontraron ${highSeverityFindings.length} secretos de alta severidad.`);
    console.log('El build fallará por seguridad.');
    process.exit(1);
  } else {
    console.log('\n⚠️  Se encontraron secretos de baja/media severidad.');
    console.log('Revisa los archivos antes de continuar.');
    process.exit(0);
  }
}
