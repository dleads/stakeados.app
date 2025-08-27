const fs = require('fs');
const path = require('path');

// Función para buscar archivos recursivamente
function findFiles(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      // Evitar node_modules y .next
      if (!file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(findFiles(filePath, extension));
      }
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });

  return results;
}

// Función para corregir importaciones en un archivo
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Normalizar importaciones de Supabase a alias absolutos correctos
    // Revertir rutas relativas incorrectas a '@/lib/supabase/*'
    if (content.includes("from '../supabase/client'")) {
      content = content.replace(
        /from '\.\.\/supabase\/client'/g,
        "from '@/lib/supabase/client'"
      );
      modified = true;
    }
    if (content.includes("from '../supabase/server'")) {
      content = content.replace(
        /from '\.\.\/supabase\/server'/g,
        "from '@/lib/supabase/server'"
      );
      modified = true;
    }
    if (content.includes("from '../supabase/auth'")) {
      content = content.replace(
        /from '\.\.\/supabase\/auth'/g,
        "from '@/lib/supabase/auth'"
      );
      modified = true;
    }

    // Normalizar rutas de UI que usan mayúsculas a minúsculas reales
    // Casos detectados en el build: Badge, Button, Card, Input, Select, Tabs, Textarea
    const uiCasingPattern =
      /@\/components\/ui\/(Badge|Button|Card|Input|Select|Tabs|Textarea)\b/g;
    if (uiCasingPattern.test(content)) {
      content = content.replace(
        uiCasingPattern,
        (match, comp) => `@/components/ui/${comp.toLowerCase()}`
      );
      modified = true;
    }

    // Convertir imports por default a imports con nombre para UI y ajustar casing de ruta
    const defaultToNamedRules = [
      { comp: 'Button', named: 'Button' },
      { comp: 'Badge', named: 'Badge' },
      { comp: 'Card', named: 'Card' },
      { comp: 'Input', named: 'Input' },
      { comp: 'Select', named: 'Select' },
      { comp: 'Tabs', named: 'Tabs' },
      { comp: 'Textarea', named: 'Textarea' },
    ];
    defaultToNamedRules.forEach(({ comp, named }) => {
      const regex = new RegExp(
        `import\\s+([A-Za-z_][A-Za-z0-9_]*)\\s+from\\s+['"]@/components/ui/${comp}['"]`,
        'g'
      );
      if (regex.test(content)) {
        content = content.replace(regex, (m, localName) => {
          // Si el nombre local difiere (alias), respétalo con as
          if (localName !== named) {
            return `import { ${named} as ${localName} } from '@/components/ui/${comp.toLowerCase()}'`;
          }
          return `import { ${named} } from '@/components/ui/${comp.toLowerCase()}'`;
        });
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Ejecutar corrección
console.log('🔧 Starting import fixes...\n');

const tsFiles = findFiles('./src', '.ts');
const tsxFiles = findFiles('./src', '.tsx');
const allFiles = [...tsFiles, ...tsxFiles];

let fixedCount = 0;

allFiles.forEach(file => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Completed! Fixed ${fixedCount} files.`);
