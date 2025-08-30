#!/usr/bin/env node

/**
 * Unified Documentation Quality System
 * Integrates metrics collection, onboarding tracking, and KPI monitoring
 */

const DocumentationMetrics = require('./documentation-metrics');
const OnboardingTracker = require('./onboarding-tracker');
const DocumentationKPIDashboard = require('./documentation-kpi-dashboard');

class DocumentationQualitySystem {
  constructor() {
    this.metrics = new DocumentationMetrics();
    this.onboarding = new OnboardingTracker();
    this.dashboard = new DocumentationKPIDashboard();
  }

  /**
   * Run complete documentation quality analysis
   */
  async runCompleteAnalysis() {
    console.log('🚀 Starting complete documentation quality analysis...\n');

    try {
      // 1. Generate documentation metrics
      console.log('📊 Step 1: Generating documentation metrics...');
      const metricsReport = this.metrics.generateReport();
      console.log('✅ Documentation metrics completed\n');

      // 2. Generate onboarding analytics
      console.log('👥 Step 2: Analyzing onboarding data...');
      const onboardingReport = this.onboarding.generateReport();
      console.log('✅ Onboarding analysis completed\n');

      // 3. Generate KPI dashboard
      console.log('📈 Step 3: Generating KPI dashboard...');
      const dashboardData = await this.dashboard.generateDashboard();
      console.log('✅ KPI dashboard completed\n');

      // 4. Generate unified summary
      console.log('📋 Step 4: Creating unified summary...');
      const summary = this.generateUnifiedSummary(metricsReport, onboardingReport, dashboardData);
      console.log('✅ Unified summary completed\n');

      console.log('🎉 Complete documentation quality analysis finished!');
      console.log('\n📄 Generated reports:');
      console.log('- docs/metrics/documentation-quality-report.md');
      console.log('- docs/metrics/onboarding-report.md');
      console.log('- docs/metrics/kpi-dashboard.html');
      console.log('- docs/metrics/kpi-dashboard.md');
      console.log('- docs/metrics/unified-quality-summary.md');

      return summary;

    } catch (error) {
      console.error('❌ Error during analysis:', error.message);
      throw error;
    }
  }

  /**
   * Generate unified summary of all quality metrics
   */
  generateUnifiedSummary(metricsReport, onboardingReport, dashboardData) {
    const summary = {
      generatedAt: new Date().toISOString(),
      overview: {
        documentationCoverage: metricsReport.summary.coveragePercentage,
        qualityScore: metricsReport.summary.qualityScore,
        overallHealthScore: dashboardData.summary.healthScore,
        criticalIssues: dashboardData.summary.criticalIssues,
        totalDocFiles: metricsReport.summary.totalDocFiles
      },
      onboarding: {
        completionRate: onboardingReport.analytics.summary?.completionRate || 'N/A',
        averageTime: onboardingReport.analytics.summary?.averageOnboardingTime || 'N/A',
        totalSessions: onboardingReport.analytics.summary?.totalSessions || 0
      },
      recommendations: this.generateUnifiedRecommendations(metricsReport, onboardingReport, dashboardData),
      actionItems: this.generateActionItems(metricsReport, onboardingReport, dashboardData)
    };

    // Save unified summary
    this.saveUnifiedSummary(summary);

    return summary;
  }

