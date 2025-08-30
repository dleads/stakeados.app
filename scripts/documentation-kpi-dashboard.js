#!/usr/bin/env node

/**
 * Documentation KPI Dashboard
 * Establishes and monitors key performance indicators for documentation quality
 */

const fs = require('fs');
const path = require('path');
const DocumentationMetrics = require('./documentation-metrics');
const OnboardingTracker = require('./onboarding-tracker');

class DocumentationKPIDashboard {
  constructor() {
    this.metricsCollector = new DocumentationMetrics();
    this.onboardingTracker = new OnboardingTracker();
    this.kpiConfigFile = 'docs/metrics/kpi-config.json';
    this.kpiDataFile = 'docs/metrics/kpi-data.json';
    this.dashboardFile = 'docs/metrics/kpi-dashboard.html';
    
    this.initializeKPIConfig();
  }

  /**
   * Initialize KPI configuration with targets and thresholds
   */
  initializeKPIConfig() {
    const metricsDir = path.dirname(this.kpiConfigFile);
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }

    if (!fs.existsSync(this.kpiConfigFile)) {
      const defaultConfig = {
        kpis: {
          documentation_coverage: {
            name: 'Documentation Coverage',
            description: 'Percentage of source files with corresponding documentation',
            target: 85,
            thresholds: {
              excellent: 90,
              good: 80,
              warning: 70,
              critical: 60
            },
            unit: '%',
            category: 'coverage'
          },
          documentation_quality_score: {
            name: 'Documentation Quality Score',
            description: 'Overall quality score based on broken links, examples, and freshness',
            target: 85,
            thresholds: {
              excellent: 90,
              good: 80,
              warning: 70,
              critical: 60
            },
            unit: '%',
            category: 'quality'
          },
          onboarding_completion_rate: {
            name: 'Onboarding Completion Rate',
            description: 'Percentage of developers who complete the full onboarding process',
            target: 90,
            thresholds: {
              excellent: 95,
              good: 85,
              warning: 75,
              critical: 65
            },
            unit: '%',
            category: 'onboarding'
          },
          average_onboarding_time: {
            name: 'Average Onboarding Time',
            description: 'Average time for new developers to complete onboarding',
            target: 180, // 3 hours
            thresholds: {
              excellent: 150,
              good: 180,
              warning: 240,
              critical: 300
            },
            unit: 'minutes',
            category: 'onboarding',
            lowerIsBetter: true
          },
          stale_documentation_percentage: {
            name: 'Stale Documentation Percentage',
            description: 'Percentage of documentation not updated in 90+ days',
            target: 10,
            thresholds: {
              excellent: 5,
              good: 10,
              warning: 20,
              critical: 30
            },
            unit: '%',
            category: 'maintenance',
            lowerIsBetter: true
          },
          broken_links_count: {
            name: 'Broken Links Count',
            description: 'Number of broken internal links in documentation',
            target: 0,
            thresholds: {
              excellent: 0,
              good: 2,
              warning: 5,
              critical: 10
            },
            unit: 'count',
            category: 'quality',
            lowerIsBetter: true
          },
          documentation_feedback_score: {
            name: 'Documentation Feedback Score',
            description: 'Average satisfaction score from developer feedback',
            target: 4.0,
            thresholds: {
              excellent: 4.5,
              good: 4.0,
              warning: 3.5,
              critical: 3.0
            },
            unit: '/5',
            category: 'satisfaction'
          },
          weekly_documentation_updates: {
            name: 'Weekly Documentation Updates',
            description: 'Number of documentation files updated in the last 7 days',
            target: 5,
            thresholds: {
              excellent: 8,
              good: 5,
              warning: 3,
              critical: 1
            },
            unit: 'count',
            category: 'maintenance'
          }
        },
        alerting: {
          enabled: true,
          channels: ['console', 'file'],
          thresholds: ['critical', 'warning']
        },
        reporting: {
          frequency: 'weekly',
          includeGraphs: true,
          includeTrends: true
        }
      };

      fs.writeFileSync(this.kpiConfigFile, JSON.stringify(defaultConfig, null, 2));
    }

