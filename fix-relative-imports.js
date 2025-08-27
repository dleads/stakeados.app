const fs = require('fs');
const path = require('path');

// Función para calcular la ruta relativa correcta
function getRelativePath(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  const relativePath = path.relative(fromDir, toFile);
  return relativePath.replace(/\\/g, '/'); // Normalizar para Unix-style paths
}

// Función para buscar archivos recursivamente
function findFiles(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(findFiles(filePath, extension));
      }
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });

  return results;
}

// Función para corregir importaciones con rutas relativas correctas
function fixRelativeImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Calcular rutas relativas correctas
    const clientPath = getRelativePath(filePath, 'src/lib/supabase/client.ts');
    const serverPath = getRelativePath(filePath, 'src/lib/supabase/server.ts');
    const authPath = getRelativePath(filePath, 'src/lib/supabase/auth.ts');

    // Corregir importaciones de client
    if (content.includes("from '../supabase/client'")) {
      content = content.replace(
        /from '\.\.\/supabase\/client'/g,
        `from '${clientPath.replace('.ts', '')}'`
      );
      modified = true;
    }

    // Corregir importaciones de server
    if (content.includes("from '../supabase/server'")) {
      content = content.replace(
        /from '\.\.\/supabase\/server'/g,
        `from '${serverPath.replace('.ts', '')}'`
      );
      modified = true;
    }

    // Corregir importaciones de auth
    if (content.includes("from '../supabase/auth'")) {
      content = content.replace(
        /from '\.\.\/supabase\/auth'/g,
        `from '${authPath.replace('.ts', '')}'`
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed relative paths: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Ejecutar corrección
console.log('🔧 Starting relative import fixes...\n');

const tsFiles = findFiles('./src', '.ts');
const tsxFiles = findFiles('./src', '.tsx');
const allFiles = [...tsFiles, ...tsxFiles];

let fixedCount = 0;

allFiles.forEach(file => {
  if (fixRelativeImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Completed! Fixed relative paths in ${fixedCount} files.`);
