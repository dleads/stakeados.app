#!/usr/bin/env node

/**
 * File Catalog Generator
 * 
 * Creates a comprehensive catalog of all files in /docs, /tododoc, and specifications
 */

const fs = require('fs');
const path = require('path');

class FileCatalogGenerator {
  constructor() {
    this.catalog = {
      docs: [],
      tododoc: [],
      kiroSpecs: [],
      tododocSpecs: [],
      summary: {}
    };
  }

  async generateCatalog() {
    console.log('📋 Generating comprehensive file catalog...\n');
    
    try {
      // Catalog each directory
      await this.catalogDirectory('docs', path.join(process.cwd(), 'docs'));
      await this.catalogDirectory('tododoc', path.join(process.cwd(), 'tododoc'));
      await this.catalogDirectory('kiroSpecs', path.join(process.cwd(), '.kiro', 'specs'));
      await this.catalogDirectory('tododocSpecs', path.join(process.cwd(), 'tododoc', 'specs'));
      
      // Generate summary
      this.generateSummary();
      
      // Write catalog files
      await this.writeCatalogFiles();
      
      console.log('✅ File catalog generated successfully!');
      console.log('📄 Files created:');
      console.log('  - file-catalog.json');
      console.log('  - file-catalog.md');
      
    } catch (error) {
      console.error('❌ Error generating catalog:', error.message);
      process.exit(1);
    }
  }

  async catalogDirectory(catalogKey, dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      return;
    }

    console.log(`📁 Cataloging ${dirPath}...`);
    const files = await this.scanDirectory(dirPath);
    this.catalog[catalogKey] = files;
    console.log(`   Found ${files.length} files`);
  }

  async scanDirectory(dirPath, relativeTo = dirPath) {
    const files = [];
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(relativeTo, fullPath);

      if (item.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await this.scanDirectory(fullPath, relativeTo);
        files.push(...subFiles);
      } else {
        // Add file to catalog
        const fileInfo = await this.getFileInfo(fullPath, relativePath);
        files.push(fileInfo);
      }
    }

    return files;
  }

  async getFileInfo(fullPath, relativePath) {
    const stats = fs.statSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    let content = null;
    let lineCount = 0;
    let wordCount = 0;
    
    // Read content for text files
    if (['.md', '.txt', '.json', '.js', '.ts', '.sql', '.yml', '.yaml', '.toml'].includes(ext)) {
      try {
        content = fs.readFileSync(fullPath, 'utf8');
        lineCount = content.split('\n').length;
        wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      } catch (error) {
        console.warn(`⚠️  Could not read file: ${fullPath}`);
      }
    }

    return {
      name: path.basename(fullPath),
      relativePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
      fullPath,
      extension: ext,
      size: stats.size,
      sizeHuman: this.formatBytes(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isTextFile: content !== null,
      lineCount,
      wordCount,
      contentPreview: content ? content.substring(0, 200).replace(/\n/g, ' ') : null,
      type: this.categorizeFile(fullPath, ext, content)
    };
  }

  categorizeFile(fullPath, ext, content) {
    const filename = path.basename(fullPath).toLowerCase();
    
    // Categorize by extension
    if (ext === '.md') {
      if (filename.includes('readme')) return 'readme';
      if (filename.includes('requirements')) return 'requirements';
      if (filename.includes('design')) return 'design';
      if (filename.includes('tasks')) return 'tasks';
      if (filename.includes('guide')) return 'guide';
      if (filename.includes('api')) return 'api-doc';
      return 'documentation';
    }
    
    if (ext === '.json') return 'config';
    if (ext === '.js' || ext === '.ts') return 'script';
    if (ext === '.sql') return 'database';
    if (ext === '.yml' || ext === '.yaml' || ext === '.toml') return 'config';
    if (ext === '.txt') return 'text';
    
    return 'other';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateSummary() {
    const allFiles = [
      ...this.catalog.docs,
      ...this.catalog.tododoc,
      ...this.catalog.kiroSpecs,
      ...this.catalog.tododocSpecs
    ];

    // Count by type
    const typeCount = {};
    const extensionCount = {};
    let totalSize = 0;
    let totalLines = 0;
    let totalWords = 0;

    allFiles.forEach(file => {
      typeCount[file.type] = (typeCount[file.type] || 0) + 1;
      extensionCount[file.extension] = (extensionCount[file.extension] || 0) + 1;
      totalSize += file.size;
      totalLines += file.lineCount;
      totalWords += file.wordCount;
    });

    this.catalog.summary = {
      totalFiles: allFiles.length,
      totalSize,
      totalSizeHuman: this.formatBytes(totalSize),
      totalLines,
      totalWords,
      byDirectory: {
        docs: this.catalog.docs.length,
        tododoc: this.catalog.tododoc.length,
        kiroSpecs: this.catalog.kiroSpecs.length,
        tododocSpecs: this.catalog.tododocSpecs.length
      },
      byType: typeCount,
      byExtension: extensionCount,
      largestFiles: allFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .map(f => ({ path: f.relativePath, size: f.sizeHuman })),
      mostRecentFiles: allFiles
        .sort((a, b) => new Date(b.modified) - new Date(a.modified))
        .slice(0, 10)
        .map(f => ({ path: f.relativePath, modified: f.modified }))
    };
  }

  async writeCatalogFiles() {
    // Write JSON catalog
    const jsonCatalog = {
      generatedAt: new Date().toISOString(),
      projectPath: process.cwd(),
      catalog: this.catalog
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'file-catalog.json'),
      JSON.stringify(jsonCatalog, null, 2)
    );

    // Write Markdown catalog
    const markdown = this.generateMarkdownCatalog();
    fs.writeFileSync(
      path.join(process.cwd(), 'file-catalog.md'),
      markdown
    );
  }

  generateMarkdownCatalog() {
    return `# Project File Catalog

Generated on: ${new Date().toLocaleString()}
Project Path: \`${process.cwd()}\`

## Summary

- **Total Files**: ${this.catalog.summary.totalFiles}
- **Total Size**: ${this.catalog.summary.totalSizeHuman}
- **Total Lines**: ${this.catalog.summary.totalLines.toLocaleString()}
- **Total Words**: ${this.catalog.summary.totalWords.toLocaleString()}

### Files by Directory
${Object.entries(this.catalog.summary.byDirectory)
  .map(([dir, count]) => `- **${dir}**: ${count} files`)
  .join('\n')}

### Files by Type
${Object.entries(this.catalog.summary.byType)
  .sort(([,a], [,b]) => b - a)
  .map(([type, count]) => `- **${type}**: ${count} files`)
  .join('\n')}

### Files by Extension
${Object.entries(this.catalog.summary.byExtension)
  .sort(([,a], [,b]) => b - a)
  .map(([ext, count]) => `- **${ext || 'no extension'}**: ${count} files`)
  .join('\n')}

## Largest Files
${this.catalog.summary.largestFiles
  .map((file, i) => `${i + 1}. \`${file.path}\` - ${file.size}`)
  .join('\n')}

