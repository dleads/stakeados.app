#!/usr/bin/env node

/**
 * Documentation Review Script
 * 
 * Generates comprehensive reports for periodic documentation reviews
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentationReviewer {
  constructor() {
    this.results = {
      totalFiles: 0,
      outdatedFiles: [],
      todoComments: [],
      missingDocs: [],
      metrics: {},
      recommendations: []
    };
  }

  async generateReport(outputPath = 'documentation-review-report.md') {
    console.log('📚 Generating documentation review report...\n');

    try {
      this.analyzeDocumentationStructure();
      this.findOutdatedFiles();
      this.findTodoComments();
      this.checkMissingDocumentation();
      this.generateMetrics();
      this.generateRecommendations();
      
      const report = this.formatReport();
      fs.writeFileSync(outputPath, report);
      
      console.log(`✅ Report generated: ${outputPath}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error generating report:', error.message);
      return false;
    }
  }

  analyzeDocumentationStructure() {
    console.log('🔍 Analyzing documentation structure...');
    
    const docsPaths = ['docs', '.kiro/specs', 'README.md'];
    let totalFiles = 0;
    
    docsPaths.forEach(docPath => {
      if (fs.existsSync(docPath)) {
        if (fs.statSync(docPath).isDirectory()) {
          const files = this.getMarkdownFiles(docPath);
          totalFiles += files.length;
        } else if (docPath.endsWith('.md')) {
          totalFiles += 1;
        }
      }
    });
    
    this.results.totalFiles = totalFiles;
  }

  findOutdatedFiles() {
    console.log('📅 Checking for outdated files...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago
    
    const checkPaths = ['docs', '.kiro/specs'];
    
    checkPaths.forEach(checkPath => {
      if (fs.existsSync(checkPath)) {
        const files = this.getMarkdownFiles(checkPath);
        
        files.forEach(file => {
          const stats = fs.statSync(file);
          if (stats.mtime < cutoffDate) {
            this.results.outdatedFiles.push({
              file: file,
              lastModified: stats.mtime.toISOString().split('T')[0],
              daysOld: Math.floor((Date.now() - stats.mtime) / (1000 * 60 * 60 * 24))
            });
          }
        });
      }
    });
  }

  findTodoComments() {
    console.log('📝 Scanning for TODO comments...');
    
    const todoPattern = /(TODO|FIXME|XXX|HACK).*$/gm;
    const checkPaths = ['docs', '.kiro/specs', 'README.md'];
    
    checkPaths.forEach(checkPath => {
      if (fs.existsSync(checkPath)) {
        if (fs.statSync(checkPath).isDirectory()) {
          const files = this.getMarkdownFiles(checkPath);
          
          files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const matches = [...content.matchAll(todoPattern)];
            
            matches.forEach(match => {
              const lineNumber = content.substring(0, match.index).split('\n').length;
              this.results.todoComments.push({
                file: file,
                line: lineNumber,
                comment: match[0].trim()
              });
            });
          });
        } else if (checkPath.endsWith('.md')) {
          const content = fs.readFileSync(checkPath, 'utf8');
          const matches = [...content.matchAll(todoPattern)];
          
          matches.forEach(match => {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            this.results.todoComments.push({
              file: checkPath,
              line: lineNumber,
              comment: match[0].trim()
            });
          });
        }
      }
    });
  }

  checkMissingDocumentation() {
    console.log('🔍 Checking for missing documentation...');
    
    // Check for common missing docs
    const expectedDocs = [
      'docs/GETTING_STARTED.md',
      'docs/CONTRIBUTING.md',
      'docs/API_REFERENCE.md',
      'docs/DEPLOYMENT.md',
      'docs/TROUBLESHOOTING.md'
    ];
    
    expectedDocs.forEach(doc => {
      if (!fs.existsSync(doc)) {
        this.results.missingDocs.push(doc);
      }
    });
    
    // Check for features without documentation
    try {
      const srcFiles = this.getJSFiles('src');
      const componentFiles = srcFiles.filter(file => 
        file.includes('/components/') && !file.includes('.test.') && !file.includes('.spec.')
      );
      
      // Simple heuristic: check if major components have corresponding docs
      componentFiles.forEach(file => {
        const componentName = path.basename(file, path.extname(file));
        const possibleDocPaths = [
          `docs/components/${componentName}.md`,
          `docs/api/${componentName}.md`,
          `docs/guides/${componentName}.md`
        ];
        
        const hasDoc = possibleDocPaths.some(docPath => fs.existsSync(docPath));
        if (!hasDoc && componentName.length > 3) { // Skip very short names
          this.results.missingDocs.push(`Documentation for component: ${componentName}`);
        }
      });
    } catch (error) {
      console.warn('Could not analyze source files for missing docs');
    }
  }

  generateMetrics() {
    console.log('📊 Generating metrics...');
    
    this.results.metrics = {
      totalDocumentationFiles: this.results.totalFiles,
      outdatedFilesCount: this.results.outdatedFiles.length,
      todoCommentsCount: this.results.todoComments.length,
      missingDocsCount: this.results.missingDocs.length,
      outdatedPercentage: this.results.totalFiles > 0 ? 
        Math.round((this.results.outdatedFiles.length / this.results.totalFiles) * 100) : 0
    };
  }

  generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    const { metrics } = this.results;
    
    if (metrics.outdatedPercentage > 30) {
      this.results.recommendations.push({
        priority: 'High',
        category: 'Maintenance',
        recommendation: 'More than 30% of documentation is outdated. Schedule immediate review and updates.'
      });
    }
    
    if (metrics.todoCommentsCount > 10) {
      this.results.recommendations.push({
        priority: 'Medium',
        category: 'Cleanup',
        recommendation: `${metrics.todoCommentsCount} TODO comments found. Plan cleanup sprint to address these items.`
      });
    }
    
    if (metrics.missingDocsCount > 5) {
      this.results.recommendations.push({
        priority: 'Medium',
        category: 'Coverage',
        recommendation: `${metrics.missingDocsCount} missing documentation items identified. Prioritize creating these docs.`
      });
    }
    
    if (metrics.totalDocumentationFiles < 10) {
      this.results.recommendations.push({
        priority: 'Low',
        category: 'Coverage',
        recommendation: 'Consider expanding documentation coverage for better developer experience.'
      });
    }
  }

  formatReport() {
    const date = new Date().toISOString().split('T')[0];
    
    let report = `# Documentation Review Report\n\n`;
    report += `**Generated on:** ${date}\n\n`;
    
    // Executive Summary
    report += `## Executive Summary\n\n`;
    report += `- **Total Documentation Files:** ${this.results.metrics.totalDocumentationFiles}\n`;
    report += `- **Outdated Files:** ${this.results.metrics.outdatedFilesCount} (${this.results.metrics.outdatedPercentage}%)\n`;
    report += `- **TODO Comments:** ${this.results.metrics.todoCommentsCount}\n`;
    report += `- **Missing Documentation:** ${this.results.metrics.missingDocsCount} items\n\n`;
    
    // Recommendations
    if (this.results.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      this.results.recommendations.forEach(rec => {
        report += `### ${rec.priority} Priority - ${rec.category}\n`;
        report += `${rec.recommendation}\n\n`;
      });
    }
    
    // Outdated Files
    if (this.results.outdatedFiles.length > 0) {
      report += `## Outdated Files (>90 days)\n\n`;
      this.results.outdatedFiles
        .sort((a, b) => b.daysOld - a.daysOld)
        .slice(0, 20) // Show top 20
        .forEach(file => {
          report += `- **${file.file}** - ${file.daysOld} days old (${file.lastModified})\n`;
        });
      
      if (this.results.outdatedFiles.length > 20) {
        report += `\n*... and ${this.results.outdatedFiles.length - 20} more files*\n`;
      }
      report += `\n`;
    }
    
    // TODO Comments
    if (this.results.todoComments.length > 0) {
      report += `## TODO Comments\n\n`;
      this.results.todoComments
        .slice(0, 15) // Show top 15
        .forEach(todo => {
          report += `- **${todo.file}:${todo.line}** - ${todo.comment}\n`;
        });
      
      if (this.results.todoComments.length > 15) {
        report += `\n*... and ${this.results.todoComments.length - 15} more TODOs*\n`;
      }
      report += `\n`;
    }
    
    // Missing Documentation
    if (this.results.missingDocs.length > 0) {
      report += `## Missing Documentation\n\n`;
      this.results.missingDocs.forEach(doc => {
        report += `- ${doc}\n`;
      });
      report += `\n`;
    }
    
    // Next Steps
    report += `## Next Steps\n\n`;
    report += `1. Review and address high-priority recommendations\n`;
    report += `2. Update outdated documentation files\n`;
    report += `3. Resolve or document TODO comments\n`;
    report += `4. Create missing documentation\n`;
    report += `5. Schedule next review in 30 days\n\n`;
    
    report += `---\n`;
    report += `*This report was generated automatically. For questions, see the documentation maintenance guide.*\n`;
    
    return report;
  }

  getMarkdownFiles(dir) {
    const files = [];
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && item.endsWith('.md')) {
          files.push(fullPath);
        }
      });
    };
    
    scan(dir);
    return files;
  }

  getJSFiles(dir) {
    const files = [];
    
    const scan = (currentDir) => {
      try {
        const items = fs.readdirSync(currentDir);
        
        items.forEach(item => {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scan(fullPath);
          } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        });
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    scan(dir);
    return files;
  }
}

// CLI interface
if (require.main === module) {
  const outputPath = process.argv[2] || 'documentation-review-report.md';
  
  const reviewer = new DocumentationReviewer();
  reviewer.generateReport(outputPath).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Documentation review error:', error);
    process.exit(1);
  });
}

module.exports = DocumentationReviewer;