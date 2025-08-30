#!/usr/bin/env node

/**
 * Documentation Validation System
 * 
 * This script validates documentation by:
 * 1. Checking for broken links (internal and external)
 * 2. Validating code examples in markdown files
 * 3. Detecting outdated documentation based on file timestamps and content
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

class DocumentationValidator {
  constructor() {
    this.results = {
      brokenLinks: [],
      invalidCodeExamples: [],
      outdatedDocs: [],
      totalFiles: 0,
      totalLinks: 0,
      totalCodeBlocks: 0
    };
    
    this.docsPath = path.join(process.cwd(), 'docs');
    this.srcPath = path.join(process.cwd(), 'src');
    this.specPath = path.join(process.cwd(), '.kiro/specs');
  }

  async validateAll() {
    console.log('🔍 Starting documentation validation...\n');
    
    const markdownFiles = this.findMarkdownFiles([
      this.docsPath,
      this.specPath,
      path.join(process.cwd(), 'README.md')
    ]);
    
    this.results.totalFiles = markdownFiles.length;
    console.log(`Found ${markdownFiles.length} markdown files to validate\n`);

    for (const file of markdownFiles) {
      console.log(`Validating: ${path.relative(process.cwd(), file)}`);
      await this.validateFile(file);
    }

    this.generateReport();
  }

  findMarkdownFiles(paths) {
    const files = [];
    
    for (const searchPath of paths) {
      if (fs.existsSync(searchPath)) {
        if (fs.statSync(searchPath).isFile() && searchPath.endsWith('.md')) {
          files.push(searchPath);
        } else if (fs.statSync(searchPath).isDirectory()) {
          files.push(...this.findMarkdownFilesRecursive(searchPath));
        }
      }
    }
    
    return files;
  }

  findMarkdownFilesRecursive(dir) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          files.push(...this.findMarkdownFilesRecursive(fullPath));
        } else if (stat.isFile() && entry.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
    }
    
    return files;
  }

  async validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Validate links
    await this.validateLinks(content, relativePath);
    
    // Validate code examples
    this.validateCodeExamples(content, relativePath);
    
    // Check if documentation is outdated
    this.checkOutdatedDocumentation(filePath, content, relativePath);
  }

  async validateLinks(content, filePath) {
    // Match markdown links: [text](url) and [text]: url
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)|\[([^\]]+)\]:\s*(.+)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1] || match[3];
      const linkUrl = match[2] || match[4];
      
      if (!linkUrl) continue;
      
      this.results.totalLinks++;
      
      // Skip anchors and mailto links
      if (linkUrl.startsWith('#') || linkUrl.startsWith('mailto:')) {
        continue;
      }
      
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        // External link - check if accessible
        const isValid = await this.checkExternalLink(linkUrl);
        if (!isValid) {
          this.results.brokenLinks.push({
            file: filePath,
            link: linkUrl,
            text: linkText,
            type: 'external'
          });
        }
      } else {
        // Internal link - check if file exists
        const isValid = this.checkInternalLink(linkUrl, filePath);
        if (!isValid) {
          this.results.brokenLinks.push({
            file: filePath,
            link: linkUrl,
            text: linkText,
            type: 'internal'
          });
        }
      }
    }
  }

  async checkExternalLink(url) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https:') ? https : http;
      const timeout = 5000;
      
      const req = protocol.get(url, { timeout }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
      req.setTimeout(timeout, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  checkInternalLink(linkUrl, currentFilePath) {
    // Remove anchor from link
    const cleanUrl = linkUrl.split('#')[0];
    if (!cleanUrl) return true; // Just an anchor
    
    const currentDir = path.dirname(path.resolve(currentFilePath));
    const targetPath = path.resolve(currentDir, cleanUrl);
    
    return fs.existsSync(targetPath);
  }

  validateCodeExamples(content, filePath) {
    // Match code blocks with language specification
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1];
      const code = match[2];
      
      this.results.totalCodeBlocks++;
      
      if (!language) continue;
      
      const validation = this.validateCodeBlock(code, language, filePath);
      if (!validation.isValid) {
        this.results.invalidCodeExamples.push({
          file: filePath,
          language,
          error: validation.error,
          code: code.substring(0, 100) + (code.length > 100 ? '...' : '')
        });
      }
    }
  }

  validateCodeBlock(code, language, filePath) {
    try {
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          return this.validateJavaScript(code);
        case 'typescript':
        case 'ts':
          return this.validateTypeScript(code);
        case 'json':
          return this.validateJSON(code);
        case 'sql':
          return this.validateSQL(code);
        default:
          return { isValid: true }; // Skip validation for unknown languages
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error.message}`
      };
    }
  }

  validateJavaScript(code) {
    try {
      // Basic syntax check using Function constructor
      new Function(code);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `JavaScript syntax error: ${error.message}`
      };
    }
  }

  validateTypeScript(code) {
    // For TypeScript, we'll do basic JavaScript validation
    // In a real implementation, you'd use the TypeScript compiler API
    return this.validateJavaScript(code);
  }

  validateJSON(code) {
    try {
      JSON.parse(code);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `JSON syntax error: ${error.message}`
      };
    }
  }

  validateSQL(code) {
    // Basic SQL validation - check for common syntax patterns
    const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN|GROUP BY|ORDER BY)\b/i;
    
    if (!sqlKeywords.test(code)) {
      return {
        isValid: false,
        error: 'SQL code does not contain recognizable SQL keywords'
      };
    }
    
    return { isValid: true };
  }

  checkOutdatedDocumentation(filePath, content, relativePath) {
    const stats = fs.statSync(filePath);
    const lastModified = stats.mtime;
    const now = new Date();
    const daysSinceModified = (now - lastModified) / (1000 * 60 * 60 * 24);
    
    // Check for outdated indicators
    const outdatedIndicators = [
      /TODO:/gi,
      /FIXME:/gi,
      /\b(coming soon|under construction|work in progress)\b/gi,
      /\b(version \d+\.\d+)\b/gi // Version references that might be outdated
    ];
    
    const foundIndicators = [];
    for (const indicator of outdatedIndicators) {
      const matches = content.match(indicator);
      if (matches) {
        foundIndicators.push(...matches);
      }
    }
    
    // Check if file references non-existent files
    const fileReferences = content.match(/`[^`]*\.(js|ts|jsx|tsx|json|md)`/g) || [];
    const missingFiles = [];
    
    for (const ref of fileReferences) {
      const fileName = ref.slice(1, -1); // Remove backticks
      const fullPath = path.resolve(path.dirname(filePath), fileName);
      if (!fs.existsSync(fullPath)) {
        missingFiles.push(fileName);
      }
    }
    
    if (daysSinceModified > 90 || foundIndicators.length > 0 || missingFiles.length > 0) {
      this.results.outdatedDocs.push({
        file: relativePath,
        lastModified: lastModified.toISOString().split('T')[0],
        daysSinceModified: Math.round(daysSinceModified),
        indicators: foundIndicators,
        missingFiles
      });
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 DOCUMENTATION VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Summary:`);
    console.log(`  Files validated: ${this.results.totalFiles}`);
    console.log(`  Links checked: ${this.results.totalLinks}`);
    console.log(`  Code blocks validated: ${this.results.totalCodeBlocks}`);
    
    console.log(`\n🔗 Broken Links: ${this.results.brokenLinks.length}`);
    if (this.results.brokenLinks.length > 0) {
      this.results.brokenLinks.forEach(link => {
        console.log(`  ❌ ${link.file}: "${link.text}" -> ${link.link} (${link.type})`);
      });
    }
    
    console.log(`\n💻 Invalid Code Examples: ${this.results.invalidCodeExamples.length}`);
    if (this.results.invalidCodeExamples.length > 0) {
      this.results.invalidCodeExamples.forEach(code => {
        console.log(`  ❌ ${code.file} (${code.language}): ${code.error}`);
      });
    }
    
    console.log(`\n📅 Potentially Outdated Documentation: ${this.results.outdatedDocs.length}`);
    if (this.results.outdatedDocs.length > 0) {
      this.results.outdatedDocs.forEach(doc => {
        console.log(`  ⚠️  ${doc.file} (last modified: ${doc.lastModified}, ${doc.daysSinceModified} days ago)`);
        if (doc.indicators.length > 0) {
          console.log(`      Indicators: ${doc.indicators.join(', ')}`);
        }
        if (doc.missingFiles.length > 0) {
          console.log(`      Missing files: ${doc.missingFiles.join(', ')}`);
        }
      });
    }
    
    // Save detailed report to file
    const reportPath = path.join(process.cwd(), 'docs-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with error code if issues found
    const hasIssues = this.results.brokenLinks.length > 0 || 
                     this.results.invalidCodeExamples.length > 0;
    
    if (hasIssues) {
      console.log('\n❌ Validation completed with errors');
      process.exit(1);
    } else {
      console.log('\n✅ All documentation validation checks passed!');
      process.exit(0);
    }
  }
}

// CLI interface
if (require.main === module) {
  const validator = new DocumentationValidator();
  validator.validateAll().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = DocumentationValidator;