#!/usr/bin/env node

/**
 * Security audit script for production deployment
 * Performs comprehensive security checks and vulnerability assessment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityAuditor {
  constructor() {
    this.findings = [];
    this.criticalIssues = 0;
    this.highIssues = 0;
    this.mediumIssues = 0;
    this.lowIssues = 0;
  }

  addFinding(severity, category, title, description, recommendation) {
    const finding = {
      severity,
      category,
      title,
      description,
      recommendation,
      timestamp: new Date().toISOString(),
    };

    this.findings.push(finding);

    switch (severity) {
      case 'critical':
        this.criticalIssues++;
        break;
      case 'high':
        this.highIssues++;
        break;
      case 'medium':
        this.mediumIssues++;
        break;
      case 'low':
        this.lowIssues++;
        break;
    }
  }

  /**
   * Check for hardcoded secrets and sensitive data
   */
  checkHardcodedSecrets() {
    console.log('🔍 Checking for hardcoded secrets...');

    const sensitivePatterns = [
      {
        pattern: /password\s*=\s*["'][^"']+["']/gi,
        name: 'Hardcoded Password',
      },
      { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi, name: 'API Key' },
      { pattern: /secret[_-]?key\s*=\s*["'][^"']+["']/gi, name: 'Secret Key' },
      {
        pattern: /private[_-]?key\s*=\s*["'][^"']+["']/gi,
        name: 'Private Key',
      },
      { pattern: /token\s*=\s*["'][^"']+["']/gi, name: 'Token' },
      // Evitar literales que activen secret scanners usando RegExp dinámicos
      { pattern: new RegExp('sk' + '-' + '[a-zA-Z0-9]{48}'), name: 'OpenAI API Key' },
      {
        pattern: new RegExp('xox' + 'b-' + '[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}'),
        name: 'Slack Bot Token',
      },
      { pattern: new RegExp('gh' + 'p_' + '[a-zA-Z0-9]{36}'), name: 'GitHub Personal Access Token' },
    ];

    const filesToCheck = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx',
      'pages/**/*.ts',
      'pages/**/*.tsx',
      'components/**/*.ts',
      'components/**/*.tsx',
    ];

    try {
      filesToCheck.forEach(pattern => {
        try {
          const files = execSync(
            `find . -path "./node_modules" -prune -o -name "${pattern.split('/').pop()}" -type f -print`,
            { encoding: 'utf8' }
          )
            .split('\n')
            .filter(file => file && !file.includes('node_modules'));

          files.forEach(file => {
            if (fs.existsSync(file)) {
              const content = fs.readFileSync(file, 'utf8');

              sensitivePatterns.forEach(({ pattern, name }) => {
                const matches = content.match(pattern);
                if (matches) {
                  this.addFinding(
                    'critical',
                    'secrets',
                    `${name} found in ${file}`,
                    `Potential hardcoded ${name.toLowerCase()} detected in source code`,
                    'Remove hardcoded secrets and use environment variables instead'
                  );
                }
              });
            }
          });
        } catch (error) {
          // Skip if pattern doesn't match any files
        }
      });
    } catch (error) {
      console.warn('Could not check for hardcoded secrets:', error.message);
    }
  }

  /**
   * Check environment variable security
   */
  checkEnvironmentSecurity() {
    console.log('🔍 Checking environment variable security...');

    // Check for insecure environment variables
    const insecureEnvPatterns = [
      { key: 'NODE_TLS_REJECT_UNAUTHORIZED', value: '0', severity: 'critical' },
      { key: 'DISABLE_SSL_VERIFY', value: 'true', severity: 'high' },
      { key: 'DEBUG', value: '*', severity: 'medium' },
    ];

    insecureEnvPatterns.forEach(({ key, value, severity }) => {
      if (process.env[key] === value) {
        this.addFinding(
          severity,
          'environment',
          `Insecure environment variable: ${key}`,
          `Environment variable ${key} is set to an insecure value: ${value}`,
          `Remove or change the ${key} environment variable for production`
        );
      }
    });

    // Check for missing security-related environment variables
    const requiredSecurityEnvs = [
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'CSRF_SECRET',
    ];

    requiredSecurityEnvs.forEach(envVar => {
      if (!process.env[envVar]) {
        this.addFinding(
          'high',
          'environment',
          `Missing security environment variable: ${envVar}`,
          `Required security environment variable ${envVar} is not set`,
          `Set the ${envVar} environment variable with a secure random value`
        );
      } else if (process.env[envVar].length < 32) {
        this.addFinding(
          'medium',
          'environment',
          `Weak ${envVar}`,
          `${envVar} should be at least 32 characters long`,
          `Generate a stronger ${envVar} with at least 32 characters`
        );
      }
    });
  }

  /**
   * Check dependency vulnerabilities
   */
  async checkDependencyVulnerabilities() {
    console.log('🔍 Checking dependency vulnerabilities...');

    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);

      if (audit.metadata && audit.metadata.vulnerabilities) {
        const { vulnerabilities } = audit.metadata;

        if (vulnerabilities.critical > 0) {
          this.addFinding(
            'critical',
            'dependencies',
            `${vulnerabilities.critical} critical vulnerabilities found`,
            'Critical security vulnerabilities detected in dependencies',
            'Run npm audit fix or update vulnerable packages immediately'
          );
        }

        if (vulnerabilities.high > 0) {
          this.addFinding(
            'high',
            'dependencies',
            `${vulnerabilities.high} high severity vulnerabilities found`,
            'High severity security vulnerabilities detected in dependencies',
            'Run npm audit fix or update vulnerable packages'
          );
        }

        if (vulnerabilities.moderate > 0) {
          this.addFinding(
            'medium',
            'dependencies',
            `${vulnerabilities.moderate} moderate vulnerabilities found`,
            'Moderate security vulnerabilities detected in dependencies',
            'Consider updating vulnerable packages'
          );
        }
      }
    } catch (error) {
      this.addFinding(
        'medium',
        'dependencies',
        'Could not run dependency audit',
        'npm audit command failed or returned non-zero exit code',
        'Manually review dependencies for known vulnerabilities'
      );
    }
  }

  /**
   * Check Next.js security configuration
   */
  checkNextJsSecurityConfig() {
    console.log('🔍 Checking Next.js security configuration...');

    try {
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      if (fs.existsSync(nextConfigPath)) {
        const configContent = fs.readFileSync(nextConfigPath, 'utf8');

        // Check for security headers
        if (!configContent.includes('headers()')) {
          this.addFinding(
            'medium',
            'configuration',
            'Missing security headers configuration',
            'Next.js configuration does not include security headers',
            'Add security headers in next.config.js headers() function'
          );
        }

        // Check for CSP
        if (!configContent.includes('Content-Security-Policy')) {
          this.addFinding(
            'medium',
            'configuration',
            'Missing Content Security Policy',
            'No Content Security Policy headers configured',
            'Implement CSP headers to prevent XSS attacks'
          );
        }

        // Check for HSTS
        if (!configContent.includes('Strict-Transport-Security')) {
          this.addFinding(
            'low',
            'configuration',
            'Missing HSTS header',
            'HTTP Strict Transport Security header not configured',
            'Add HSTS header to enforce HTTPS connections'
          );
        }

        // Check if source maps are disabled in production
        if (configContent.includes('productionBrowserSourceMaps: true')) {
          this.addFinding(
            'medium',
            'configuration',
            'Source maps enabled in production',
            'Browser source maps are enabled for production builds',
            'Disable productionBrowserSourceMaps for production'
          );
        }
      }
    } catch (error) {
      console.warn('Could not check Next.js configuration:', error.message);
    }
  }

  /**
   * Check API route security
   */
  checkApiRouteSecurity() {
    console.log('🔍 Checking API route security...');

    try {
      const apiDir = path.join(process.cwd(), 'src/app/api');
      if (fs.existsSync(apiDir)) {
        const checkDirectory = dir => {
          const files = fs.readdirSync(dir);

          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
              checkDirectory(filePath);
            } else if (file === 'route.ts' || file === 'route.js') {
              const content = fs.readFileSync(filePath, 'utf8');

              // Check for authentication
              if (
                !content.includes('auth') &&
                !content.includes('token') &&
                !content.includes('session')
              ) {
                this.addFinding(
                  'high',
                  'api-security',
                  `Potential unauthenticated API route: ${filePath}`,
                  'API route may not have proper authentication checks',
                  'Ensure all sensitive API routes have proper authentication'
                );
              }

              // Check for input validation
              if (
                !content.includes('validate') &&
                !content.includes('schema') &&
                !content.includes('zod')
              ) {
                this.addFinding(
                  'medium',
                  'api-security',
                  `Missing input validation: ${filePath}`,
                  'API route may not validate input data',
                  'Implement proper input validation for all API endpoints'
                );
              }

              // Check for rate limiting
              if (
                !content.includes('rateLimit') &&
                !content.includes('throttle')
              ) {
                this.addFinding(
                  'low',
                  'api-security',
                  `Missing rate limiting: ${filePath}`,
                  'API route does not appear to have rate limiting',
                  'Consider implementing rate limiting for API endpoints'
                );
              }
            }
          });
        };

        checkDirectory(apiDir);
      }
    } catch (error) {
      console.warn('Could not check API routes:', error.message);
    }
  }

  /**
   * Check for common security misconfigurations
   */
  checkSecurityMisconfigurations() {
    console.log('🔍 Checking for security misconfigurations...');

    // Check package.json for security issues
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8')
        );

        // Check for outdated Node.js version requirement
        if (packageJson.engines && packageJson.engines.node) {
          const nodeVersion = packageJson.engines.node.replace(/[^\d.]/g, '');
          const majorVersion = parseInt(nodeVersion.split('.')[0]);

          if (majorVersion < 18) {
            this.addFinding(
              'medium',
              'configuration',
              'Outdated Node.js version requirement',
              `Package.json specifies Node.js ${nodeVersion}, which may have security vulnerabilities`,
              'Update to Node.js 18 or later for security patches'
            );
          }
        }

        // Check for development dependencies in production
        if (packageJson.dependencies) {
          const devDeps = ['nodemon', 'webpack-dev-server', 'jest', 'eslint'];
          devDeps.forEach(dep => {
            if (packageJson.dependencies[dep]) {
              this.addFinding(
                'low',
                'configuration',
                `Development dependency in production: ${dep}`,
                'Development dependency found in production dependencies',
                `Move ${dep} to devDependencies`
              );
            }
          });
        }
      }
    } catch (error) {
      console.warn('Could not check package.json:', error.message);
    }

    // Check for .env files in version control
    try {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

        if (!gitignoreContent.includes('.env')) {
          this.addFinding(
            'high',
            'configuration',
            'Environment files not in .gitignore',
            '.env files may be committed to version control',
            'Add .env* to .gitignore to prevent committing secrets'
          );
        }
      }
    } catch (error) {
      console.warn('Could not check .gitignore:', error.message);
    }
  }

  /**
   * Generate security report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFindings: this.findings.length,
        critical: this.criticalIssues,
        high: this.highIssues,
        medium: this.mediumIssues,
        low: this.lowIssues,
        riskScore: this.calculateRiskScore(),
      },
      findings: this.findings,
      recommendations: this.generateRecommendations(),
    };

    const reportPath = path.join(process.cwd(), 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  calculateRiskScore() {
    // Calculate risk score based on findings
    return (
      this.criticalIssues * 10 +
      this.highIssues * 7 +
      this.mediumIssues * 4 +
      this.lowIssues * 1
    );
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.criticalIssues > 0) {
      recommendations.push(
        '🚨 CRITICAL: Address all critical security issues before deploying to production'
      );
    }

    if (this.highIssues > 0) {
      recommendations.push(
        '⚠️ HIGH: Resolve high-severity issues as soon as possible'
      );
    }

    recommendations.push(
      '🔒 Implement regular security audits and dependency updates'
    );
    recommendations.push(
      '🛡️ Consider implementing additional security measures like WAF and DDoS protection'
    );
    recommendations.push('📊 Set up security monitoring and alerting');

    return recommendations;
  }

  /**
   * Run complete security audit
   */
  async runAudit() {
    console.log('🔒 Starting comprehensive security audit...\n');

    this.checkHardcodedSecrets();
    this.checkEnvironmentSecurity();
    await this.checkDependencyVulnerabilities();
    this.checkNextJsSecurityConfig();
    this.checkApiRouteSecurity();
    this.checkSecurityMisconfigurations();

    const report = this.generateReport();

    console.log('\n📊 Security Audit Results:');
    console.log(`Total findings: ${report.summary.totalFindings}`);
    console.log(`Critical: ${report.summary.critical}`);
    console.log(`High: ${report.summary.high}`);
    console.log(`Medium: ${report.summary.medium}`);
    console.log(`Low: ${report.summary.low}`);
    console.log(`Risk Score: ${report.summary.riskScore}`);

    if (report.summary.critical > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND - DO NOT DEPLOY TO PRODUCTION');
      return false;
    } else if (report.summary.high > 0) {
      console.log(
        '\n⚠️ High-severity issues found - Review before production deployment'
      );
      return false;
    } else {
      console.log('\n✅ No critical or high-severity security issues found');
      return true;
    }
  }
}

// Run security audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor
    .runAudit()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Security audit failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityAuditor;
