#!/usr/bin/env node

/**
 * Developer Onboarding Time Tracking System
 * Tracks and analyzes onboarding metrics for new developers
 */

const fs = require('fs');
const path = require('path');

class OnboardingTracker {
  constructor() {
    this.dataFile = 'docs/metrics/onboarding-data.json';
    this.configFile = 'docs/metrics/onboarding-config.json';
    this.ensureDataFiles();
  }

  /**
   * Initialize data files if they don't exist
   */
  ensureDataFiles() {
    // Ensure metrics directory exists
    const metricsDir = path.dirname(this.dataFile);
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }

    // Initialize onboarding data file
    if (!fs.existsSync(this.dataFile)) {
      const initialData = {
        sessions: [],
        milestones: [],
        feedback: [],
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(initialData, null, 2));
    }

    // Initialize configuration file
    if (!fs.existsSync(this.configFile)) {
      const config = {
        milestones: [
          {
            id: 'environment_setup',
            name: 'Environment Setup',
            description: 'Complete local development environment setup',
            estimatedTime: 30, // minutes
            required: true
          },
          {
            id: 'project_clone',
            name: 'Project Clone & Install',
            description: 'Clone repository and install dependencies',
            estimatedTime: 15,
            required: true
          },
          {
            id: 'database_setup',
            name: 'Database Setup',
            description: 'Configure Supabase and run migrations',
            estimatedTime: 20,
            required: true
          },
          {
            id: 'first_run',
            name: 'First Application Run',
            description: 'Successfully start the development server',
            estimatedTime: 10,
            required: true
          },
          {
            id: 'documentation_review',
            name: 'Documentation Review',
            description: 'Read through getting started and architecture docs',
            estimatedTime: 45,
            required: true
          },
          {
            id: 'first_feature',
            name: 'First Feature Implementation',
            description: 'Complete first assigned task or feature',
            estimatedTime: 120,
            required: false
          },
          {
            id: 'code_review',
            name: 'First Code Review',
            description: 'Submit and complete first code review',
            estimatedTime: 30,
            required: false
          }
        ],
        feedbackQuestions: [
          {
            id: 'setup_difficulty',
            question: 'How difficult was the initial setup process?',
            type: 'scale',
            scale: { min: 1, max: 5, labels: ['Very Easy', 'Easy', 'Moderate', 'Difficult', 'Very Difficult'] }
          },
          {
            id: 'documentation_clarity',
            question: 'How clear and helpful was the documentation?',
            type: 'scale',
            scale: { min: 1, max: 5, labels: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] }
          },
          {
            id: 'missing_information',
            question: 'What information was missing or unclear?',
            type: 'text'
          },
          {
            id: 'improvement_suggestions',
            question: 'What would improve the onboarding experience?',
            type: 'text'
          },
          {
            id: 'overall_satisfaction',
            question: 'Overall satisfaction with onboarding process',
            type: 'scale',
            scale: { min: 1, max: 5, labels: ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] }
          }
        ]
      };
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    }
  }

  /**
   * Start a new onboarding session
   */
  startSession(developerId, developerName) {
    const data = this.loadData();
    const sessionId = `session_${Date.now()}_${developerId}`;
    
    const newSession = {
      sessionId,
      developerId,
      developerName,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'in_progress',
      milestones: [],
      totalTime: 0,
      feedback: null
    };

    data.sessions.push(newSession);
    this.saveData(data);

    console.log(`🚀 Started onboarding session for ${developerName} (ID: ${sessionId})`);
    return sessionId;
  }

  /**
   * Complete a milestone for a session
   */
  completeMilestone(sessionId, milestoneId, timeSpent = null) {
    const data = this.loadData();
    const config = this.loadConfig();
    
    const session = data.sessions.find(s => s.sessionId === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const milestone = config.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    const completedMilestone = {
      milestoneId,
      name: milestone.name,
      completedAt: new Date().toISOString(),
      timeSpent: timeSpent || milestone.estimatedTime,
      estimatedTime: milestone.estimatedTime
    };

    session.milestones.push(completedMilestone);
    this.saveData(data);

    console.log(`✅ Milestone '${milestone.name}' completed for session ${sessionId}`);
    return completedMilestone;
  }

  /**
   * Complete an onboarding session
   */
  completeSession(sessionId, feedback = null) {
    const data = this.loadData();
    const session = data.sessions.find(s => s.sessionId === sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.endTime = new Date().toISOString();
    session.status = 'completed';
    session.totalTime = session.milestones.reduce((total, m) => total + m.timeSpent, 0);
    
    if (feedback) {
      session.feedback = {
        submittedAt: new Date().toISOString(),
        responses: feedback
      };
    }

    this.saveData(data);

    console.log(`🎉 Onboarding session ${sessionId} completed! Total time: ${session.totalTime} minutes`);
    return session;
  }

  /**
   * Submit feedback for a session
   */
  submitFeedback(sessionId, responses) {
    const data = this.loadData();
    const session = data.sessions.find(s => s.sessionId === sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const feedback = {
      sessionId,
      developerId: session.developerId,
      submittedAt: new Date().toISOString(),
      responses
    };

    session.feedback = feedback;
    data.feedback.push(feedback);
    this.saveData(data);

    console.log(`📝 Feedback submitted for session ${sessionId}`);
    return feedback;
  }

  /**
   * Generate onboarding analytics
   */
  generateAnalytics() {
    const data = this.loadData();
    const config = this.loadConfig();
    const completedSessions = data.sessions.filter(s => s.status === 'completed');

    if (completedSessions.length === 0) {
      return {
        message: 'No completed onboarding sessions found',
        totalSessions: data.sessions.length,
        inProgress: data.sessions.filter(s => s.status === 'in_progress').length
      };
    }

    // Calculate average times
    const totalTimes = completedSessions.map(s => s.totalTime);
    const averageTime = totalTimes.reduce((sum, time) => sum + time, 0) / totalTimes.length;
    
    // Milestone analytics
    const milestoneAnalytics = config.milestones.map(milestone => {
      const completions = [];
      completedSessions.forEach(session => {
        const completed = session.milestones.find(m => m.milestoneId === milestone.id);
        if (completed) {
          completions.push(completed.timeSpent);
        }
      });

      return {
        milestoneId: milestone.id,
        name: milestone.name,
        estimatedTime: milestone.estimatedTime,
        completionRate: (completions.length / completedSessions.length * 100).toFixed(2),
        averageTime: completions.length > 0 ? 
          (completions.reduce((sum, time) => sum + time, 0) / completions.length).toFixed(2) : 0,
        timeVariance: completions.length > 0 ? 
          (Math.max(...completions) - Math.min(...completions)).toFixed(2) : 0
      };
    });

    // Feedback analytics
    const feedbackAnalytics = this.analyzeFeedback(data.feedback);

    // Completion rate
    const completionRate = (completedSessions.length / data.sessions.length * 100).toFixed(2);

    return {
      summary: {
        totalSessions: data.sessions.length,
        completedSessions: completedSessions.length,
        completionRate: `${completionRate}%`,
        averageOnboardingTime: `${averageTime.toFixed(2)} minutes`,
        averageOnboardingTimeHours: `${(averageTime / 60).toFixed(2)} hours`
      },
      milestones: milestoneAnalytics,
      feedback: feedbackAnalytics,
      trends: this.calculateTrends(completedSessions),
      recommendations: this.generateRecommendations(milestoneAnalytics, feedbackAnalytics)
    };
  }

  /**
   * Analyze feedback responses
   */
  analyzeFeedback(feedbackData) {
    if (feedbackData.length === 0) {
      return { message: 'No feedback data available' };
    }

    const config = this.loadConfig();
    const analytics = {};

    config.feedbackQuestions.forEach(question => {
      const responses = feedbackData
        .map(f => f.responses[question.id])
        .filter(r => r !== undefined && r !== null);

      if (question.type === 'scale') {
        const average = responses.reduce((sum, r) => sum + r, 0) / responses.length;
        analytics[question.id] = {
          question: question.question,
          type: 'scale',
          averageScore: average.toFixed(2),
          responseCount: responses.length,
          distribution: this.calculateDistribution(responses, question.scale.min, question.scale.max)
        };
      } else if (question.type === 'text') {
        analytics[question.id] = {
          question: question.question,
          type: 'text',
          responseCount: responses.length,
          responses: responses
        };
      }
    });

    return analytics;
  }

  /**
   * Calculate score distribution for scale questions
   */
  calculateDistribution(responses, min, max) {
    const distribution = {};
    for (let i = min; i <= max; i++) {
      distribution[i] = responses.filter(r => r === i).length;
    }
    return distribution;
  }

  /**
   * Calculate trends over time
   */
  calculateTrends(sessions) {
    if (sessions.length < 2) {
      return { message: 'Insufficient data for trend analysis' };
    }

    // Sort sessions by completion date
    const sortedSessions = sessions.sort((a, b) => 
      new Date(a.endTime) - new Date(b.endTime)
    );

    // Calculate moving average of onboarding times
    const windowSize = Math.min(3, sessions.length);
    const movingAverages = [];

    for (let i = windowSize - 1; i < sortedSessions.length; i++) {
      const window = sortedSessions.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, s) => sum + s.totalTime, 0) / window.length;
      movingAverages.push({
        date: sortedSessions[i].endTime,
        averageTime: average.toFixed(2)
      });
    }

    return {
      movingAverages,
      trend: this.calculateTrendDirection(movingAverages),
      improvement: this.calculateImprovement(sortedSessions)
    };
  }

  /**
   * Calculate trend direction
   */
  calculateTrendDirection(averages) {
    if (averages.length < 2) return 'insufficient_data';
    
    const first = parseFloat(averages[0].averageTime);
    const last = parseFloat(averages[averages.length - 1].averageTime);
    
    if (last < first * 0.9) return 'improving';
    if (last > first * 1.1) return 'declining';
    return 'stable';
  }

  /**
   * Calculate improvement percentage
   */
  calculateImprovement(sessions) {
    if (sessions.length < 2) return null;
    
    const first = sessions[0].totalTime;
    const last = sessions[sessions.length - 1].totalTime;
    
    return {
      percentage: (((first - last) / first) * 100).toFixed(2),
      direction: last < first ? 'improvement' : 'regression'
    };
  }

  /**
   * Generate recommendations based on analytics
   */
  generateRecommendations(milestoneAnalytics, feedbackAnalytics) {
    const recommendations = [];

    // Check for problematic milestones
    milestoneAnalytics.forEach(milestone => {
      if (parseFloat(milestone.completionRate) < 80) {
        recommendations.push({
          type: 'milestone_completion',
          priority: 'high',
          message: `Milestone '${milestone.name}' has low completion rate (${milestone.completionRate}%). Consider reviewing requirements or documentation.`
        });
      }

      if (parseFloat(milestone.averageTime) > milestone.estimatedTime * 1.5) {
        recommendations.push({
          type: 'milestone_time',
          priority: 'medium',
          message: `Milestone '${milestone.name}' takes ${milestone.averageTime} minutes on average, significantly longer than estimated ${milestone.estimatedTime} minutes.`
        });
      }
    });

    // Check feedback scores
    Object.values(feedbackAnalytics).forEach(feedback => {
      if (feedback.type === 'scale' && parseFloat(feedback.averageScore) < 3) {
        recommendations.push({
          type: 'feedback_score',
          priority: 'high',
          message: `Low satisfaction score for "${feedback.question}" (${feedback.averageScore}/5). Review and improve this aspect.`
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const analytics = this.generateAnalytics();
    const report = {
      generatedAt: new Date().toISOString(),
      analytics,
      rawData: this.loadData()
    };

    // Save JSON report
    const reportPath = 'docs/metrics/onboarding-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    this.generateMarkdownReport(report);

    return report;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    const { analytics } = report;
    
    let markdown = `# Developer Onboarding Report

Generated: ${new Date(report.generatedAt).toLocaleString()}

## Summary

`;

    if (analytics.summary) {
      markdown += `- **Total Sessions**: ${analytics.summary.totalSessions}
- **Completed Sessions**: ${analytics.summary.completedSessions}
- **Completion Rate**: ${analytics.summary.completionRate}
- **Average Onboarding Time**: ${analytics.summary.averageOnboardingTime} (${analytics.summary.averageOnboardingTimeHours})

`;
    }

    if (analytics.milestones) {
      markdown += `## Milestone Performance

| Milestone | Completion Rate | Avg Time | Est Time | Variance |
|-----------|----------------|----------|----------|----------|
`;
      analytics.milestones.forEach(m => {
        markdown += `| ${m.name} | ${m.completionRate}% | ${m.averageTime}min | ${m.estimatedTime}min | ${m.timeVariance}min |\n`;
      });
      markdown += '\n';
    }

    if (analytics.feedback && analytics.feedback.message !== 'No feedback data available') {
      markdown += `## Feedback Analysis

`;
      Object.values(analytics.feedback).forEach(feedback => {
        if (feedback.type === 'scale') {
          markdown += `### ${feedback.question}
- **Average Score**: ${feedback.averageScore}/5
- **Responses**: ${feedback.responseCount}

`;
        }
      });
    }

    if (analytics.recommendations && analytics.recommendations.length > 0) {
      markdown += `## Recommendations

`;
      analytics.recommendations.forEach(rec => {
        markdown += `### ${rec.type.toUpperCase()} - ${rec.priority.toUpperCase()} Priority

${rec.message}

`;
      });
    }

    const markdownPath = 'docs/metrics/onboarding-report.md';
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📄 Onboarding report saved to: ${markdownPath}`);
  }

  /**
   * Load data from file
   */
  loadData() {
    return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
    return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
  }

  /**
   * Save data to file
   */
  saveData(data) {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
  }
}

// CLI interface
if (require.main === module) {
  const tracker = new OnboardingTracker();
  const command = process.argv[2];

  switch (command) {
    case 'start':
      const developerId = process.argv[3];
      const developerName = process.argv[4];
      if (!developerId || !developerName) {
        console.error('Usage: node onboarding-tracker.js start <developerId> <developerName>');
        process.exit(1);
      }
      tracker.startSession(developerId, developerName);
      break;

    case 'milestone':
      const sessionId = process.argv[3];
      const milestoneId = process.argv[4];
      const timeSpent = process.argv[5] ? parseInt(process.argv[5]) : null;
      if (!sessionId || !milestoneId) {
        console.error('Usage: node onboarding-tracker.js milestone <sessionId> <milestoneId> [timeSpent]');
        process.exit(1);
      }
      tracker.completeMilestone(sessionId, milestoneId, timeSpent);
      break;

    case 'complete':
      const completeSessionId = process.argv[3];
      if (!completeSessionId) {
        console.error('Usage: node onboarding-tracker.js complete <sessionId>');
        process.exit(1);
      }
      tracker.completeSession(completeSessionId);
      break;

    case 'analytics':
      console.log(JSON.stringify(tracker.generateAnalytics(), null, 2));
      break;

    case 'report':
    default:
      const report = tracker.generateReport();
      console.log('\n✅ Onboarding report generated successfully!');
      if (report.analytics.summary) {
        console.log(`📊 Total Sessions: ${report.analytics.summary.totalSessions}`);
        console.log(`✅ Completion Rate: ${report.analytics.summary.completionRate}`);
        console.log(`⏱️  Average Time: ${report.analytics.summary.averageOnboardingTime}`);
      }
      break;
  }
}

module.exports = OnboardingTracker;