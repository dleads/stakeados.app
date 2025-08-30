#!/usr/bin/env node

/**
 * Complete Project Analysis Runner
 * 
 * Runs all analysis scripts and generates a comprehensive summary report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CompleteProjectAnalyzer {
  constructor() {
    this.results = {
      analysisCompleted: false,
      reports: [],
      summary: {},
      timestamp: new Date().toISOString()
    };
  }

  async runCompleteAnalysis() {
    console.log('🚀 Starting complete project analysis...\n');
    
    try {
      // Run all analysis scripts
      await this.runDocumentationAnalysis();
      await this.runFileCatalog();
      await this.runImplementationComparison();
      
      // Generate master summary
      await this.generateMasterSummary();
      
      console.log('\n✅ Complete project analysis finished successfully!');
      console.log('\n📊 Generated Reports:');
      this.results.reports.forEach(report => {
        console.log(`   - ${report}`);
      });
      console.log(`   - project-analysis-master-summary.md`);
      
    } catch (error) {
      console.error('❌ Error during complete analysis:', error.message);
      process.exit(1);
    }
  }

  async runDocumentationAnalysis() {
    console.log('1️⃣ Running documentation analysis...');
    try {
      execSync('node scripts/project-analysis/analyze-project-documentation.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      this.results.reports.push('project-analysis-report.json');
      this.results.reports.push('project-analysis-report.md');
      console.log('   ✅ Documentation analysis completed\n');
    } catch (error) {
      console.error('   ❌ Documentation analysis failed:', error.message);
      throw error;
    }
  }

  async runFileCatalog() {
    console.log('2️⃣ Running file catalog generation...');
    try {
      execSync('node scripts/project-analysis/catalog-all-files.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      this.results.reports.push('file-catalog.json');
      this.results.reports.push('file-catalog.md');
      console.log('   ✅ File catalog completed\n');
    } catch (error) {
      console.error('   ❌ File catalog failed:', error.message);
      throw error;
    }
  }

  async runImplementationComparison() {
    console.log('3️⃣ Running implementation comparison...');
    try {
      execSync('node scripts/project-analysis/compare-docs-vs-implementation.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      this.results.reports.push('docs-vs-implementation-report.json');
      this.results.reports.push('docs-vs-implementation-report.md');
      console.log('   ✅ Implementation comparison completed\n');
    } catch (error) {
      console.error('   ❌ Implementation comparison failed:', error.message);
      throw error;
    }
  }

  async generateMasterSummary() {
    console.log('4️⃣ Generating master summary...');
    
    // Load all generated reports
    const reports = this.loadAllReports();
    
    // Generate comprehensive summary
    const summary = this.compileSummary(reports);
    
    // Write master summary
    await this.writeMasterSummary(summary);
    
    console.log('   ✅ Master summary generated');
  }

  loadAllReports() {
    const reports = {};
    
    try {
      // Load documentation analysis report
      if (fs.existsSync('project-analysis-report.json')) {
        reports.documentation = JSON.parse(fs.readFileSync('project-analysis-report.json', 'utf8'));
      }
      
      // Load file catalog
      if (fs.existsSync('file-catalog.json')) {
        reports.catalog = JSON.parse(fs.readFileSync('file-catalog.json', 'utf8'));
      }
      
      // Load implementation comparison
      if (fs.existsSync('docs-vs-implementation-report.json')) {
        reports.comparison = JSON.parse(fs.readFileSync('docs-vs-implementation-report.json', 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Warning: Could not load some reports:', error.message);
    }
    
    return reports;
  }

  compileSummary(reports) {
    const summary = {
      projectOverview: this.generateProjectOverview(reports),
      keyFindings: this.generateKeyFindings(reports),
      criticalIssues: this.generateCriticalIssues(reports),
      recommendations: this.generatePriorityRecommendations(reports),
      nextSteps: this.generateNextSteps(reports),
      metrics: this.generateMetrics(reports)
    };
    
    return summary;
  }

  generateProjectOverview(reports) {
    const overview = {
      projectName: 'Stakeados',
      analysisDate: new Date().toLocaleDateString(),
      totalFiles: reports.catalog?.catalog?.summary?.totalFiles || 0,
      totalSize: reports.catalog?.catalog?.summary?.totalSizeHuman || '0 Bytes',
      documentationFiles: reports.documentation?.analysis?.summary?.totalDocumentationFiles || 0,
      specificationFiles: reports.documentation?.analysis?.summary?.totalSpecificationFiles || 0,
      implementedFeatures: reports.comparison?.summary?.totalImplementedFeatures || 0,
      documentedFeatures: reports.comparison?.summary?.totalDocumentedFeatures || 0
    };
    
    return overview;
  }

  generateKeyFindings(reports) {
    const findings = [];
    
    // Documentation findings
    if (reports.documentation) {
      const duplicates = reports.documentation.analysis?.summary?.totalDuplicateSets || 0;
      if (duplicates > 0) {
        findings.push({
          type: 'documentation',
          severity: 'high',
          finding: `Found ${duplicates} sets of duplicate files across documentation directories`,
          impact: 'Maintenance overhead and confusion for developers'
        });
      }
      
      const docsByCategory = reports.documentation.analysis?.summary?.documentationByCategory || {};
      if (docsByCategory.docs && docsByCategory.tododoc) {
        findings.push({
          type: 'organization',
          severity: 'medium',
          finding: 'Documentation is scattered between /docs and /tododoc directories',
          impact: 'Difficult to find and maintain documentation'
        });
      }
    }
    
    // Implementation findings
    if (reports.comparison) {
      const implementedButNotDocumented = reports.comparison.summary?.implementedButNotDocumented || 0;
      if (implementedButNotDocumented > 0) {
        findings.push({
          type: 'documentation-gap',
          severity: 'medium',
          finding: `${implementedButNotDocumented} features are implemented but not documented`,
          impact: 'Knowledge gaps and maintenance difficulties'
        });
      }
      
      const documentedButNotImplemented = reports.comparison.summary?.documentedButNotImplemented || 0;
      if (documentedButNotImplemented > 0) {
        findings.push({
          type: 'implementation-gap',
          severity: 'high',
          finding: `${documentedButNotImplemented} features are documented but not implemented`,
          impact: 'Misleading documentation and unclear project scope'
        });
      }
    }
    
    return findings;
  }

  generateCriticalIssues(reports) {
    const issues = [];
    
    // High priority issues that need immediate attention
    if (reports.documentation?.analysis?.summary?.totalDuplicateSets > 20) {
      issues.push({
        issue: 'Extensive file duplication',
        description: 'More than 20 sets of duplicate files found',
        priority: 'critical',
        estimatedEffort: '2-3 days',
        blocksProgress: true
      });
    }
    
    if (reports.comparison?.summary?.documentedButNotImplemented > 10) {
      issues.push({
        issue: 'Documentation-implementation mismatch',
        description: 'Significant number of documented features not implemented',
        priority: 'high',
        estimatedEffort: '1-2 weeks',
        blocksProgress: true
      });
    }
    
    // Check for missing core documentation
    const hasReadme = reports.catalog?.catalog?.docs?.some(file => 
      file.name.toLowerCase().includes('readme')
    );
    if (!hasReadme) {
      issues.push({
        issue: 'Missing project README',
        description: 'No main README file found in docs directory',
        priority: 'high',
        estimatedEffort: '1 day',
        blocksProgress: false
      });
    }
    
    return issues;
  }

  generatePriorityRecommendations(reports) {
    const recommendations = [];
    
    // Consolidate all recommendations from individual reports
    if (reports.documentation?.recommendations) {
      recommendations.push(...reports.documentation.recommendations.map(rec => ({
        ...rec,
        source: 'documentation-analysis'
      })));
    }
    
    if (reports.comparison?.recommendations) {
      recommendations.push(...reports.comparison.recommendations.map(rec => ({
        ...rec,
        source: 'implementation-comparison'
      })));
    }
    
    // Add master recommendations
    recommendations.push({
      type: 'organization',
      priority: 'high',
      message: 'Implement centralized documentation structure',
      action: 'Create unified /docs structure and archive legacy /tododoc',
      estimatedEffort: '2-3 days',
      source: 'master-analysis'
    });
    
    recommendations.push({
      type: 'maintenance',
      priority: 'medium',
      message: 'Establish documentation maintenance process',
      action: 'Create templates, validation scripts, and update procedures',
      estimatedEffort: '1 week',
      source: 'master-analysis'
    });
    
    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  generateNextSteps(reports) {
    return [
      {
        step: 1,
        title: 'Immediate Cleanup',
        description: 'Remove duplicate files and consolidate documentation',
        timeframe: '1-2 days',
        dependencies: []
      },
      {
        step: 2,
        title: 'Documentation Reorganization',
        description: 'Create centralized docs structure and move files',
        timeframe: '2-3 days',
        dependencies: ['Step 1']
      },
      {
        step: 3,
        title: 'Specification Cleanup',
        description: 'Update specs to reflect actual implementation status',
        timeframe: '3-5 days',
        dependencies: ['Step 2']
      },
      {
        step: 4,
        title: 'Documentation Creation',
        description: 'Create missing documentation for implemented features',
        timeframe: '1 week',
        dependencies: ['Step 3']
      },
      {
        step: 5,
        title: 'Process Implementation',
        description: 'Implement maintenance processes and validation',
        timeframe: '3-5 days',
        dependencies: ['Step 4']
      }
    ];
  }

  generateMetrics(reports) {
    return {
      documentationHealth: {
        totalFiles: reports.catalog?.catalog?.summary?.totalFiles || 0,
        duplicatePercentage: this.calculateDuplicatePercentage(reports),
        organizationScore: this.calculateOrganizationScore(reports),
        completenessScore: this.calculateCompletenessScore(reports)
      },
      implementationAlignment: {
        matchedFeatures: reports.comparison?.summary?.totalMatches || 0,
        documentationGaps: reports.comparison?.summary?.implementedButNotDocumented || 0,
        implementationGaps: reports.comparison?.summary?.documentedButNotImplemented || 0,
        alignmentScore: this.calculateAlignmentScore(reports)
      },
      projectReadiness: {
        onboardingReadiness: this.calculateOnboardingReadiness(reports),
        maintenanceReadiness: this.calculateMaintenanceReadiness(reports),
        collaborationReadiness: this.calculateCollaborationReadiness(reports)
      }
    };
  }

  calculateDuplicatePercentage(reports) {
    const totalFiles = reports.documentation?.analysis?.summary?.totalDocumentationFiles || 0;
    const duplicateFiles = reports.documentation?.analysis?.summary?.totalDuplicateFiles || 0;
    return totalFiles > 0 ? Math.round((duplicateFiles / totalFiles) * 100) : 0;
  }

  calculateOrganizationScore(reports) {
    // Score based on file organization (0-100)
    let score = 100;
    
    // Deduct for duplicates
    const duplicatePercentage = this.calculateDuplicatePercentage(reports);
    score -= duplicatePercentage;
    
    // Deduct for scattered documentation
    const docsByCategory = reports.documentation?.analysis?.summary?.documentationByCategory || {};
    if (docsByCategory.docs && docsByCategory.tododoc) {
      score -= 20; // Penalty for scattered docs
    }
    
    return Math.max(0, score);
  }

  calculateCompletenessScore(reports) {
    // Score based on documentation completeness (0-100)
    const implementedFeatures = reports.comparison?.summary?.totalImplementedFeatures || 0;
    const documentedFeatures = reports.comparison?.summary?.totalDocumentedFeatures || 0;
    
    if (implementedFeatures === 0) return 0;
    
    return Math.min(100, Math.round((documentedFeatures / implementedFeatures) * 100));
  }

  calculateAlignmentScore(reports) {
    // Score based on docs-implementation alignment (0-100)
    const totalFeatures = reports.comparison?.summary?.totalImplementedFeatures || 0;
    const matches = reports.comparison?.summary?.totalMatches || 0;
    
    if (totalFeatures === 0) return 0;
    
    return Math.round((matches / totalFeatures) * 100);
  }

  calculateOnboardingReadiness(reports) {
    // Score based on how ready the project is for new developers (0-100)
    let score = 0;
    
    // Check for essential documentation
    const hasReadme = reports.catalog?.catalog?.docs?.some(file => 
      file.name.toLowerCase().includes('readme')
    );
    if (hasReadme) score += 25;
    
    const hasSetupGuide = reports.catalog?.catalog?.docs?.some(file => 
      file.name.toLowerCase().includes('setup')
    );
    if (hasSetupGuide) score += 25;
    
    // Check organization
    if (this.calculateOrganizationScore(reports) > 70) score += 25;
    
    // Check completeness
    if (this.calculateCompletenessScore(reports) > 70) score += 25;
    
    return score;
  }

  calculateMaintenanceReadiness(reports) {
    // Score based on maintainability (0-100)
    let score = 50; // Base score
    
    // Deduct for duplicates
    const duplicatePercentage = this.calculateDuplicatePercentage(reports);
    score -= duplicatePercentage / 2;
    
    // Add for good alignment
    const alignmentScore = this.calculateAlignmentScore(reports);
    score += alignmentScore / 4;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateCollaborationReadiness(reports) {
    // Score based on collaboration readiness (0-100)
    let score = 0;
    
    // Check for contribution guidelines
    const hasContributing = reports.catalog?.catalog?.docs?.some(file => 
      file.name.toLowerCase().includes('contribut')
    );
    if (hasContributing) score += 30;
    
    // Check for clear documentation
    if (this.calculateOrganizationScore(reports) > 80) score += 35;
    
    // Check for API documentation
    const hasApiDocs = reports.catalog?.catalog?.docs?.some(file => 
      file.relativePath.toLowerCase().includes('api')
    );
    if (hasApiDocs) score += 35;
    
    return score;
  }

  async writeMasterSummary(summary) {
    const markdown = `# Project Analysis Master Summary

**Analysis Date**: ${summary.projectOverview.analysisDate}
**Project**: ${summary.projectOverview.projectName}

## 📊 Project Overview

- **Total Files**: ${summary.projectOverview.totalFiles}
- **Total Size**: ${summary.projectOverview.totalSize}
- **Documentation Files**: ${summary.projectOverview.documentationFiles}
- **Specification Files**: ${summary.projectOverview.specificationFiles}
- **Implemented Features**: ${summary.projectOverview.implementedFeatures}
- **Documented Features**: ${summary.projectOverview.documentedFeatures}

## 🔍 Key Findings

${summary.keyFindings.map(finding => `
### ${finding.type.toUpperCase()} - ${finding.severity.toUpperCase()}
**Finding**: ${finding.finding}
**Impact**: ${finding.impact}
`).join('\n')}

## 🚨 Critical Issues

${summary.criticalIssues.map(issue => `
### ${issue.issue}
- **Priority**: ${issue.priority.toUpperCase()}
- **Description**: ${issue.description}
- **Estimated Effort**: ${issue.estimatedEffort}
- **Blocks Progress**: ${issue.blocksProgress ? 'Yes' : 'No'}
`).join('\n')}

## 📈 Project Health Metrics

### Documentation Health
- **Organization Score**: ${summary.metrics.documentationHealth.organizationScore}/100
- **Completeness Score**: ${summary.metrics.documentationHealth.completenessScore}/100
- **Duplicate Percentage**: ${summary.metrics.documentationHealth.duplicatePercentage}%

### Implementation Alignment
- **Matched Features**: ${summary.metrics.implementationAlignment.matchedFeatures}
- **Documentation Gaps**: ${summary.metrics.implementationAlignment.documentationGaps}
- **Implementation Gaps**: ${summary.metrics.implementationAlignment.implementationGaps}
- **Alignment Score**: ${summary.metrics.implementationAlignment.alignmentScore}/100

### Project Readiness
- **Onboarding Readiness**: ${summary.metrics.projectReadiness.onboardingReadiness}/100
- **Maintenance Readiness**: ${summary.metrics.projectReadiness.maintenanceReadiness}/100
- **Collaboration Readiness**: ${summary.metrics.projectReadiness.collaborationReadiness}/100

## 🎯 Priority Recommendations

${summary.recommendations.slice(0, 5).map((rec, index) => `
### ${index + 1}. ${rec.type.toUpperCase()} - Priority: ${rec.priority.toUpperCase()}
**Issue**: ${rec.message}
**Action**: ${rec.action}
**Estimated Effort**: ${rec.estimatedEffort || 'TBD'}
**Source**: ${rec.source}
`).join('\n')}

## 🗺️ Next Steps Roadmap

${summary.nextSteps.map(step => `
### Step ${step.step}: ${step.title}
- **Description**: ${step.description}
- **Timeframe**: ${step.timeframe}
- **Dependencies**: ${step.dependencies.length > 0 ? step.dependencies.join(', ') : 'None'}
`).join('\n')}

## 📋 Generated Reports

This analysis generated the following detailed reports:

${this.results.reports.map(report => `- \`${report}\``).join('\n')}

## 🎯 Success Criteria

To consider the project organization complete, achieve:

- [ ] **Organization Score > 90**: Clean, centralized file structure
- [ ] **Duplicate Percentage < 5%**: Minimal file duplication
- [ ] **Alignment Score > 85%**: Docs match implementation
- [ ] **Onboarding Readiness > 80%**: New developers can start quickly
- [ ] **All Critical Issues Resolved**: No blocking issues remain

---

*This master summary was generated automatically by the Complete Project Analyzer*
*Generated on: ${new Date().toLocaleString()}*
`;

    fs.writeFileSync(
      path.join(process.cwd(), 'project-analysis-master-summary.md'),
      markdown
    );
  }
}

// Run the complete analysis if this script is executed directly
if (require.main === module) {
  const analyzer = new CompleteProjectAnalyzer();
  analyzer.runCompleteAnalysis().catch(console.error);
}

module.exports = CompleteProjectAnalyzer;