const fs = require('fs');
const path = require('path');

// Lista de dependencias requeridas
const requiredDependencies = [
  '@radix-ui/react-dialog',
  '@radix-ui/react-popover',
  '@radix-ui/react-progress',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-separator',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-select',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-label',
  '@radix-ui/react-slider',
  '@radix-ui/react-tooltip',
  '@radix-ui/react-alert-dialog',
  'sonner',
  'lucide-react',
  '@supabase/supabase-js',
  'wagmi',
  'viem',
  '@tanstack/react-query',
];

// Lista de archivos que deben existir
const requiredFiles = [
  'src/hooks/useUser.ts',
  'src/lib/services/realTimeService.ts',
  'src/components/ui/dialog.tsx',
  'src/components/ui/popover.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/scroll-area.tsx',
  'src/components/ui/separator.tsx',
  'src/components/ui/switch.tsx',
];

function checkDependencies() {
  console.log('🔍 Verificando dependencias...');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const missingDeps = [];

    for (const dep of requiredDependencies) {
      if (!dependencies[dep]) {
        missingDeps.push(dep);
      }
    }

    if (missingDeps.length > 0) {
      console.log('❌ Dependencias faltantes:');
      missingDeps.forEach(dep => console.log(`   - ${dep}`));
      return false;
    } else {
      console.log('✅ Todas las dependencias están instaladas');
      return true;
    }
  } catch (error) {
    console.error('❌ Error leyendo package.json:', error.message);
    return false;
  }
}

function checkFiles() {
  console.log('\n📁 Verificando archivos requeridos...');

  const missingFiles = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.log('❌ Archivos faltantes:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    return false;
  } else {
    console.log('✅ Todos los archivos requeridos existen');
    return true;
  }
}

function checkImports() {
  console.log('\n🔗 Verificando importaciones...');

  const uiDir = 'src/components/ui';
  const files = fs.readdirSync(uiDir).filter(file => file.endsWith('.tsx'));

  let hasErrors = false;

  for (const file of files) {
    const filePath = path.join(uiDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Verificar importaciones de Radix UI
    const radixImports = content.match(/@radix-ui\/react-[a-zA-Z-]+/g);
    if (radixImports) {
      for (const import_ of radixImports) {
        const depName = import_.split('/')[1];
        if (!fs.existsSync(`node_modules/${import_}`)) {
          console.log(`❌ Dependencia faltante en ${file}: ${import_}`);
          hasErrors = true;
        }
      }
    }
  }

  if (!hasErrors) {
    console.log('✅ Todas las importaciones están correctas');
  }

  return !hasErrors;
}

function main() {
  console.log('🚀 Iniciando verificación de dependencias y archivos...\n');

  const depsOk = checkDependencies();
  const filesOk = checkFiles();
  const importsOk = checkImports();

  console.log('\n📊 Resumen:');
  console.log(`   Dependencias: ${depsOk ? '✅' : '❌'}`);
  console.log(`   Archivos: ${filesOk ? '✅' : '❌'}`);
  console.log(`   Importaciones: ${importsOk ? '✅' : '❌'}`);

  if (depsOk && filesOk && importsOk) {
    console.log('\n🎉 ¡Todo está correcto!');
  } else {
    console.log('\n⚠️  Se encontraron problemas. Revisa los logs arriba.');
    console.log('\n💡 Sugerencias:');
    if (!depsOk) {
      console.log('   - Ejecuta: npm install');
    }
    if (!filesOk) {
      console.log('   - Verifica que todos los archivos requeridos existan');
    }
    if (!importsOk) {
      console.log('   - Reinstala las dependencias: npm install');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkDependencies, checkFiles, checkImports };