## Most Recently Modified Files
${this.catalog.summary.mostRecentFiles
  .map((file, i) => `${i + 1}. \`${file.path}\` - ${new Date(file.modified).toLocaleString()}`)
  .join('\n')}

## Detailed File Listings

### /docs Directory (${this.catalog.docs.length} files)
${this.generateFileTable(this.catalog.docs)}

### /tododoc Directory (${this.catalog.tododoc.length} files)
${this.generateFileTable(this.catalog.tododoc)}

### .kiro/specs Directory (${this.catalog.kiroSpecs.length} files)
${this.generateFileTable(this.catalog.kiroSpecs)}

### tododoc/specs Directory (${this.catalog.tododocSpecs.length} files)
${this.generateFileTable(this.catalog.tododocSpecs)}

---
*This catalog was generated automatically by the File Catalog Generator*
`;
  }

  generateFileTable(files) {
    if (files.length === 0) {
      return '*No files found*';
    }

    const header = '| File | Type | Size | Lines | Modified |';
    const separator = '|------|------|------|-------|----------|';
    
    const rows = files
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
      .map(file => {
        const modifiedDate = new Date(file.modified).toLocaleDateString();
        return `| \`${file.relativePath}\` | ${file.type} | ${file.sizeHuman} | ${file.lineCount} | ${modifiedDate} |`;
      });

    return [header, separator, ...rows].join('\n');
  }
}

// Run the catalog generator if this script is executed directly
if (require.main === module) {
  const generator = new FileCatalogGenerator();
  generator.generateCatalog().catch(console.error);
}

module.exports = FileCatalogGenerator;