const fs = require('fs').promises;
const path = require('path');

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Replace imports
    content = content.replace(
      /import \{ createRouteHandlerClient \} from '@supabase\/auth-helpers-nextjs';/g,
      'import { createServerClient } from \'@supabase/ssr\';'
    );

    content = content.replace(
      /import \{ createServerComponentClient \} from '@supabase\/auth-helpers-nextjs';/g,
      'import { createServerComponentClient } from \'@supabase/ssr\';'
    );

    // Replace createRouteHandlerClient usage
    content = content.replace(
      /const supabase = createRouteHandlerClient\(\{ cookies: \(\) => cookies\(\) \}\)/g,
      `const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name) {
              return cookies().get(name)?.value;
            },
            set(name, value, options) {
              cookies().set({ name, value, ...options });
            },
            remove(name, options) {
              cookies().set({ name, value: '', ...options });
            },
          },
        }
      )`
    );

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }
}

async function processDirectory(directory) {
  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(directory, file.name);
      
      if (file.isDirectory()) {
        await processDirectory(fullPath);
      } else if (
        file.name.endsWith('.ts') || 
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.jsx')
      ) {
        await updateFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

// Start processing from the src directory
const srcDir = path.join(__dirname, '..', 'src');
processDirectory(srcDir)
  .then(() => console.log('🎉 All files processed!'))
  .catch(console.error);