  /**
   * Generate unified recommendations across all systems
   */
  generateUnifiedRecommendations(metricsReport, onboardingReport, dashboardData) {
    const recommendations = [];

    // Add documentation metrics recommendations
    if (metricsReport.recommendations) {
      recommendations.push(...metricsReport.recommendations.map(rec => ({
        ...rec,
        source: 'documentation_metrics'
      })));
    }

    // Add onboarding recommendations
    if (onboardingReport.analytics.recommendations) {
      recommendations.push(...onboardingReport.analytics.recommendations.map(rec => ({
        ...rec,
        source: 'onboarding_tracker'
      })));
    }

    // Add KPI-based recommendations
    if (dashboardData.alerts && dashboardData.alerts.length > 0) {
      dashboardData.alerts.forEach(alert => {
        recommendations.push({
          type: 'kpi_alert',
          priority: alert.status === 'critical' ? 'high' : 'medium',
          message: `KPI Alert: ${alert.message}`,
          source: 'kpi_dashboard',
          kpi: alert.kpi
        });
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return recommendations;
  }

  /**
   * Generate actionable items based on all metrics
   */
  generateActionItems(metricsReport, onboardingReport, dashboardData) {
    const actionItems = [];

    // Documentation coverage actions
    if (parseFloat(metricsReport.summary.coveragePercentage) < 80) {
      actionItems.push({
        category: 'coverage',
        priority: 'high',
        action: 'Improve documentation coverage',
        details: `Current coverage is ${metricsReport.summary.coveragePercentage}%. Focus on documenting the ${metricsReport.detailed.coverage.undocumentedFiles.length} undocumented files.`,
        estimatedEffort: 'Medium',
        owner: 'Development Team'
      });
    }

    // Quality improvement actions
    if (metricsReport.detailed.quality.brokenLinks > 0) {
      actionItems.push({
        category: 'quality',
        priority: 'medium',
        action: 'Fix broken documentation links',
        details: `Found ${metricsReport.detailed.quality.brokenLinks} broken links that need to be fixed.`,
        estimatedEffort: 'Low',
        owner: 'Documentation Team'
      });
    }

    // Onboarding improvement actions
    if (onboardingReport.analytics.summary && 
        parseFloat(onboardingReport.analytics.summary.completionRate) < 90) {
      actionItems.push({
        category: 'onboarding',
        priority: 'high',
        action: 'Improve onboarding completion rate',
        details: `Current completion rate is ${onboardingReport.analytics.summary.completionRate}%. Review onboarding process and identify bottlenecks.`,
        estimatedEffort: 'High',
        owner: 'Team Lead'
      });
    }

    // Maintenance actions
    if (metricsReport.detailed.maintenance.staleDocs.length > 0) {
      actionItems.push({
        category: 'maintenance',
        priority: 'medium',
        action: 'Update stale documentation',
        details: `${metricsReport.detailed.maintenance.staleDocs.length} documents haven't been updated in 90+ days.`,
        estimatedEffort: 'Medium',
        owner: 'Documentation Team'
      });
    }

    return actionItems;
  }

  /**
   * Save unified summary to file
   */
  saveUnifiedSummary(summary) {
    const markdown = `# Unified Documentation Quality Summary

Generated: ${new Date(summary.generatedAt).toLocaleString()}

## Executive Overview

- **Documentation Coverage**: ${summary.overview.documentationCoverage}%
- **Quality Score**: ${summary.overview.qualityScore}%
- **Overall Health Score**: ${summary.overview.overallHealthScore}
- **Critical Issues**: ${summary.overview.criticalIssues}
- **Total Documentation Files**: ${summary.overview.totalDocFiles}

## Onboarding Metrics

- **Completion Rate**: ${summary.onboarding.completionRate}
- **Average Onboarding Time**: ${summary.onboarding.averageTime}
- **Total Sessions**: ${summary.onboarding.totalSessions}

## Priority Recommendations

${summary.recommendations.slice(0, 5).map((rec, index) => 
  `### ${index + 1}. ${rec.type.toUpperCase()} - ${rec.priority.toUpperCase()} Priority

**Source**: ${rec.source}
**Message**: ${rec.message}
`).join('\n')}

## Action Items

${summary.actionItems.map((item, index) => 
  `### ${index + 1}. ${item.action}

- **Category**: ${item.category}
- **Priority**: ${item.priority}
- **Owner**: ${item.owner}
- **Estimated Effort**: ${item.estimatedEffort}
- **Details**: ${item.details}
`).join('\n')}

## Next Steps

1. **Immediate Actions** (High Priority)
   ${summary.actionItems.filter(item => item.priority === 'high').map(item => `- ${item.action}`).join('\n   ')}

2. **Short-term Actions** (Medium Priority)
   ${summary.actionItems.filter(item => item.priority === 'medium').map(item => `- ${item.action}`).join('\n   ')}

3. **Long-term Actions** (Low Priority)
   ${summary.actionItems.filter(item => item.priority === 'low').map(item => `- ${item.action}`).join('\n   ')}

## Monitoring

- Set up weekly KPI dashboard reviews
- Monitor onboarding completion rates monthly
- Review documentation quality metrics bi-weekly
- Update this summary monthly or after major documentation changes

---

*This summary integrates data from documentation metrics, onboarding tracking, and KPI monitoring systems.*
`;

    const fs = require('fs');
    const summaryPath = 'docs/metrics/unified-quality-summary.md';
    fs.writeFileSync(summaryPath, markdown);
    console.log(`📄 Unified summary saved to: ${summaryPath}`);

    // Also save JSON version
    const jsonPath = 'docs/metrics/unified-quality-summary.json';
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  }

  /**
   * Quick health check
   */
  async quickHealthCheck() {
    console.log('🏥 Running quick documentation health check...\n');

    try {
      const coverage = this.metrics.calculateCoverage();
      const quality = this.metrics.analyzeQuality();
      const onboardingAnalytics = this.onboarding.generateAnalytics();

      console.log('📊 Quick Health Check Results:');
      console.log(`📁 Coverage: ${coverage.coveragePercentage}%`);
      console.log(`🎯 Quality Score: ${quality.qualityScore}%`);
      console.log(`🔗 Broken Links: ${quality.brokenLinks}`);
      console.log(`📅 Stale Docs: ${quality.outdatedDocs}`);
      
      if (onboardingAnalytics.summary) {
        console.log(`👥 Onboarding Completion: ${onboardingAnalytics.summary.completionRate}`);
        console.log(`⏱️  Average Onboarding Time: ${onboardingAnalytics.summary.averageOnboardingTime}`);
      }

      // Simple health assessment
      const healthIssues = [];
      if (parseFloat(coverage.coveragePercentage) < 70) healthIssues.push('Low documentation coverage');
      if (parseFloat(quality.qualityScore) < 70) healthIssues.push('Low quality score');
      if (quality.brokenLinks > 5) healthIssues.push('Too many broken links');
      if (quality.outdatedDocs > 10) healthIssues.push('Too many stale documents');

      if (healthIssues.length === 0) {
        console.log('\n✅ Documentation health looks good!');
      } else {
        console.log('\n⚠️  Health Issues Found:');
        healthIssues.forEach(issue => console.log(`   - ${issue}`));
        console.log('\n💡 Run full analysis for detailed recommendations: npm run docs:quality:full');
      }

    } catch (error) {
      console.error('❌ Error during health check:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  const system = new DocumentationQualitySystem();
  const command = process.argv[2];

  switch (command) {
    case 'health':
    case 'check':
      system.quickHealthCheck();
      break;
    case 'full':
    case 'complete':
    default:
      system.runCompleteAnalysis().catch(error => {
        console.error('Failed to run analysis:', error);
        process.exit(1);
      });
      break;
  }
}

module.exports = DocumentationQualitySystem;