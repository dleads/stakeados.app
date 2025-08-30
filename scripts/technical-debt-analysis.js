#!/usr/bin/env node

/**
 * Technical Debt Analysis Script
 * Analyzes and categorizes technical debt in the Stakeados project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TechnicalDebtAnalyzer {
  constructor() {
    this.technicalDebt = {
      typescript: {
        errors: [],
        suppressions: [],
        totalCount: 0
      },
      duplicateFiles: [],
      legacyFiles: [],
      temporaryConfigurations: [],
      backupFiles: [],
      summary: {
        totalItems: 0,
        criticalItems: 0,
        highPriorityItems: 0,
        mediumPriorityItems: 0,
        lowPriorityItems: 0
      }
    };
  }

  /**
   * Analyze TypeScript errors from the type check output
   */
  analyzeTypeScriptErrors() {
    console.log('🔍 Analyzing TypeScript errors...');
    
    // First try to read from TYPE_CHECK_STATUS.md if it exists
    try {
      const statusFile = fs.readFileSync('TYPE_CHECK_STATUS.md', 'utf8');
      const errorCountMatch = statusFile.match(/Total de errores.*?(\d+)/i) || statusFile.match(/errores.*?(\d+)/i);
      
      if (errorCountMatch) {
        const errorCount = parseInt(errorCountMatch[1]);
        console.log(`📊 Found ${errorCount} TypeScript errors documented in TYPE_CHECK_STATUS.md`);
        
        // Create summary entries based on documented information
        this.createTypeScriptErrorSummary(errorCount, statusFile);
        return;
      }
    } catch (error) {
      // File doesn't exist or can't be read
    }
    
    try {
      // Run type check and capture output
      const result = execSync('npm run type-check:prod', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      // If no errors, result will be empty or contain success message
      console.log('✅ No TypeScript errors found');
    } catch (error) {
      // Type check failed, parse the error output
      const output = error.stdout || error.stderr || error.message || '';
      console.log('📝 Parsing TypeScript errors from output...');
      this.parseTypeScriptErrors(output);
    }
  }

  /**
   * Create TypeScript error summary from documented information
   */
  createTypeScriptErrorSummary(errorCount, statusContent) {
    // Parse categories from the status document
    const categories = {
      'supabase-types': { count: 0, severity: 'high' },
      'web3-integration': { count: 0, severity: 'high' },
      'type-never': { count: 0, severity: 'critical' },
      'function-overload': { count: 0, severity: 'medium' },
      'missing-property': { count: 0, severity: 'medium' },
      'general': { count: 0, severity: 'low' }
    };

    // Estimate distribution based on documented patterns
    if (statusContent.includes('supabase') || statusContent.includes('from(')) {
      categories['supabase-types'].count = Math.floor(errorCount * 0.4); // 40% supabase issues
    }
    if (statusContent.includes('web3') || statusContent.includes('viem')) {
      categories['web3-integration'].count = Math.floor(errorCount * 0.2); // 20% web3 issues
    }
    if (statusContent.includes('never')) {
      categories['type-never'].count = Math.floor(errorCount * 0.15); // 15% never type issues
    }
    if (statusContent.includes('overload')) {
      categories['function-overload'].count = Math.floor(errorCount * 0.15); // 15% overload issues
    }
    
    // Remaining errors
    const remaining = errorCount - Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);
    categories['general'].count = remaining;

    // Create error entries
    let errorId = 1;
    for (const [category, info] of Object.entries(categories)) {
      for (let i = 0; i < info.count; i++) {
        this.technicalDebt.typescript.errors.push({
          id: `ts-${errorId++}`,
          type: 'typescript-error',
          severity: info.severity,
          file: 'Multiple files',
          line: 0,
          column: 0,
          errorCode: 'Various',
          message: `${category} related error`,
          category: category,
          estimatedEffort: this.estimateEffort('TS0000', `${category} error`),
          dependencies: [],
          status: 'identified'
        });
      }
    }

    this.technicalDebt.typescript.totalCount = errorCount;
  }

  /**
   * Parse TypeScript error output
   */
  parseTypeScriptErrors(output) {
    const lines = output.split('\n');
    let currentError = null;
    let errorCount = 0;

    for (const line of lines) {
      // Match error pattern: src/path/file.ts:line:col - error TSxxxx: message
      const errorMatch = line.match(/^(.+\.tsx?):(\d+):(\d+) - error (TS\d+): (.+)$/);
      
      if (errorMatch) {
        if (currentError) {
          this.technicalDebt.typescript.errors.push(currentError);
          errorCount++;
        }

        const [, filePath, lineNum, colNum, errorCode, message] = errorMatch;
        
        currentError = {
          id: `ts-${errorCount + 1}`,
          type: 'typescript-error',
          severity: this.categorizeTypeScriptError(errorCode, message),
          file: filePath,
          line: parseInt(lineNum),
          column: parseInt(colNum),
          errorCode,
          message: message.trim(),
          category: this.categorizeErrorType(errorCode, message),
          estimatedEffort: this.estimateEffort(errorCode, message),
          dependencies: [],
          status: 'identified'
        };
      } else if (currentError && line.trim() && !line.includes('Found ') && !line.includes('Errors  Files')) {
        // Additional context for the current error
        if (!currentError.context) currentError.context = [];
        currentError.context.push(line.trim());
      }
    }

    if (currentError) {
      this.technicalDebt.typescript.errors.push(currentError);
      errorCount++;
    }

    this.technicalDebt.typescript.totalCount = errorCount;
    console.log(`📊 Found ${errorCount} TypeScript errors`);
  }

  /**
   * Categorize TypeScript error severity
   */
  categorizeTypeScriptError(errorCode, message) {
    // Critical errors that break functionality
    const criticalPatterns = [
      /Type instantiation is excessively deep/,
      /Cannot find module/,
      /Property .* does not exist on type 'never'/,
      /Argument of type .* is not assignable to parameter of type 'never'/
    ];

    // High priority errors
    const highPatterns = [
      /No overload matches this call/,
      /Property .* is missing in type/,
      /Type .* is not assignable to type/
    ];

    // Medium priority errors
    const mediumPatterns = [
      /Property .* does not exist on type/,
      /Argument of type .* is not assignable/
    ];

    for (const pattern of criticalPatterns) {
      if (pattern.test(message)) return 'critical';
    }

    for (const pattern of highPatterns) {
      if (pattern.test(message)) return 'high';
    }

    for (const pattern of mediumPatterns) {
      if (pattern.test(message)) return 'medium';
    }

    return 'low';
  }

  /**
   * Categorize error type for better organization
   */
  categorizeErrorType(errorCode, message) {
    if (message.includes('supabase') || message.includes('from(')) {
      return 'supabase-types';
    }
    if (message.includes('web3') || message.includes('viem') || message.includes('wagmi')) {
      return 'web3-integration';
    }
    if (message.includes('never')) {
      return 'type-never';
    }
    if (message.includes('overload')) {
      return 'function-overload';
    }
    if (message.includes('missing') && message.includes('property')) {
      return 'missing-property';
    }
    return 'general';
  }

  /**
   * Estimate effort to fix error (in hours)
   */
  estimateEffort(errorCode, message) {
    const severity = this.categorizeTypeScriptError(errorCode, message);
    
    switch (severity) {
      case 'critical': return 8; // 1 day
      case 'high': return 4; // Half day
      case 'medium': return 2; // 2 hours
      case 'low': return 1; // 1 hour
      default: return 1;
    }
  }

  /**
   * Find files with TypeScript suppressions
   */
  findTypeScriptSuppressions() {
    console.log('🔍 Finding TypeScript suppressions...');
    
    const suppressionPatterns = [
      '// @ts-nocheck',
      '// @ts-ignore',
      '// @ts-expect-error'
    ];

    // Manually search for suppressions in TypeScript files
    const tsFiles = this.getAllFiles('src').filter(file => 
      file.endsWith('.ts') || file.endsWith('.tsx')
    );

    for (const file of tsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          for (const pattern of suppressionPatterns) {
            if (line.includes(pattern)) {
              this.technicalDebt.typescript.suppressions.push({
                id: `suppression-${this.technicalDebt.typescript.suppressions.length + 1}`,
                type: 'typescript-suppression',
                severity: 'medium',
                file: file,
                line: i + 1,
                suppression: pattern,
                content: line.trim(),
                estimatedEffort: 2,
                status: 'identified'
              });
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    console.log(`📊 Found ${this.technicalDebt.typescript.suppressions.length} TypeScript suppressions`);
  }

  /**
   * Find duplicate files
   */
  findDuplicateFiles() {
    console.log('🔍 Finding duplicate files...');
    
    const duplicatePatterns = [
      { pattern: /\.backup$/, category: 'backup-extension' },
      { pattern: /_backup/, category: 'backup-suffix' },
      { pattern: /backup/, category: 'backup-name' },
      { pattern: /\.bak$/, category: 'bak-extension' },
      { pattern: /_old/, category: 'old-suffix' },
      { pattern: /_copy/, category: 'copy-suffix' },
      { pattern: / - copia/, category: 'spanish-copy' },
      { pattern: /2\./, category: 'version-number' }
    ];

    const allFiles = this.getAllFiles('.');
    
    for (const file of allFiles) {
      for (const { pattern, category } of duplicatePatterns) {
        if (pattern.test(file)) {
          this.technicalDebt.duplicateFiles.push({
            id: `duplicate-${this.technicalDebt.duplicateFiles.length + 1}`,
            type: 'duplicate-file',
            severity: 'low',
            file: file,
            category: category,
            estimatedEffort: 0.5,
            status: 'identified',
            remediationPlan: 'Review and remove or move to archive'
          });
          break;
        }
      }
    }

    console.log(`📊 Found ${this.technicalDebt.duplicateFiles.length} duplicate/backup files`);
  }

  /**
   * Find legacy and temporary files
   */
  findLegacyFiles() {
    console.log('🔍 Finding legacy and temporary files...');
    
    const legacyPatterns = [
      { pattern: /tododoc/, category: 'legacy-docs' },
      { pattern: /migrations_backup/, category: 'migration-backup' },
      { pattern: /migrations_disabled/, category: 'disabled-migration' },
      { pattern: /\.temp/, category: 'temp-directory' },
      { pattern: /debug-/, category: 'debug-file' },
      { pattern: /test-/, category: 'test-file' },
      { pattern: /verify-/, category: 'verification-file' },
      { pattern: /fix-/, category: 'fix-script' },
      { pattern: /reset-/, category: 'reset-script' },
      { pattern: /force-/, category: 'force-script' }
    ];

    const allFiles = this.getAllFiles('.');
    
    for (const file of allFiles) {
      for (const { pattern, category } of legacyPatterns) {
        if (pattern.test(file)) {
          this.technicalDebt.legacyFiles.push({
            id: `legacy-${this.technicalDebt.legacyFiles.length + 1}`,
            type: 'legacy-file',
            severity: this.categorizeLegacySeverity(category),
            file: file,
            category: category,
            estimatedEffort: this.estimateLegacyEffort(category),
            status: 'identified',
            remediationPlan: this.getLegacyRemediationPlan(category)
          });
          break;
        }
      }
    }

    console.log(`📊 Found ${this.technicalDebt.legacyFiles.length} legacy/temporary files`);
  }

  /**
   * Categorize legacy file severity
   */
  categorizeLegacySeverity(category) {
    const highPriority = ['debug-file', 'test-file', 'temp-directory'];
    const mediumPriority = ['legacy-docs', 'migration-backup'];
    
    if (highPriority.includes(category)) return 'high';
    if (mediumPriority.includes(category)) return 'medium';
    return 'low';
  }

  /**
   * Estimate effort for legacy file cleanup
   */
  estimateLegacyEffort(category) {
    const effortMap = {
      'legacy-docs': 4,
      'migration-backup': 2,
      'disabled-migration': 1,
      'temp-directory': 0.5,
      'debug-file': 1,
      'test-file': 2,
      'verification-file': 1,
      'fix-script': 2,
      'reset-script': 1,
      'force-script': 1
    };
    
    return effortMap[category] || 1;
  }

  /**
   * Get remediation plan for legacy files
   */
  getLegacyRemediationPlan(category) {
    const planMap = {
      'legacy-docs': 'Review content, consolidate useful information, archive rest',
      'migration-backup': 'Verify current migrations work, then archive backups',
      'disabled-migration': 'Review if needed, remove if obsolete',
      'temp-directory': 'Clean up temporary files',
      'debug-file': 'Review if still needed for debugging, remove if obsolete',
      'test-file': 'Convert to proper tests or remove',
      'verification-file': 'Review if verification is still needed',
      'fix-script': 'Review if fix is still needed, integrate or remove',
      'reset-script': 'Review if reset functionality is needed',
      'force-script': 'Review necessity, document or remove'
    };
    
    return planMap[category] || 'Review and determine if file is still needed';
  }

  /**
   * Get all files recursively
   */
  getAllFiles(dir, fileList = []) {
    const excludedDirs = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.vscode',
      '.husky'
    ];
    
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        
        // Skip excluded directories
        if (excludedDirs.includes(file)) {
          continue;
        }
        
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Include .kiro but skip other hidden directories
          if (!file.startsWith('.') || file === '.kiro') {
            this.getAllFiles(filePath, fileList);
          }
        } else {
          fileList.push(filePath.replace(/\\/g, '/'));
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return fileList;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary() {
    const allItems = [
      ...this.technicalDebt.typescript.errors,
      ...this.technicalDebt.typescript.suppressions,
      ...this.technicalDebt.duplicateFiles,
      ...this.technicalDebt.legacyFiles
    ];

    this.technicalDebt.summary.totalItems = allItems.length;
    this.technicalDebt.summary.criticalItems = allItems.filter(item => item.severity === 'critical').length;
    this.technicalDebt.summary.highPriorityItems = allItems.filter(item => item.severity === 'high').length;
    this.technicalDebt.summary.mediumPriorityItems = allItems.filter(item => item.severity === 'medium').length;
    this.technicalDebt.summary.lowPriorityItems = allItems.filter(item => item.severity === 'low').length;
  }

  /**
   * Generate technical debt report
   */
  generateReport() {
    console.log('📝 Generating technical debt report...');
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: this.technicalDebt.summary,
      categories: {
        typescript: {
          totalErrors: this.technicalDebt.typescript.totalCount,
          errors: this.technicalDebt.typescript.errors,
          suppressions: this.technicalDebt.typescript.suppressions
        },
        duplicateFiles: this.technicalDebt.duplicateFiles,
        legacyFiles: this.technicalDebt.legacyFiles
      },
      prioritizedTasks: this.generatePrioritizedTasks(),
      estimatedEffort: this.calculateTotalEffort()
    };

    // Save JSON report
    fs.writeFileSync('technical-debt-report.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('✅ Technical debt analysis complete!');
    console.log(`📊 Total items: ${report.summary.totalItems}`);
    console.log(`🔴 Critical: ${report.summary.criticalItems}`);
    console.log(`🟡 High: ${report.summary.highPriorityItems}`);
    console.log(`🟠 Medium: ${report.summary.mediumPriorityItems}`);
    console.log(`🟢 Low: ${report.summary.lowPriorityItems}`);
    console.log(`⏱️ Estimated effort: ${report.estimatedEffort} hours`);
  }

  /**
   * Generate prioritized task list
   */
  generatePrioritizedTasks() {
    const allItems = [
      ...this.technicalDebt.typescript.errors,
      ...this.technicalDebt.typescript.suppressions,
      ...this.technicalDebt.duplicateFiles,
      ...this.technicalDebt.legacyFiles
    ];

    // Sort by severity (critical > high > medium > low) then by estimated effort
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return allItems.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.estimatedEffort - b.estimatedEffort;
    });
  }

  /**
   * Calculate total estimated effort
   */
  calculateTotalEffort() {
    const allItems = [
      ...this.technicalDebt.typescript.errors,
      ...this.technicalDebt.typescript.suppressions,
      ...this.technicalDebt.duplicateFiles,
      ...this.technicalDebt.legacyFiles
    ];

    return allItems.reduce((total, item) => total + (item.estimatedEffort || 0), 0);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    const markdown = `# Technical Debt Analysis Report

Generated: ${new Date(report.generatedAt).toLocaleString()}

## Summary

| Category | Count | Percentage |
|----------|-------|------------|
| **Total Items** | ${report.summary.totalItems} | 100% |
| 🔴 Critical | ${report.summary.criticalItems} | ${((report.summary.criticalItems / report.summary.totalItems) * 100).toFixed(1)}% |
| 🟡 High Priority | ${report.summary.highPriorityItems} | ${((report.summary.highPriorityItems / report.summary.totalItems) * 100).toFixed(1)}% |
| 🟠 Medium Priority | ${report.summary.mediumPriorityItems} | ${((report.summary.mediumPriorityItems / report.summary.totalItems) * 100).toFixed(1)}% |
| 🟢 Low Priority | ${report.summary.lowPriorityItems} | ${((report.summary.lowPriorityItems / report.summary.totalItems) * 100).toFixed(1)}% |

**Estimated Total Effort:** ${report.estimatedEffort} hours (${(report.estimatedEffort / 8).toFixed(1)} days)

## TypeScript Issues

### Errors by Category

${this.generateTypeScriptCategoryBreakdown(report.categories.typescript.errors)}

### Critical TypeScript Errors (Top 10)

${this.generateTopErrors(report.categories.typescript.errors.filter(e => e.severity === 'critical').slice(0, 10))}

### TypeScript Suppressions

Found ${report.categories.typescript.suppressions.length} files with TypeScript suppressions that need review:

${report.categories.typescript.suppressions.map(s => `- \`${s.file}:${s.line}\` - ${s.suppression}`).join('\n')}

