#!/usr/bin/env node

/**
 * Documentation Quality Metrics System
 * Analyzes documentation coverage, quality, and maintenance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentationMetrics {
  constructor() {
    this.metrics = {
      coverage: {
        totalFiles: 0,
        documentedFiles: 0,
        coveragePercentage: 0,
        undocumentedFiles: []
      },
      quality: {
        brokenLinks: 0,
        outdatedDocs: 0,
        missingExamples: 0,
        qualityScore: 0
      },
      maintenance: {
        lastUpdated: new Date().toISOString(),
        staleDocs: [],
        recentUpdates: []
      },
      onboarding: {
        averageTime: 0,
        completionRate: 0,
        feedbackScore: 0
      }
    };
    
    this.sourceDirectories = ['src', 'components', 'lib', 'pages', 'app'];
    this.docDirectories = ['docs', '.kiro/specs'];
    this.excludePatterns = [
      'node_modules',
      '.next',
      '.git',
      'dist',
      'build',
      '__tests__',
      '.test.',
      '.spec.'
    ];
  }

  /**
   * Calculate documentation coverage metrics
   */
  calculateCoverage() {
    console.log('📊 Calculating documentation coverage...');
    
    const sourceFiles = this.getSourceFiles();
    const documentedFiles = this.getDocumentedFiles();
    
    this.metrics.coverage.totalFiles = sourceFiles.length;
    this.metrics.coverage.documentedFiles = documentedFiles.length;
    this.metrics.coverage.coveragePercentage = 
      (documentedFiles.length / sourceFiles.length * 100).toFixed(2);
    
    // Find undocumented files
    this.metrics.coverage.undocumentedFiles = sourceFiles.filter(file => {
      const baseName = path.basename(file, path.extname(file));
      return !documentedFiles.some(doc => 
        doc.includes(baseName) || doc.includes(file.replace('src/', ''))
      );
    });

    return this.metrics.coverage;
  }

  /**
   * Analyze documentation quality
   */
  analyzeQuality() {
    console.log('🔍 Analyzing documentation quality...');
    
    const docFiles = this.getAllDocFiles();
    let brokenLinks = 0;
    let missingExamples = 0;
    let outdatedDocs = 0;

    docFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for broken internal links
      const links = content.match(/\[.*?\]\(.*?\)/g) || [];
      links.forEach(link => {
        const url = link.match(/\((.*?)\)/)?.[1];
        if (url && url.startsWith('./') || url.startsWith('../')) {
          const linkPath = path.resolve(path.dirname(file), url);
          if (!fs.existsSync(linkPath)) {
            brokenLinks++;
          }
        }
      });

      // Check for missing code examples in API docs
      if (file.includes('api') || file.includes('API')) {
        const hasExamples = content.includes('```') || content.includes('example');
        if (!hasExamples) {
          missingExamples++;
        }
      }

      // Check for outdated docs (no updates in 90 days)
      const stats = fs.statSync(file);
      const daysSinceUpdate = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 90) {
        outdatedDocs++;
        this.metrics.maintenance.staleDocs.push({
          file: file,
          daysSinceUpdate: Math.floor(daysSinceUpdate)
        });
      }
    });

    this.metrics.quality.brokenLinks = brokenLinks;
    this.metrics.quality.missingExamples = missingExamples;
    this.metrics.quality.outdatedDocs = outdatedDocs;
    
    // Calculate quality score (0-100)
    const totalIssues = brokenLinks + missingExamples + outdatedDocs;
    const maxPossibleIssues = docFiles.length * 3; // 3 potential issues per file
    this.metrics.quality.qualityScore = Math.max(0, 
      ((maxPossibleIssues - totalIssues) / maxPossibleIssues * 100).toFixed(2)
    );

    return this.metrics.quality;
  }

  /**
   * Track maintenance metrics
   */
  trackMaintenance() {
    console.log('🔧 Tracking maintenance metrics...');
    
    const docFiles = this.getAllDocFiles();
    const recentUpdates = [];

    docFiles.forEach(file => {
      const stats = fs.statSync(file);
      const daysSinceUpdate = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate <= 7) {
        recentUpdates.push({
          file: file,
          lastModified: stats.mtime.toISOString(),
          daysSinceUpdate: Math.floor(daysSinceUpdate)
        });
      }
    });

    this.metrics.maintenance.recentUpdates = recentUpdates;
    return this.metrics.maintenance;
  }

  /**
   * Get all source files that should be documented
   */
  getSourceFiles() {
    const files = [];
    
    this.sourceDirectories.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.walkDirectory(dir, files, ['.ts', '.tsx', '.js', '.jsx']);
      }
    });

    return files.filter(file => 
      !this.excludePatterns.some(pattern => file.includes(pattern))
    );
  }

  /**
   * Get all documentation files
   */
  getDocumentedFiles() {
    const files = [];
    
    this.docDirectories.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.walkDirectory(dir, files, ['.md', '.mdx']);
      }
    });

    return files;
  }

  /**
   * Get all documentation files for quality analysis
   */
  getAllDocFiles() {
    return this.getDocumentedFiles();
  }

  /**
   * Recursively walk directory and collect files
   */
  walkDirectory(dir, files, extensions) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && 
          !this.excludePatterns.some(pattern => fullPath.includes(pattern))) {
        this.walkDirectory(fullPath, files, extensions);
      } else if (stat.isFile() && 
                 extensions.some(ext => fullPath.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  }

  /**
   * Generate comprehensive metrics report
   */
  generateReport() {
    console.log('📈 Generating documentation metrics report...');
    
    this.calculateCoverage();
    this.analyzeQuality();
    this.trackMaintenance();

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        coveragePercentage: this.metrics.coverage.coveragePercentage,
        qualityScore: this.metrics.quality.qualityScore,
        totalDocFiles: this.getAllDocFiles().length,
        recentUpdates: this.metrics.maintenance.recentUpdates.length
      },
      detailed: this.metrics,
      recommendations: this.generateRecommendations()
    };

    // Save report
    const reportPath = 'docs/metrics/documentation-quality-report.json';
    this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown summary
    this.generateMarkdownReport(report);

    return report;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.coverage.coveragePercentage < 70) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: `Documentation coverage is ${this.metrics.coverage.coveragePercentage}%. Consider documenting ${this.metrics.coverage.undocumentedFiles.length} undocumented files.`
      });
    }

    if (this.metrics.quality.brokenLinks > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: `Found ${this.metrics.quality.brokenLinks} broken links. Run link checker to identify and fix them.`
      });
    }

    if (this.metrics.maintenance.staleDocs.length > 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        message: `${this.metrics.maintenance.staleDocs.length} documents haven't been updated in 90+ days. Consider reviewing for accuracy.`
      });
    }

    if (this.metrics.quality.qualityScore < 80) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        message: `Documentation quality score is ${this.metrics.quality.qualityScore}%. Focus on fixing broken links, adding examples, and updating stale content.`
      });
    }

    return recommendations;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    const markdown = `# Documentation Quality Report

Generated: ${new Date(report.generatedAt).toLocaleString()}

## Summary

- **Coverage**: ${report.summary.coveragePercentage}%
- **Quality Score**: ${report.summary.qualityScore}%
- **Total Documentation Files**: ${report.summary.totalDocFiles}
- **Recent Updates**: ${report.summary.recentUpdates} files updated in last 7 days

## Coverage Metrics

- **Total Source Files**: ${report.detailed.coverage.totalFiles}
- **Documented Files**: ${report.detailed.coverage.documentedFiles}
- **Coverage Percentage**: ${report.detailed.coverage.coveragePercentage}%

### Undocumented Files (${report.detailed.coverage.undocumentedFiles.length})

${report.detailed.coverage.undocumentedFiles.map(file => `- \`${file}\``).join('\n')}

