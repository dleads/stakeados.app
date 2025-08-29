const fs = require('fs');
const path = require('path');

// Lista de archivos que necesitan corrección
const filesToFix = [
  'src/app/api/subscriptions/[id]/route.ts',
  'src/app/api/subscriptions/targets/route.ts',
  'src/app/api/subscriptions/stats/route.ts',
  'src/app/api/subscriptions/route.ts',
  'src/app/api/articles/proposals/[id]/route.ts',
  'src/app/api/articles/proposals/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/notifications/[id]/read/route.ts',
  'src/app/api/notifications/push/unsubscribe/route.ts',
  'src/app/api/notifications/preferences/route.ts',
  'src/app/api/notifications/unsubscribe/route.ts',
  'src/app/api/notifications/push/subscribe/route.ts',
  'src/app/api/notifications/preferences/quiet-hours/route.ts',
  'src/app/api/notifications/stats/route.ts',
  'src/app/api/notifications/preferences/import/route.ts',
  'src/app/api/notifications/preferences/export/route.ts',
  'src/app/api/notifications/mark-all-read/route.ts',
  'src/app/api/admin/analytics/trends/route.ts',
  'src/app/api/notifications/unread-count/route.ts',
  'src/app/api/admin/news-sources/[id]/route.ts',
  'src/app/api/admin/analytics/news/route.ts',
  'src/app/api/admin/news-sources/[id]/fetch/route.ts',
  'src/app/api/admin/analytics/authors/route.ts',
  'src/app/api/admin/analytics/export/route.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Reemplazar createRouteHandlerClient con createServerClient
    content = content.replace(/createRouteHandlerClient/g, 'createServerClient');
    
    // Asegurar que createServerClient esté importado
    if (!content.includes("import { createServerClient } from '@supabase/ssr';")) {
      // Buscar la línea de importación de @supabase/ssr y agregar createServerClient
      const importRegex = /import.*from ['"]@supabase\/ssr['"];?/;
      if (importRegex.test(content)) {
        content = content.replace(
          /import\s*{([^}]*)}\s*from\s*['"]@supabase\/ssr['"];?/,
          (match, imports) => {
            const importList = imports.split(',').map(i => i.trim());
            if (!importList.includes('createServerClient')) {
              importList.push('createServerClient');
            }
            return `import { ${importList.join(', ')} } from '@supabase/ssr';`;
          }
        );
      } else {
        // Agregar la importación si no existe
        const lines = content.split('\n');
        const insertIndex = lines.findIndex(line => line.includes('import')) + 1;
        lines.splice(insertIndex, 0, "import { createServerClient } from '@supabase/ssr';");
        content = lines.join('\n');
      }
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Corregido: ${filePath}`);
  } else {
    console.log(`❌ No encontrado: ${filePath}`);
  }
});

console.log('\n🎉 Todas las rutas API han sido corregidas.');