## File Organization Issues

### Duplicate/Backup Files

${report.categories.duplicateFiles.map(f => `- \`${f.file}\` (${f.category})`).join('\n')}

### Legacy Files

${report.categories.legacyFiles.map(f => `- \`${f.file}\` (${f.category}) - ${f.remediationPlan}`).join('\n')}

## Prioritized Action Plan

### Phase 1: Critical Issues (${report.prioritizedTasks.filter(t => t.severity === 'critical').length} items)

${report.prioritizedTasks.filter(t => t.severity === 'critical').slice(0, 5).map((task, i) => 
  `${i + 1}. **${task.type}** - \`${task.file}\`${task.line ? `:${task.line}` : ''}\n   - ${task.message || task.remediationPlan || 'Review and fix'}\n   - Effort: ${task.estimatedEffort}h`
).join('\n\n')}

### Phase 2: High Priority Issues (${report.prioritizedTasks.filter(t => t.severity === 'high').length} items)

${report.prioritizedTasks.filter(t => t.severity === 'high').slice(0, 5).map((task, i) => 
  `${i + 1}. **${task.type}** - \`${task.file}\`${task.line ? `:${task.line}` : ''}\n   - ${task.message || task.remediationPlan || 'Review and fix'}\n   - Effort: ${task.estimatedEffort}h`
).join('\n\n')}