## Quality Metrics

- **Broken Links**: ${report.detailed.quality.brokenLinks}
- **Missing Examples**: ${report.detailed.quality.missingExamples}
- **Outdated Documents**: ${report.detailed.quality.outdatedDocs}
- **Quality Score**: ${report.detailed.quality.qualityScore}%

## Maintenance Status

### Stale Documents (${report.detailed.maintenance.staleDocs.length})

${report.detailed.maintenance.staleDocs.map(doc => 
  `- \`${doc.file}\` (${doc.daysSinceUpdate} days since update)`
).join('\n')}

### Recent Updates (${report.detailed.maintenance.recentUpdates.length})

${report.detailed.maintenance.recentUpdates.map(doc => 
  `- \`${doc.file}\` (${doc.daysSinceUpdate} days ago)`
).join('\n')}

## Recommendations

${report.recommendations.map(rec => 
  `### ${rec.type.toUpperCase()} - ${rec.priority.toUpperCase()} Priority\n\n${rec.message}`
).join('\n\n')}

## Next Steps

1. Address high-priority recommendations first
2. Set up automated monitoring for documentation quality
3. Establish regular review cycles for stale documentation
4. Implement documentation requirements in development workflow
`;

    const markdownPath = 'docs/metrics/documentation-quality-report.md';
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📄 Markdown report saved to: ${markdownPath}`);
  }

  /**
   * Ensure directory exists
   */
  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// CLI interface
if (require.main === module) {
  const metrics = new DocumentationMetrics();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'coverage':
      console.log(JSON.stringify(metrics.calculateCoverage(), null, 2));
      break;
    case 'quality':
      console.log(JSON.stringify(metrics.analyzeQuality(), null, 2));
      break;
    case 'maintenance':
      console.log(JSON.stringify(metrics.trackMaintenance(), null, 2));
      break;
    case 'report':
    default:
      const report = metrics.generateReport();
      console.log('\n✅ Documentation metrics report generated successfully!');
      console.log(`📊 Coverage: ${report.summary.coveragePercentage}%`);
      console.log(`🎯 Quality Score: ${report.summary.qualityScore}%`);
      console.log(`📁 Total Docs: ${report.summary.totalDocFiles}`);
      console.log(`🔄 Recent Updates: ${report.summary.recentUpdates}`);
      break;
  }
}

module.exports = DocumentationMetrics;