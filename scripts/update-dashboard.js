#!/usr/bin/env node

/**
 * Dashboard Update Script
 * Updates project status dashboard with current metrics
 */

const fs = require('fs');
const path = require('path');
const ProjectStatusTracker = require('./project-status-tracker');

class DashboardUpdater {
  constructor() {
    this.tracker = new ProjectStatusTracker();
    this.dashboardPath = 'docs/dashboard/project-status.md';
    this.readmePath = 'docs/README.md';
  }

  /**
   * Update dashboard with current metrics
   */
  async updateDashboard() {
    console.log('🔄 Updating project dashboard...');
    
    try {
      // Get current metrics
      const metrics = await this.tracker.analyze();
      const report = this.tracker.generateReport();
      
      // Update dashboard file
      await this.updateDashboardFile(report);
      
      // Update README badges
      await this.updateReadmeBadges(report);
      
      console.log('✅ Dashboard updated successfully');
      
      return report;
      
    } catch (error) {
      console.error('❌ Error updating dashboard:', error);
      throw error;
    }
  }

  /**
   * Update the main dashboard file
   */
  async updateDashboardFile(report) {
    if (!fs.existsSync(this.dashboardPath)) {
      console.warn('Dashboard file not found, skipping update');
      return;
    }

    let content = fs.readFileSync(this.dashboardPath, 'utf8');
    
    // Update timestamp
    const now = new Date();
    const timestamp = now.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    content = content.replace(
      /> \*\*Última actualización\*\*: .*/,
      `> **Última actualización**: ${timestamp}`
    );
    
    // Update health score
    const healthScore = report.summary.overallHealth;
    content = content.replace(
      /\*\*Salud General\*\*: \d+\/100 .*/,
      `**Salud General**: ${healthScore}/100 ${this.getHealthEmoji(healthScore)}`
    );
    
    // Update TypeScript errors
    const tsErrors = report.development.typescript?.totalErrors || 0;
    content = content.replace(
      /\| Errores TypeScript \| \d+ \|/,
      `| Errores TypeScript | ${tsErrors} |`
    );
    
    // Update task progress
    const taskProgress = report.tasks;
    if (taskProgress && !taskProgress.error) {
      // Update total tasks row
      content = content.replace(
        /\| \*\*TOTAL\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \| \*\*\d+%\*\* \|/,
        `| **TOTAL** | **${taskProgress.total}** | **${taskProgress.completed}** | **${taskProgress.inProgress}** | **${taskProgress.pending}** | **${taskProgress.completionRate}%** |`
      );
      
      // Update project organization row
      const orgSpec = taskProgress.specs['project-organization-documentation'];
      if (orgSpec) {
        content = content.replace(
          /\| Organización Proyecto \| \d+ \| \d+ \| \d+ \| \d+ \| \d+% \|/,
          `| Organización Proyecto | ${orgSpec.total} | ${orgSpec.completed} | ${orgSpec.inProgress} | ${orgSpec.pending} | ${orgSpec.completionRate}% |`
        );
      }
    }
    
    fs.writeFileSync(this.dashboardPath, content);
    console.log('📊 Dashboard file updated');
  }

  /**
   * Update badges in README
   */
  async updateReadmeBadges(report) {
    if (!fs.existsSync(this.readmePath)) {
      console.warn('README file not found, skipping badge update');
      return;
    }

    let content = fs.readFileSync(this.readmePath, 'utf8');
    const badges = report.badges;
    
    // Update TypeScript badge
    const tsErrors = report.development.typescript?.totalErrors || 0;
    content = content.replace(
      /!\[TypeScript\]\(https:\/\/img\.shields\.io\/badge\/TypeScript_Errors-\d+-\w+\)/,
      `![TypeScript](${badges.typescript})`
    );
    
    // Update task progress badge
    content = content.replace(
      /!\[Completed Tasks\]\(https:\/\/img\.shields\.io\/badge\/Tareas_Completadas-\d+%2F\d+-\w+\)/,
      `![Completed Tasks](${badges.taskProgress})`
    );
    
    // Update completion rate badge
    content = content.replace(
      /!\[Project Organization\]\(https:\/\/img\.shields\.io\/badge\/Organización_Proyecto-\d+%25-\w+\)/,
      `![Project Organization](${badges.completionRate})`
    );
    
    fs.writeFileSync(this.readmePath, content);
    console.log('🏷️ README badges updated');
  }

  /**
   * Get emoji for health score
   */
  getHealthEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    return '🔴';
  }

  /**
   * Generate status summary for CLI
   */
  generateSummary(report) {
    const summary = [];
    
    summary.push('📊 Project Status Summary');
    summary.push('========================');
    summary.push(`Overall Health: ${report.summary.overallHealth}/100 ${this.getHealthEmoji(report.summary.overallHealth)}`);
    
    if (report.tasks && !report.tasks.error) {
      summary.push(`Tasks: ${report.tasks.completed}/${report.tasks.total} completed (${report.tasks.completionRate}%)`);
    }
    
    if (report.development.typescript) {
      summary.push(`TypeScript Errors: ${report.development.typescript.totalErrors}`);
    }
    
    if (report.development.documentation) {
      summary.push(`Documentation: ${report.development.documentation.coverage}% coverage`);
    }
    
    if (report.summary.recommendations.length > 0) {
      summary.push('');
      summary.push('🎯 Top Recommendations:');
      report.summary.recommendations.slice(0, 3).forEach((rec, i) => {
        summary.push(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }
    
    return summary.join('\n');
  }
}

// CLI interface
if (require.main === module) {
  const updater = new DashboardUpdater();
  
  const command = process.argv[2] || 'update';
  
  if (command === 'update') {
    updater.updateDashboard()
      .then(report => {
        console.log('\n' + updater.generateSummary(report));
      })
      .catch(error => {
        console.error('❌ Failed to update dashboard:', error);
        process.exit(1);
      });
  } else if (command === 'status') {
    // Just show status without updating files
    const tracker = new ProjectStatusTracker();
    tracker.analyze()
      .then(metrics => {
        const report = tracker.generateReport();
        console.log(updater.generateSummary(report));
      })
      .catch(error => {
        console.error('❌ Failed to get status:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node scripts/update-dashboard.js [update|status]');
    console.log('  update: Update dashboard files with current metrics');
    console.log('  status: Show current status without updating files');
  }
}

module.exports = DashboardUpdater;