#!/usr/bin/env node

/**
 * Production readiness checklist for Stakeados admin system
 * Comprehensive validation before production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env.local (or custom path) at startup
try {
  const dotenv = require('dotenv');
  const envPath =
    process.env.dotenv_config_path || path.join(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (e) {
  // dotenv is optional; proceed if not available
}

class ProductionReadinessChecker {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  addCheck(category, name, status, message, severity = 'error') {
    this.checks.push({
      category,
      name,
      status,
      message,
      severity,
      timestamp: new Date().toISOString(),
    });

    if (status === 'pass') {
      this.passed++;
    } else if (status === 'fail') {
      this.failed++;
    } else if (status === 'warning') {
      this.warnings++;
    }
  }

  /**
   * Check code quality and testing
   */
  async checkCodeQuality() {
    console.log('🔍 Checking code quality...');

    // TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.addCheck(
        'code-quality',
        'TypeScript Compilation',
        'pass',
        'TypeScript compiles without errors'
      );
    } catch (error) {
      this.addCheck(
        'code-quality',
        'TypeScript Compilation',
        'fail',
        'TypeScript compilation errors found'
      );
    }

    // ESLint checks
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      this.addCheck(
        'code-quality',
        'ESLint',
        'pass',
        'No linting errors found'
      );
    } catch (error) {
      this.addCheck('code-quality', 'ESLint', 'fail', 'Linting errors found');
    }

    // Prettier formatting
    try {
      execSync('npm run format:check', { stdio: 'pipe' });
      this.addCheck(
        'code-quality',
        'Code Formatting',
        'pass',
        'Code is properly formatted'
      );
    } catch (error) {
      this.addCheck(
        'code-quality',
        'Code Formatting',
        'warning',
        'Code formatting issues found',
        'warning'
      );
    }

    // Test coverage
    try {
      const result = execSync('npm run test:coverage', {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      if (result.includes('100%') || result.includes('90%')) {
        this.addCheck(
          'code-quality',
          'Test Coverage',
          'pass',
          'Good test coverage achieved'
        );
      } else {
        this.addCheck(
          'code-quality',
          'Test Coverage',
          'warning',
          'Test coverage could be improved',
          'warning'
        );
      }
    } catch (error) {
      this.addCheck(
        'code-quality',
        'Test Coverage',
        'fail',
        'Unable to determine test coverage'
      );
    }
  }

  /**
   * Check environment configuration
   */
  checkEnvironmentConfig() {
    console.log('🔍 Checking environment configuration...');

    const requiredEnvVars = [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
    ];

    let missingVars = 0;
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars++;
      }
    });

    if (missingVars === 0) {
      this.addCheck(
        'environment',
        'Required Variables',
        'pass',
        'All required environment variables are set'
      );
    } else {
      this.addCheck(
        'environment',
        'Required Variables',
        'fail',
        `${missingVars} required environment variables are missing`
      );
    }

    // Check production URL
    if (
      process.env.NEXT_PUBLIC_APP_URL &&
      !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
    ) {
      this.addCheck(
        'environment',
        'Production URL',
        'pass',
        'Production URL is configured'
      );
    } else {
      this.addCheck(
        'environment',
        'Production URL',
        'fail',
        'Production URL not configured or still pointing to localhost'
      );
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      this.addCheck(
        'environment',
        'Node Environment',
        'pass',
        'NODE_ENV is set to production'
      );
    } else {
      this.addCheck(
        'environment',
        'Node Environment',
        'fail',
        'NODE_ENV is not set to production'
      );
    }
  }

  /**
   * Check security configuration
   */
  async checkSecurity() {
    console.log('🔍 Checking security configuration...');

    // Run security audit
    try {
      const SecurityAuditor = require('./security-audit.js');
      const auditor = new SecurityAuditor();
      const passed = await auditor.runAudit();

      if (passed) {
        this.addCheck(
          'security',
          'Security Audit',
          'pass',
          'No critical security issues found'
        );
      } else {
        this.addCheck(
          'security',
          'Security Audit',
          'fail',
          'Critical security issues found'
        );
      }
    } catch (error) {
      this.addCheck(
        'security',
        'Security Audit',
        'fail',
        'Security audit failed to run'
      );
    }

    // Check for .env files in git
    try {
      const gitFiles = execSync('git ls-files', { encoding: 'utf8' });
      if (gitFiles.includes('.env')) {
        this.addCheck(
          'security',
          'Environment Files',
          'fail',
          '.env files are tracked in git'
        );
      } else {
        this.addCheck(
          'security',
          'Environment Files',
          'pass',
          'No .env files in version control'
        );
      }
    } catch (error) {
      this.addCheck(
        'security',
        'Environment Files',
        'warning',
        'Could not check git files',
        'warning'
      );
    }

    // Check security headers configuration
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      if (
        configContent.includes('headers()') &&
        configContent.includes('Content-Security-Policy')
      ) {
        this.addCheck(
          'security',
          'Security Headers',
          'pass',
          'Security headers are configured'
        );
      } else {
        this.addCheck(
          'security',
          'Security Headers',
          'fail',
          'Security headers not properly configured'
        );
      }
    }
  }

  /**
   * Check performance configuration
   */
  checkPerformance() {
    console.log('🔍 Checking performance configuration...');

    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');

      // Check if source maps are disabled
      if (configContent.includes('productionBrowserSourceMaps: false')) {
        this.addCheck(
          'performance',
          'Source Maps',
          'pass',
          'Source maps disabled for production'
        );
      } else {
        this.addCheck(
          'performance',
          'Source Maps',
          'warning',
          'Source maps may be enabled in production',
          'warning'
        );
      }

      // Check compression
      if (configContent.includes('compress: true')) {
        this.addCheck(
          'performance',
          'Compression',
          'pass',
          'Compression is enabled'
        );
      } else {
        this.addCheck(
          'performance',
          'Compression',
          'warning',
          'Compression not explicitly enabled',
          'warning'
        );
      }

      // Check optimization settings
      if (
        configContent.includes('optimizeCss') ||
        configContent.includes('optimizePackageImports')
      ) {
        this.addCheck(
          'performance',
          'Build Optimization',
          'pass',
          'Build optimizations are configured'
        );
      } else {
        this.addCheck(
          'performance',
          'Build Optimization',
          'warning',
          'Build optimizations could be improved',
          'warning'
        );
      }
    }

    // Check if bundle analyzer is available
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (
        packageJson.devDependencies &&
        packageJson.devDependencies['@next/bundle-analyzer']
      ) {
        this.addCheck(
          'performance',
          'Bundle Analysis',
          'pass',
          'Bundle analyzer is available'
        );
      } else {
        this.addCheck(
          'performance',
          'Bundle Analysis',
          'warning',
          'Bundle analyzer not configured',
          'warning'
        );
      }
    }
  }

  /**
   * Check database configuration
   */
  async checkDatabase() {
    console.log('🔍 Checking database configuration...');

    // Check if migrations directory exists
    const migrationsPath = path.join(process.cwd(), 'supabase/migrations');
    if (fs.existsSync(migrationsPath)) {
      const migrations = fs.readdirSync(migrationsPath);
      if (migrations.length > 0) {
        this.addCheck(
          'database',
          'Migrations',
          'pass',
          `${migrations.length} migrations found`
        );
      } else {
        this.addCheck(
          'database',
          'Migrations',
          'warning',
          'No migrations found',
          'warning'
        );
      }
    } else {
      this.addCheck(
        'database',
        'Migrations',
        'fail',
        'Migrations directory not found'
      );
    }

    // Check database connection (if possible)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/database`
      );
      if (response.ok) {
        this.addCheck(
          'database',
          'Connectivity',
          'pass',
          'Database connection successful'
        );
      } else {
        this.addCheck(
          'database',
          'Connectivity',
          'fail',
          'Database connection failed'
        );
      }
    } catch (error) {
      this.addCheck(
        'database',
        'Connectivity',
        'warning',
        'Could not test database connection',
        'warning'
      );
    }
  }

  /**
   * Check deployment configuration
   */
  checkDeploymentConfig() {
    console.log('🔍 Checking deployment configuration...');

    // Check if deployment scripts exist
    const deployScriptPath = path.join(
      process.cwd(),
      'scripts/deployment/deploy.sh'
    );
    if (fs.existsSync(deployScriptPath)) {
      this.addCheck(
        'deployment',
        'Deploy Script',
        'pass',
        'Deployment script is available'
      );
    } else {
      this.addCheck(
        'deployment',
        'Deploy Script',
        'fail',
        'Deployment script not found'
      );
    }

    // Check GitHub Actions workflow
    const workflowPath = path.join(
      process.cwd(),
      '.github/workflows/deploy.yml'
    );
    if (fs.existsSync(workflowPath)) {
      this.addCheck(
        'deployment',
        'CI/CD Pipeline',
        'pass',
        'GitHub Actions workflow configured'
      );
    } else {
      this.addCheck(
        'deployment',
        'CI/CD Pipeline',
        'warning',
        'No CI/CD pipeline configured',
        'warning'
      );
    }

    // Check Vercel configuration
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelConfigPath)) {
      this.addCheck(
        'deployment',
        'Vercel Config',
        'pass',
        'Vercel configuration found'
      );
    } else {
      this.addCheck(
        'deployment',
        'Vercel Config',
        'warning',
        'No Vercel configuration found',
        'warning'
      );
    }

    // Check Docker configuration
    const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) {
      this.addCheck('deployment', 'Docker Config', 'pass', 'Dockerfile found');
    } else {
      this.addCheck(
        'deployment',
        'Docker Config',
        'warning',
        'No Dockerfile found',
        'warning'
      );
    }
  }

  /**
   * Check monitoring and logging
   */
  checkMonitoring() {
    console.log('🔍 Checking monitoring and logging...');

    // Check if monitoring components exist
    const monitoringPath = path.join(process.cwd(), 'src/lib/monitoring');
    if (fs.existsSync(monitoringPath)) {
      this.addCheck(
        'monitoring',
        'Monitoring System',
        'pass',
        'Monitoring system is implemented'
      );
    } else {
      this.addCheck(
        'monitoring',
        'Monitoring System',
        'fail',
        'Monitoring system not found'
      );
    }

    // Check health endpoints
    const healthEndpointPath = path.join(
      process.cwd(),
      'src/app/api/health/route.ts'
    );
    if (fs.existsSync(healthEndpointPath)) {
      this.addCheck(
        'monitoring',
        'Health Endpoints',
        'pass',
        'Health endpoints are implemented'
      );
    } else {
      this.addCheck(
        'monitoring',
        'Health Endpoints',
        'fail',
        'Health endpoints not found'
      );
    }

    // Check error tracking configuration
    if (process.env.SENTRY_DSN) {
      this.addCheck(
        'monitoring',
        'Error Tracking',
        'pass',
        'Error tracking is configured'
      );
    } else {
      this.addCheck(
        'monitoring',
        'Error Tracking',
        'warning',
        'Error tracking not configured',
        'warning'
      );
    }

    // Check logging configuration
    const loggingPath = path.join(process.cwd(), 'src/lib/logging');
    if (fs.existsSync(loggingPath)) {
      this.addCheck(
        'monitoring',
        'Logging System',
        'pass',
        'Logging system is implemented'
      );
    } else {
      this.addCheck(
        'monitoring',
        'Logging System',
        'warning',
        'Logging system not found',
        'warning'
      );
    }
  }

  /**
   * Generate readiness report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: this.checks.length,
        passed: this.passed,
        failed: this.failed,
        warnings: this.warnings,
        readyForProduction: this.failed === 0,
        riskLevel: this.calculateRiskLevel(),
      },
      checks: this.checks,
      recommendations: this.generateRecommendations(),
    };

    const reportPath = path.join(
      process.cwd(),
      'production-readiness-report.json'
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  calculateRiskLevel() {
    if (this.failed > 0) return 'high';
    if (this.warnings > 3) return 'medium';
    return 'low';
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.failed > 0) {
      recommendations.push(
        '🚨 Address all failed checks before deploying to production'
      );
    }

    if (this.warnings > 0) {
      recommendations.push(
        '⚠️ Review and address warning items to improve production readiness'
      );
    }

    recommendations.push('📊 Run performance tests before deployment');
    recommendations.push('🔒 Conduct final security review');
    recommendations.push('📋 Prepare rollback plan');
    recommendations.push('🔔 Set up monitoring and alerting');

    return recommendations;
  }

  /**
   * Run complete readiness check
   */
  async runCheck() {
    console.log('🚀 Starting production readiness check...\n');

    await this.checkCodeQuality();
    this.checkEnvironmentConfig();
    await this.checkSecurity();
    this.checkPerformance();
    await this.checkDatabase();
    this.checkDeploymentConfig();
    this.checkMonitoring();

    const report = this.generateReport();

    console.log('\n📊 Production Readiness Results:');
    console.log(`Total checks: ${report.summary.totalChecks}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Risk Level: ${report.summary.riskLevel}`);

    if (report.summary.readyForProduction) {
      console.log('\n✅ System is ready for production deployment!');
    } else {
      console.log('\n❌ System is NOT ready for production deployment');
      console.log('Please address the failed checks before proceeding.');
    }

    // Display failed checks
    const failedChecks = this.checks.filter(check => check.status === 'fail');
    if (failedChecks.length > 0) {
      console.log('\n🚨 Failed Checks:');
      failedChecks.forEach(check => {
        console.log(`  - ${check.category}: ${check.name} - ${check.message}`);
      });
    }

    // Display warnings
    const warningChecks = this.checks.filter(
      check => check.status === 'warning'
    );
    if (warningChecks.length > 0) {
      console.log('\n⚠️ Warnings:');
      warningChecks.forEach(check => {
        console.log(`  - ${check.category}: ${check.name} - ${check.message}`);
      });
    }

    console.log(
      `\n📄 Detailed report saved to: production-readiness-report.json`
    );

    return report.summary.readyForProduction;
  }
}

// Run readiness check if called directly
if (require.main === module) {
  const checker = new ProductionReadinessChecker();
  checker
    .runCheck()
    .then(ready => {
      process.exit(ready ? 0 : 1);
    })
    .catch(error => {
      console.error('Production readiness check failed:', error);
      process.exit(1);
    });
}

module.exports = ProductionReadinessChecker;
