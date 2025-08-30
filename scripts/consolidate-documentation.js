#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Script to consolidate duplicated documentation between /docs and /tododoc
 * This script identifies duplicates, compares content, and consolidates them
 */

class DocumentationConsolidator {
  constructor() {
    this.docsPath = './docs';
    this.tododocPath = './tododoc';
    this.duplicates = [];
    this.consolidationReport = [];
  }

  // Calculate file hash for content comparison
  calculateFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return null;
    }
  }

  // Get file stats including size and modification time
  getFileStats(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
        exists: true
      };
    } catch (error) {
      return { exists: false };
    }
  }

  // Find all files recursively in a directory
  findAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.findAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }

  // Identify duplicate files between docs and tododoc
  identifyDuplicates() {
    console.log('🔍 Identifying duplicate files...');
    
    const docsFiles = this.findAllFiles(this.docsPath);
    const tododocFiles = this.findAllFiles(this.tododocPath);
    
    // Create a map of relative paths to compare
    const docsMap = new Map();
    const tododocMap = new Map();
    
    docsFiles.forEach(file => {
      const relativePath = path.relative(this.docsPath, file);
      docsMap.set(relativePath, file);
    });
    
    tododocFiles.forEach(file => {
      const relativePath = path.relative(this.tododocPath, file);
      tododocMap.set(relativePath, file);
    });
    
    // Find files that exist in both directories
    for (const [relativePath, docsFile] of docsMap) {
      if (tododocMap.has(relativePath)) {
        const tododocFile = tododocMap.get(relativePath);
        
        const docsHash = this.calculateFileHash(docsFile);
        const tododocHash = this.calculateFileHash(tododocFile);
        const docsStats = this.getFileStats(docsFile);
        const tododocStats = this.getFileStats(tododocFile);
        
        this.duplicates.push({
          relativePath,
          docsFile,
          tododocFile,
          docsHash,
          tododocHash,
          identical: docsHash === tododocHash,
          docsStats,
          tododocStats,
          newerFile: docsStats.mtime > tododocStats.mtime ? 'docs' : 'tododoc'
        });
      }
    }
    
    console.log(`📊 Found ${this.duplicates.length} duplicate files`);
    return this.duplicates;
  }

  // Analyze content differences for non-identical duplicates
  analyzeContentDifferences(duplicate) {
    if (duplicate.identical) {
      return { type: 'identical', action: 'remove_tododoc' };
    }
    
    try {
      const docsContent = fs.readFileSync(duplicate.docsFile, 'utf8');
      const tododocContent = fs.readFileSync(duplicate.tododocFile, 'utf8');
      
      // Simple heuristics to determine which version is better
      const docsLines = docsContent.split('\n').length;
      const tododocLines = tododocContent.split('\n').length;
      
      // Check for common indicators of more complete documentation
      const docsHasMoreContent = docsLines > tododocLines;
      const docsHasRecentUpdates = docsContent.includes('2024') || docsContent.includes('2025');
      const tododocHasRecentUpdates = tododocContent.includes('2024') || tododocContent.includes('2025');
      
      let recommendation;
      if (docsHasMoreContent && docsHasRecentUpdates) {
        recommendation = 'keep_docs';
      } else if (tododocHasRecentUpdates && !docsHasRecentUpdates) {
        recommendation = 'merge_tododoc_to_docs';
      } else if (duplicate.newerFile === 'docs') {
        recommendation = 'keep_docs';
      } else {
        recommendation = 'manual_review';
      }
      
      return {
        type: 'different',
        action: recommendation,
        docsLines,
        tododocLines,
        sizeDiff: duplicate.docsStats.size - duplicate.tododocStats.size
      };
    } catch (error) {
      console.error(`Error analyzing ${duplicate.relativePath}:`, error.message);
      return { type: 'error', action: 'manual_review' };
    }
  }

  // Generate consolidation plan
  generateConsolidationPlan() {
    console.log('📋 Generating consolidation plan...');
    
    const plan = {
      identical: [],
      keepDocs: [],
      mergeTododocToDocs: [],
      manualReview: [],
      summary: {}
    };
    
    this.duplicates.forEach(duplicate => {
      const analysis = this.analyzeContentDifferences(duplicate);
      
      const item = {
        ...duplicate,
        analysis
      };
      
      switch (analysis.action) {
        case 'remove_tododoc':
          plan.identical.push(item);
          break;
        case 'keep_docs':
          plan.keepDocs.push(item);
          break;
        case 'merge_tododoc_to_docs':
          plan.mergeTododocToDocs.push(item);
          break;
        default:
          plan.manualReview.push(item);
      }
    });
    
    plan.summary = {
      total: this.duplicates.length,
      identical: plan.identical.length,
      keepDocs: plan.keepDocs.length,
      mergeTododocToDocs: plan.mergeTododocToDocs.length,
      manualReview: plan.manualReview.length
    };
    
    return plan;
  }

  // Execute the consolidation plan
  executeConsolidation(plan, dryRun = true) {
    console.log(`${dryRun ? '🧪 DRY RUN:' : '🚀 EXECUTING:'} Consolidation plan...`);
    
    const results = {
      processed: 0,
      errors: [],
      actions: []
    };
    
    // Process identical files - remove from tododoc
    plan.identical.forEach(item => {
      try {
        const action = `Remove identical file: ${item.tododocFile}`;
        console.log(`✅ ${action}`);
        
        if (!dryRun) {
          fs.unlinkSync(item.tododocFile);
        }
        
        results.actions.push(action);
        results.processed++;
      } catch (error) {
        const errorMsg = `Error removing ${item.tododocFile}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    });
    
    // Process files where docs version should be kept
    plan.keepDocs.forEach(item => {
      try {
        const action = `Keep docs version, remove tododoc: ${item.relativePath}`;
        console.log(`✅ ${action}`);
        
        if (!dryRun) {
          fs.unlinkSync(item.tododocFile);
        }
        
        results.actions.push(action);
        results.processed++;
      } catch (error) {
        const errorMsg = `Error processing ${item.relativePath}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    });
    
    return results;
  }

  // Generate a detailed report
  generateReport(plan, results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: plan.summary,
      duplicatesFound: this.duplicates,
      consolidationPlan: plan,
      executionResults: results,
      recommendations: []
    };
    
    // Add recommendations for manual review items
    plan.manualReview.forEach(item => {
      report.recommendations.push({
        file: item.relativePath,
        reason: 'Manual review required',
        docsFile: item.docsFile,
        tododocFile: item.tododocFile,
        suggestion: 'Compare content manually and merge the best parts'
      });
    });
    
    // Add recommendations for merge items
    plan.mergeTododocToDocs.forEach(item => {
      report.recommendations.push({
        file: item.relativePath,
        reason: 'Tododoc version appears more recent',
        docsFile: item.docsFile,
        tododocFile: item.tododocFile,
        suggestion: 'Review tododoc content and merge relevant updates to docs version'
      });
    });
    
    return report;
  }

  // Main execution method
  async run(dryRun = true) {
    console.log('🚀 Starting documentation consolidation...');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
    
    try {
      // Step 1: Identify duplicates
      this.identifyDuplicates();
      
      // Step 2: Generate consolidation plan
      const plan = this.generateConsolidationPlan();
      
      // Step 3: Execute consolidation
      const results = this.executeConsolidation(plan, dryRun);
      
      // Step 4: Generate report
      const report = this.generateReport(plan, results);
      
      // Save report
      const reportPath = './documentation-consolidation-report.json';
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n📊 CONSOLIDATION SUMMARY:');
      console.log(`Total duplicates found: ${plan.summary.total}`);
      console.log(`Identical files: ${plan.summary.identical}`);
      console.log(`Keep docs version: ${plan.summary.keepDocs}`);
      console.log(`Merge from tododoc: ${plan.summary.mergeTododocToDocs}`);
      console.log(`Manual review needed: ${plan.summary.manualReview}`);
      console.log(`\n📄 Report saved to: ${reportPath}`);
      
      if (plan.summary.manualReview > 0) {
        console.log('\n⚠️  MANUAL REVIEW REQUIRED:');
        plan.manualReview.forEach(item => {
          console.log(`  - ${item.relativePath}`);
        });
      }
      
      return report;
      
    } catch (error) {
      console.error('❌ Error during consolidation:', error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const consolidator = new DocumentationConsolidator();
  const dryRun = !process.argv.includes('--execute');
  
  consolidator.run(dryRun)
    .then(report => {
      console.log('\n✅ Documentation consolidation completed successfully!');
      if (dryRun) {
        console.log('\n💡 To execute the changes, run: node scripts/consolidate-documentation.js --execute');
      }
    })
    .catch(error => {
      console.error('\n❌ Documentation consolidation failed:', error);
      process.exit(1);
    });
}

module.exports = DocumentationConsolidator;