    // Initialize KPI data file
    if (!fs.existsSync(this.kpiDataFile)) {
      const initialData = {
        measurements: [],
        alerts: [],
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.kpiDataFile, JSON.stringify(initialData, null, 2));
    }
  }

  /**
   * Collect current KPI measurements
   */
  async collectKPIMeasurements() {
    console.log('📊 Collecting KPI measurements...');

    // Get documentation metrics
    const docMetrics = this.metricsCollector.generateReport();
    
    // Get onboarding analytics
    const onboardingAnalytics = this.onboardingTracker.generateAnalytics();

    const timestamp = new Date().toISOString();
    const measurements = {
      timestamp,
      documentation_coverage: parseFloat(docMetrics.detailed.coverage.coveragePercentage),
      documentation_quality_score: parseFloat(docMetrics.detailed.quality.qualityScore),
      onboarding_completion_rate: onboardingAnalytics.summary ? 
        parseFloat(onboardingAnalytics.summary.completionRate) : 0,
      average_onboarding_time: onboardingAnalytics.summary ? 
        parseFloat(onboardingAnalytics.summary.averageOnboardingTime) : 0,
      stale_documentation_percentage: this.calculateStaleDocumentationPercentage(docMetrics),
      broken_links_count: docMetrics.detailed.quality.brokenLinks,
      documentation_feedback_score: this.calculateFeedbackScore(onboardingAnalytics),
      weekly_documentation_updates: docMetrics.detailed.maintenance.recentUpdates.length
    };

    return measurements;
  }

  /**
   * Calculate stale documentation percentage
   */
  calculateStaleDocumentationPercentage(docMetrics) {
    const totalDocs = docMetrics.summary.totalDocFiles;
    const staleDocs = docMetrics.detailed.maintenance.staleDocs.length;
    return totalDocs > 0 ? ((staleDocs / totalDocs) * 100).toFixed(2) : 0;
  }

  /**
   * Calculate average feedback score
   */
  calculateFeedbackScore(onboardingAnalytics) {
    if (!onboardingAnalytics.feedback || 
        onboardingAnalytics.feedback.message === 'No feedback data available') {
      return 0;
    }

    const satisfactionFeedback = onboardingAnalytics.feedback.overall_satisfaction;
    return satisfactionFeedback ? parseFloat(satisfactionFeedback.averageScore) : 0;
  }

  /**
   * Evaluate KPI status against thresholds
   */
  evaluateKPIStatus(measurements) {
    const config = this.loadKPIConfig();
    const evaluation = {};

    Object.keys(config.kpis).forEach(kpiKey => {
      const kpi = config.kpis[kpiKey];
      const value = measurements[kpiKey];
      
      if (value === undefined || value === null) {
        evaluation[kpiKey] = {
          status: 'no_data',
          value: null,
          message: 'No data available'
        };
        return;
      }

      const status = this.determineKPIStatus(value, kpi);
      evaluation[kpiKey] = {
        status,
        value,
        target: kpi.target,
        message: this.generateKPIMessage(kpi, value, status)
      };
    });

    return evaluation;
  }

  /**
   * Determine KPI status based on thresholds
   */
  determineKPIStatus(value, kpi) {
    const { thresholds, lowerIsBetter } = kpi;
    
    if (lowerIsBetter) {
      if (value <= thresholds.excellent) return 'excellent';
      if (value <= thresholds.good) return 'good';
      if (value <= thresholds.warning) return 'warning';
      return 'critical';
    } else {
      if (value >= thresholds.excellent) return 'excellent';
      if (value >= thresholds.good) return 'good';
      if (value >= thresholds.warning) return 'warning';
      return 'critical';
    }
  }

  /**
   * Generate KPI status message
   */
  generateKPIMessage(kpi, value, status) {
    const statusMessages = {
      excellent: '🟢 Excellent performance',
      good: '🟡 Good performance',
      warning: '🟠 Needs attention',
      critical: '🔴 Critical - immediate action required',
      no_data: '⚪ No data available'
    };

    const comparison = kpi.lowerIsBetter ? 
      (value <= kpi.target ? 'below' : 'above') :
      (value >= kpi.target ? 'above' : 'below');
    
    return `${statusMessages[status]} - ${value}${kpi.unit} (target: ${comparison} ${kpi.target}${kpi.unit})`;
  }

  /**
   * Generate alerts for critical KPIs
   */
  generateAlerts(evaluation) {
    const config = this.loadKPIConfig();
    const alerts = [];

    if (!config.alerting.enabled) {
      return alerts;
    }

    Object.keys(evaluation).forEach(kpiKey => {
      const kpi = config.kpis[kpiKey];
      const result = evaluation[kpiKey];

      if (config.alerting.thresholds.includes(result.status)) {
        alerts.push({
          timestamp: new Date().toISOString(),
          kpi: kpiKey,
          name: kpi.name,
          status: result.status,
          value: result.value,
          target: result.target,
          message: result.message,
          category: kpi.category
        });
      }
    });

    return alerts;
  }

  /**
   * Store KPI measurements and evaluation
   */
  storeKPIData(measurements, evaluation, alerts) {
    const data = this.loadKPIData();
    
    const record = {
      timestamp: measurements.timestamp,
      measurements,
      evaluation,
      alerts: alerts.length > 0 ? alerts : null
    };

    data.measurements.push(record);
    
    // Keep only last 100 measurements
    if (data.measurements.length > 100) {
      data.measurements = data.measurements.slice(-100);
    }

    // Add new alerts
    data.alerts.push(...alerts);
    
    // Keep only last 50 alerts
    if (data.alerts.length > 50) {
      data.alerts = data.alerts.slice(-50);
    }

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.kpiDataFile, JSON.stringify(data, null, 2));
  }

  /**
   * Generate comprehensive KPI dashboard
   */
  async generateDashboard() {
    console.log('📈 Generating KPI dashboard...');

    const measurements = await this.collectKPIMeasurements();
    const evaluation = this.evaluateKPIStatus(measurements);
    const alerts = this.generateAlerts(evaluation);
    
    // Store data
    this.storeKPIData(measurements, evaluation, alerts);

    // Generate reports
    const dashboardData = {
      generatedAt: new Date().toISOString(),
      measurements,
      evaluation,
      alerts,
      trends: this.calculateTrends(),
      summary: this.generateSummary(evaluation)
    };

    // Generate HTML dashboard
    this.generateHTMLDashboard(dashboardData);
    
    // Generate markdown report
    this.generateMarkdownDashboard(dashboardData);

    // Output alerts to console
    if (alerts.length > 0) {
      console.log('\n🚨 ALERTS:');
      alerts.forEach(alert => {
        console.log(`${alert.message} (${alert.name})`);
      });
    }

    return dashboardData;
  }

  /**
   * Calculate trends from historical data
   */
  calculateTrends() {
    const data = this.loadKPIData();
    const config = this.loadKPIConfig();
    
    if (data.measurements.length < 2) {
      return { message: 'Insufficient data for trend analysis' };
    }

    const trends = {};
    const recentMeasurements = data.measurements.slice(-10); // Last 10 measurements

    Object.keys(config.kpis).forEach(kpiKey => {
      const values = recentMeasurements
        .map(m => m.measurements[kpiKey])
        .filter(v => v !== null && v !== undefined);

      if (values.length >= 2) {
        const first = values[0];
        const last = values[values.length - 1];
        const change = last - first;
        const changePercent = ((change / first) * 100).toFixed(2);

        trends[kpiKey] = {
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
          change: change.toFixed(2),
          changePercent,
          isImproving: config.kpis[kpiKey].lowerIsBetter ? change < 0 : change > 0
        };
      }
    });

    return trends;
  }

  /**
   * Generate summary statistics
   */
  generateSummary(evaluation) {
    const statusCounts = {
      excellent: 0,
      good: 0,
      warning: 0,
      critical: 0,
      no_data: 0
    };

    Object.values(evaluation).forEach(result => {
      statusCounts[result.status]++;
    });

    const totalKPIs = Object.keys(evaluation).length;
    const healthyKPIs = statusCounts.excellent + statusCounts.good;
    const healthScore = ((healthyKPIs / totalKPIs) * 100).toFixed(2);

    return {
      totalKPIs,
      healthScore: `${healthScore}%`,
      statusCounts,
      criticalIssues: statusCounts.critical,
      needsAttention: statusCounts.warning
    };
  }

  /**
   * Generate HTML dashboard
   */
  generateHTMLDashboard(dashboardData) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation KPI Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .kpi-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-excellent { border-left: 5px solid #27ae60; }
        .status-good { border-left: 5px solid #f39c12; }
        .status-warning { border-left: 5px solid #e67e22; }
        .status-critical { border-left: 5px solid #e74c3c; }
        .status-no_data { border-left: 5px solid #95a5a6; }
        .kpi-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .kpi-target { color: #7f8c8d; font-size: 0.9em; }
        .alerts { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .alert-item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .trend-up { color: #27ae60; }
        .trend-down { color: #e74c3c; }
        .trend-stable { color: #7f8c8d; }
        .timestamp { color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Documentation KPI Dashboard</h1>
            <p class="timestamp">Generated: ${new Date(dashboardData.generatedAt).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Overall Health</h3>
                <div class="kpi-value">${dashboardData.summary.healthScore}</div>
                <div class="kpi-target">${dashboardData.summary.totalKPIs} total KPIs</div>
            </div>
            <div class="summary-card">
                <h3>Critical Issues</h3>
                <div class="kpi-value" style="color: #e74c3c;">${dashboardData.summary.criticalIssues}</div>
                <div class="kpi-target">Require immediate attention</div>
            </div>
            <div class="summary-card">
                <h3>Needs Attention</h3>
                <div class="kpi-value" style="color: #e67e22;">${dashboardData.summary.needsAttention}</div>
                <div class="kpi-target">Warning status</div>
            </div>
        </div>

        ${dashboardData.alerts.length > 0 ? `
        <div class="alerts">
            <h3>🚨 Active Alerts</h3>
            ${dashboardData.alerts.map(alert => `
                <div class="alert-item">
                    <strong>${alert.name}</strong>: ${alert.message}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="kpi-grid">
            ${Object.keys(dashboardData.evaluation).map(kpiKey => {
                const result = dashboardData.evaluation[kpiKey];
                const config = this.loadKPIConfig().kpis[kpiKey];
                const trend = dashboardData.trends[kpiKey];
                
                return `
                <div class="kpi-card status-${result.status}">
                    <h3>${config.name}</h3>
                    <div class="kpi-value">${result.value !== null ? result.value + config.unit : 'N/A'}</div>
                    <div class="kpi-target">Target: ${config.target}${config.unit}</div>
                    <p>${result.message}</p>
                    ${trend ? `
                        <div class="trend-${trend.direction}">
                            Trend: ${trend.direction} ${trend.changePercent}%
                            ${trend.isImproving ? '📈 Improving' : '📉 Declining'}
                        </div>
                    ` : ''}
                </div>
                `;
            }).join('')}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(this.dashboardFile, html);
    console.log(`📄 HTML dashboard saved to: ${this.dashboardFile}`);
  }

  /**
   * Generate markdown dashboard report
   */
  generateMarkdownDashboard(dashboardData) {
    let markdown = `# Documentation KPI Dashboard

Generated: ${new Date(dashboardData.generatedAt).toLocaleString()}

## Summary

- **Overall Health Score**: ${dashboardData.summary.healthScore}
- **Total KPIs**: ${dashboardData.summary.totalKPIs}
- **Critical Issues**: ${dashboardData.summary.criticalIssues}
- **Needs Attention**: ${dashboardData.summary.needsAttention}

### Status Distribution

- 🟢 Excellent: ${dashboardData.summary.statusCounts.excellent}
- 🟡 Good: ${dashboardData.summary.statusCounts.good}
- 🟠 Warning: ${dashboardData.summary.statusCounts.warning}
- 🔴 Critical: ${dashboardData.summary.statusCounts.critical}
- ⚪ No Data: ${dashboardData.summary.statusCounts.no_data}

`;

    if (dashboardData.alerts.length > 0) {
      markdown += `## 🚨 Active Alerts

${dashboardData.alerts.map(alert => 
  `- **${alert.name}**: ${alert.message}`
).join('\n')}

`;
    }

    markdown += `## KPI Details

| KPI | Current Value | Target | Status | Trend |
|-----|---------------|--------|--------|-------|
`;

    const config = this.loadKPIConfig();
    Object.keys(dashboardData.evaluation).forEach(kpiKey => {
      const result = dashboardData.evaluation[kpiKey];
      const kpiConfig = config.kpis[kpiKey];
      const trend = dashboardData.trends[kpiKey];
      
      const statusEmoji = {
        excellent: '🟢',
        good: '🟡',
        warning: '🟠',
        critical: '🔴',
        no_data: '⚪'
      };

      const trendEmoji = trend ? 
        (trend.isImproving ? '📈' : '📉') : '➖';

      markdown += `| ${kpiConfig.name} | ${result.value !== null ? result.value + kpiConfig.unit : 'N/A'} | ${kpiConfig.target}${kpiConfig.unit} | ${statusEmoji[result.status]} ${result.status} | ${trendEmoji} ${trend ? trend.changePercent + '%' : 'N/A'} |\n`;
    });

    const markdownPath = 'docs/metrics/kpi-dashboard.md';
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📄 Markdown dashboard saved to: ${markdownPath}`);
  }

  /**
   * Load KPI configuration
   */
  loadKPIConfig() {
    return JSON.parse(fs.readFileSync(this.kpiConfigFile, 'utf8'));
  }

  /**
   * Load KPI data
   */
  loadKPIData() {
    return JSON.parse(fs.readFileSync(this.kpiDataFile, 'utf8'));
  }
}

// CLI interface
if (require.main === module) {
  const dashboard = new DocumentationKPIDashboard();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'collect':
      dashboard.collectKPIMeasurements().then(measurements => {
        console.log(JSON.stringify(measurements, null, 2));
      });
      break;
    case 'dashboard':
    default:
      dashboard.generateDashboard().then(data => {
        console.log('\n✅ KPI dashboard generated successfully!');
        console.log(`📊 Health Score: ${data.summary.healthScore}`);
        console.log(`🚨 Critical Issues: ${data.summary.criticalIssues}`);
        console.log(`⚠️  Warnings: ${data.summary.needsAttention}`);
      });
      break;
  }
}

module.exports = DocumentationKPIDashboard;