const fs = require('fs');
const path = require('path');

// Mapeo de nombres de archivos para estandarizar
const fileMappings = {
  'src/components/ui/Badge.tsx': 'src/components/ui/badge.tsx',
  'src/components/ui/Button.tsx': 'src/components/ui/button.tsx',
  'src/components/ui/Card.tsx': 'src/components/ui/card.tsx',
  'src/components/ui/Input.tsx': 'src/components/ui/input.tsx',
  'src/components/ui/Select.tsx': 'src/components/ui/select.tsx',
  'src/components/ui/Tabs.tsx': 'src/components/ui/tabs.tsx',
  'src/components/ui/Textarea.tsx': 'src/components/ui/textarea.tsx',
};

function standardizeFileNames() {
  console.log('🔧 Estandarizando nombres de archivos...');

  let successCount = 0;
  let totalCount = 0;

  for (const [oldPath, newPath] of Object.entries(fileMappings)) {
    if (fs.existsSync(oldPath)) {
      try {
        // Leer el contenido del archivo
        const content = fs.readFileSync(oldPath, 'utf8');

        // Crear el directorio si no existe
        const dir = path.dirname(newPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Escribir el archivo con el nuevo nombre
        fs.writeFileSync(newPath, content);

        // Eliminar el archivo antiguo
        fs.unlinkSync(oldPath);

        console.log(`✅ Renombrado: ${oldPath} → ${newPath}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error renombrando ${oldPath}:`, error.message);
      }
    }
    totalCount++;
  }

  console.log(
    `\n📊 Resumen: ${successCount}/${totalCount} archivos renombrados`
  );
  return successCount === totalCount;
}

function updateImports() {
  console.log('\n🔗 Actualizando importaciones...');

  const uiDir = 'src/components/ui';
  const files = fs.readdirSync(uiDir).filter(file => file.endsWith('.tsx'));

  // Crear un archivo index.ts actualizado
  const indexContent = files
    .map(file => {
      const componentName = path.basename(file, '.tsx');
      const pascalCase =
        componentName.charAt(0).toUpperCase() + componentName.slice(1);
      return `export { default as ${pascalCase} } from './${componentName}';`;
    })
    .join('\n');

  fs.writeFileSync(path.join(uiDir, 'index.ts'), indexContent);
  console.log('✅ Archivo index.ts actualizado');
}

function main() {
  console.log('🚀 Iniciando estandarización de nombres de archivos...\n');

  const filesOk = standardizeFileNames();
  updateImports();

  if (filesOk) {
    console.log('\n🎉 ¡Estandarización completada!');
  } else {
    console.log(
      '\n⚠️  Algunos archivos tuvieron problemas. Revisa los logs arriba.'
    );
  }
}

if (require.main === module) {
  main();
}

module.exports = { standardizeFileNames, updateImports };
