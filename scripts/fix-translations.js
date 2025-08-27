const fs = require('fs');
const path = require('path');

// Función para limpiar un objeto JSON eliminando claves duplicadas
function cleanJsonObject(obj, path = '') {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => cleanJsonObject(item, `${path}[${index}]`));
  }

  const cleaned = {};
  const seenKeys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    if (seenKeys.has(key)) {
      console.log(`⚠️  Clave duplicada encontrada: ${path}.${key}`);
      continue;
    }
    seenKeys.add(key);
    cleaned[key] = cleanJsonObject(value, path ? `${path}.${key}` : key);
  }

  return cleaned;
}

// Función para arreglar errores de sintaxis JSON comunes
function fixJsonSyntax(content) {
  // Arreglar comas faltantes antes de llaves de cierre
  content = content.replace(/([^,}])\s*\n\s*}/g, '$1,\n  }');

  // Arreglar comas faltantes antes de corchetes de cierre
  content = content.replace(/([^,\]])\s*\n\s*]/g, '$1,\n  ]');

  // Arreglar comas extra al final de objetos
  content = content.replace(/,(\s*[}\]])/g, '$1');

  return content;
}

// Función para procesar un archivo de traducciones
function processTranslationFile(filePath) {
  console.log(`\n🔧 Procesando: ${filePath}`);

  try {
    // Leer el archivo
    let content = fs.readFileSync(filePath, 'utf8');

    // Arreglar sintaxis JSON
    content = fixJsonSyntax(content);

    // Parsear JSON
    let jsonData;
    try {
      jsonData = JSON.parse(content);
    } catch (parseError) {
      console.error(
        `❌ Error al parsear JSON en ${filePath}:`,
        parseError.message
      );
      return false;
    }

    // Limpiar claves duplicadas
    const cleanedData = cleanJsonObject(jsonData);

    // Crear backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);
    console.log(`💾 Backup creado: ${backupPath}`);

    // Escribir archivo limpio
    const cleanedContent = JSON.stringify(cleanedData, null, 2);
    fs.writeFileSync(filePath, cleanedContent);

    console.log(`✅ Archivo procesado exitosamente: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Función principal
function main() {
  console.log('🚀 Iniciando limpieza de archivos de traducciones...');

  const messagesDir = path.join(__dirname, '..', 'messages');
  const translationFiles = ['en.json', 'es.json'];

  let successCount = 0;
  let totalCount = 0;

  for (const fileName of translationFiles) {
    const filePath = path.join(messagesDir, fileName);

    if (fs.existsSync(filePath)) {
      totalCount++;
      if (processTranslationFile(filePath)) {
        successCount++;
      }
    } else {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${successCount}/${totalCount}`);

  if (successCount === totalCount) {
    console.log('🎉 ¡Todos los archivos fueron procesados exitosamente!');
  } else {
    console.log(
      '⚠️  Algunos archivos tuvieron problemas. Revisa los logs arriba.'
    );
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { processTranslationFile, cleanJsonObject, fixJsonSyntax };