## Recommendations

### Immediate Actions (Next Sprint)
1. Fix critical TypeScript errors that break functionality
2. Remove obvious duplicate and backup files
3. Update TypeScript configuration to be more permissive temporarily

### Short-term Actions (Next Month)
1. Systematically fix high-priority TypeScript errors
2. Remove TypeScript suppressions by fixing underlying issues
3. Organize legacy files into proper archive structure

### Long-term Actions (Next Quarter)
1. Implement stricter TypeScript configuration gradually
2. Establish code quality gates to prevent new technical debt
3. Create automated tools to detect and prevent technical debt accumulation

---

*This report was generated automatically by the Technical Debt Analyzer*
`;

    fs.writeFileSync('technical-debt-report.md', markdown);
  }

  /**
   * Generate TypeScript category breakdown
   */
  generateTypeScriptCategoryBreakdown(errors) {
    const categories = {};
    
    for (const error of errors) {
      if (!categories[error.category]) {
        categories[error.category] = { count: 0, critical: 0, high: 0, medium: 0, low: 0 };
      }
      categories[error.category].count++;
      categories[error.category][error.severity]++;
    }

    let breakdown = '| Category | Total | Critical | High | Medium | Low |\n';
    breakdown += '|----------|-------|----------|------|--------|----- |\n';
    
    for (const [category, stats] of Object.entries(categories)) {
      breakdown += `| ${category} | ${stats.count} | ${stats.critical} | ${stats.high} | ${stats.medium} | ${stats.low} |\n`;
    }

    return breakdown;
  }

  /**
   * Generate top errors list
   */
  generateTopErrors(errors) {
    return errors.map((error, i) => 
      `${i + 1}. \`${error.file}:${error.line}\` - ${error.errorCode}\n   - ${error.message}\n   - Effort: ${error.estimatedEffort}h`
    ).join('\n\n');
  }

  /**
   * Run complete analysis
   */
  async run() {
    console.log('🚀 Starting Technical Debt Analysis...\n');
    
    this.analyzeTypeScriptErrors();
    this.findTypeScriptSuppressions();
    this.findDuplicateFiles();
    this.findLegacyFiles();
    this.calculateSummary();
    this.generateReport();
    
    console.log('\n✅ Analysis complete! Check technical-debt-report.md and technical-debt-report.json');
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new TechnicalDebtAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = TechnicalDebtAnalyzer;