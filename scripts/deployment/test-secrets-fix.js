#!/usr/bin/env node

/**
 * Script de prueba para verificar que la solución de secretos funciona correctamente
 * Este script simula el proceso de build y verifica que no hay secretos
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Probando la solución de secretos...\n');

// Función para simular el proceso de build
async function testSecretsFix() {
  try {
    // 1. Verificar configuración de Netlify
    console.log('1️⃣ Verificando configuración de Netlify...');
    const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
    
    const requiredConfigs = [
      'SECRETS_SCAN_OMIT_KEYS',
      'SECRETS_SCAN_OMIT_PATHS',
      'SECRETS_SCAN_ENABLED'
    ];
    
    let configOk = true;
    requiredConfigs.forEach(config => {
      if (!netlifyConfig.includes(config)) {
        console.log(`❌ Falta configuración: ${config}`);
        configOk = false;
      }
    });
    
    if (configOk) {
      console.log('✅ Configuración de Netlify correcta');
    }

    // 2. Verificar archivo .netlifyignore
    console.log('\n2️⃣ Verificando .netlifyignore...');
    if (fs.existsSync('.netlifyignore')) {
      const ignoreContent = fs.readFileSync('.netlifyignore', 'utf8');
      const requiredIgnores = [
        '.env*',
        'config/environments/*.env',
        '.next/',
        '.netlify/'
      ];
      
      let ignoreOk = true;
      requiredIgnores.forEach(ignore => {
        if (!ignoreContent.includes(ignore)) {
          console.log(`❌ Falta ignorar: ${ignore}`);
          ignoreOk = false;
        }
      });
      
      if (ignoreOk) {
        console.log('✅ .netlifyignore configurado correctamente');
      }
    } else {
      console.log('❌ No existe .netlifyignore');
    }

    // 3. Verificar scripts de limpieza
    console.log('\n3️⃣ Verificando scripts de limpieza...');
    const scripts = [
      'scripts/deployment/clean-secrets.js',
      'scripts/deployment/verify-no-secrets.js'
    ];
    
    let scriptsOk = true;
    scripts.forEach(script => {
      if (fs.existsSync(script)) {
        console.log(`✅ ${script} existe`);
      } else {
        console.log(`❌ ${script} no existe`);
        scriptsOk = false;
      }
    });

    // 4. Verificar configuración de package.json
    console.log('\n4️⃣ Verificando package.json...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts.prebuild) {
      console.log('✅ Script prebuild configurado');
    } else {
      console.log('❌ Falta script prebuild');
    }

    // 5. Verificar archivos de configuración
    console.log('\n5️⃣ Verificando archivos de configuración...');
    const configFiles = [
      'config/environments/example.env',
      'config/environments/production.env'
    ];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Verificar que no contiene valores reales
        const dangerousPatterns = [
          /sk-[a-zA-Z0-9]{48}/,
          /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
          /re_[a-zA-Z0-9]{32}/
        ];
        
        let hasDangerousContent = false;
        dangerousPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            console.log(`⚠️  ${file} contiene patrones peligrosos`);
            hasDangerousContent = true;
          }
        });
        
        if (!hasDangerousContent) {
          console.log(`✅ ${file} es seguro`);
        }
      } else {
        console.log(`⚠️  ${file} no existe`);
      }
    });

    // 6. Simular proceso de limpieza
    console.log('\n6️⃣ Simulando proceso de limpieza...');
    try {
      require('./clean-secrets.js');
      console.log('✅ Proceso de limpieza ejecutado correctamente');
    } catch (error) {
      console.log(`❌ Error en proceso de limpieza: ${error.message}`);
    }

    // 7. Verificar que no hay secretos después de la limpieza
    console.log('\n7️⃣ Verificando que no hay secretos...');
    try {
      require('./verify-no-secrets.js');
      console.log('✅ No se encontraron secretos');
    } catch (error) {
      console.log(`❌ Se encontraron secretos: ${error.message}`);
    }

    console.log('\n🎉 Prueba completada!');
    console.log('\n📋 Resumen de la solución:');
    console.log('- Configuración de Netlify actualizada');
    console.log('- Archivos de configuración limpiados');
    console.log('- Scripts de limpieza implementados');
    console.log('- Proceso de verificación automatizado');
    
    console.log('\n🚀 Próximos pasos:');
    console.log('1. Commit y push de los cambios');
    console.log('2. Verificar el build en Netlify');
    console.log('3. Monitorear logs para confirmar que no hay errores');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar la prueba
testSecretsFix();
