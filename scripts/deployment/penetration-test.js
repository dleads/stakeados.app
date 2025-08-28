#!/usr/bin/env node

/**
 * Automated penetration testing script for Stakeados admin system
 * Tests common web application vulnerabilities
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class PenetrationTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.findings = [];
    this.testResults = [];
  }

  addFinding(severity, category, title, description, evidence) {
    this.findings.push({
      severity,
      category,
      title,
      description,
      evidence,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Make HTTP request with custom options
   */
  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Stakeados-Security-Scanner/1.0',
          ...options.headers,
        },
        timeout: 10000,
      };

      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(requestOptions, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Test for SQL injection vulnerabilities
   */
  async testSqlInjection() {
    console.log('🔍 Testing for SQL injection vulnerabilities...');

    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' OR 1=1 --",
      "admin'--",
      "' OR 1=1#",
    ];

    const testEndpoints = [
      '/api/admin/articles',
      '/api/admin/news',
      '/api/admin/users',
      '/api/admin/categories',
    ];

    for (const endpoint of testEndpoints) {
      for (const payload of sqlPayloads) {
        try {
          // Test in query parameters
          const response = await this.makeRequest(
            `${endpoint}?id=${encodeURIComponent(payload)}`
          );

          if (
            response.body.includes('SQL') ||
            response.body.includes('mysql') ||
            response.body.includes('postgres') ||
            response.body.includes('syntax error')
          ) {
            this.addFinding(
              'critical',
              'injection',
              'SQL Injection vulnerability detected',
              `Endpoint ${endpoint} appears vulnerable to SQL injection`,
              `Payload: ${payload}, Response: ${response.body.substring(0, 200)}`
            );
          }

          // Test in POST body
          if (endpoint.includes('/api/')) {
            const postResponse = await this.makeRequest(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ search: payload }),
            });

            if (
              postResponse.body.includes('SQL') ||
              postResponse.body.includes('mysql') ||
              postResponse.body.includes('postgres')
            ) {
              this.addFinding(
                'critical',
                'injection',
                'SQL Injection in POST body',
                `Endpoint ${endpoint} vulnerable to SQL injection in POST data`,
                `Payload: ${payload}`
              );
            }
          }
        } catch (error) {
          // Continue testing other payloads
        }
      }
    }
  }

  /**
   * Test for XSS vulnerabilities
   */
  async testXssVulnerabilities() {
    console.log('🔍 Testing for XSS vulnerabilities...');

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      "';alert('XSS');//",
    ];

    const testEndpoints = [
      '/es/admin/articles',
      '/es/admin/news',
      '/es/admin/search',
    ];

    for (const endpoint of testEndpoints) {
      for (const payload of xssPayloads) {
        try {
          const response = await this.makeRequest(
            `${endpoint}?q=${encodeURIComponent(payload)}`
          );

          if (
            response.body.includes(payload) &&
            !response.body.includes('&lt;script&gt;')
          ) {
            this.addFinding(
              'high',
              'xss',
              'Reflected XSS vulnerability',
              `Endpoint ${endpoint} reflects unescaped user input`,
              `Payload: ${payload}`
            );
          }
        } catch (error) {
          // Continue testing
        }
      }
    }
  }

  /**
   * Test authentication and authorization
   */
  async testAuthenticationBypass() {
    console.log('🔍 Testing authentication and authorization...');

    const adminEndpoints = [
      '/api/admin/articles',
      '/api/admin/users',
      '/api/admin/settings',
      '/api/admin/analytics',
    ];

    // Test without authentication
    for (const endpoint of adminEndpoints) {
      try {
        const response = await this.makeRequest(endpoint);

        if (response.statusCode === 200) {
          this.addFinding(
            'critical',
            'authentication',
            'Unauthenticated access to admin endpoint',
            `Admin endpoint ${endpoint} accessible without authentication`,
            `Status: ${response.statusCode}`
          );
        }
      } catch (error) {
        // Expected for protected endpoints
      }
    }

    // Test with invalid tokens
    const invalidTokens = [
      'Bearer invalid_token',
      // Use a placeholder that is clearly not a real JWT to avoid secret scanners
      'Bearer <jwt-placeholder>.invalid',
      'Bearer null',
      'Bearer undefined',
    ];

    for (const endpoint of adminEndpoints) {
      for (const token of invalidTokens) {
        try {
          const response = await this.makeRequest(endpoint, {
            headers: { Authorization: token },
          });

          if (response.statusCode === 200) {
            this.addFinding(
              'high',
              'authentication',
              'Invalid token accepted',
              `Endpoint ${endpoint} accepts invalid authentication token`,
              `Token: ${token}, Status: ${response.statusCode}`
            );
          }
        } catch (error) {
          // Continue testing
        }
      }
    }
  }

  /**
   * Test for directory traversal
   */
  async testDirectoryTraversal() {
    console.log('🔍 Testing for directory traversal vulnerabilities...');

    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
    ];

    const testEndpoints = [
      '/api/admin/files',
      '/api/admin/upload',
      '/api/admin/export',
    ];

    for (const endpoint of testEndpoints) {
      for (const payload of traversalPayloads) {
        try {
          const response = await this.makeRequest(
            `${endpoint}?file=${encodeURIComponent(payload)}`
          );

          if (
            response.body.includes('root:') ||
            response.body.includes('localhost') ||
            response.body.includes('# Copyright')
          ) {
            this.addFinding(
              'critical',
              'traversal',
              'Directory traversal vulnerability',
              `Endpoint ${endpoint} vulnerable to directory traversal`,
              `Payload: ${payload}`
            );
          }
        } catch (error) {
          // Continue testing
        }
      }
    }
  }

  /**
   * Test for CSRF vulnerabilities
   */
  async testCsrfProtection() {
    console.log('🔍 Testing CSRF protection...');

    const stateChangingEndpoints = [
      { path: '/api/admin/articles', method: 'POST' },
      { path: '/api/admin/users', method: 'POST' },
      { path: '/api/admin/settings', method: 'PUT' },
      { path: '/api/admin/articles/1', method: 'DELETE' },
    ];

    for (const { path, method } of stateChangingEndpoints) {
      try {
        const response = await this.makeRequest(path, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://malicious-site.com',
          },
          body: JSON.stringify({ test: 'csrf' }),
        });

        // Check if request was processed without CSRF token
        if (response.statusCode < 400) {
          this.addFinding(
            'medium',
            'csrf',
            'Missing CSRF protection',
            `Endpoint ${path} may be vulnerable to CSRF attacks`,
            `Method: ${method}, Status: ${response.statusCode}`
          );
        }
      } catch (error) {
        // Continue testing
      }
    }
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders() {
    console.log('🔍 Testing security headers...');

    try {
      const response = await this.makeRequest('/');
      const headers = response.headers;

      const requiredHeaders = {
        'x-frame-options': 'Clickjacking protection',
        'x-content-type-options': 'MIME type sniffing protection',
        'x-xss-protection': 'XSS protection',
        'strict-transport-security': 'HTTPS enforcement',
        'content-security-policy': 'Content Security Policy',
      };

      for (const [header, description] of Object.entries(requiredHeaders)) {
        if (!headers[header]) {
          this.addFinding(
            'medium',
            'headers',
            `Missing security header: ${header}`,
            `${description} header is not set`,
            'Add security headers to prevent common attacks'
          );
        }
      }

      // Check for information disclosure headers
      const dangerousHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];
      for (const header of dangerousHeaders) {
        if (headers[header]) {
          this.addFinding(
            'low',
            'headers',
            `Information disclosure: ${header}`,
            `Header ${header} reveals server information`,
            `Remove or obfuscate the ${header} header`
          );
        }
      }
    } catch (error) {
      console.warn('Could not test security headers:', error.message);
    }
  }

  /**
   * Test for sensitive information exposure
   */
  async testInformationDisclosure() {
    console.log('🔍 Testing for information disclosure...');

    const sensitiveEndpoints = [
      '/.env',
      '/package.json',
      '/.git/config',
      '/admin',
      '/debug',
      '/test',
      '/.well-known/security.txt',
      '/robots.txt',
      '/sitemap.xml',
    ];

    for (const endpoint of sensitiveEndpoints) {
      try {
        const response = await this.makeRequest(endpoint);

        if (response.statusCode === 200) {
          if (endpoint === '/.env' || endpoint === '/package.json') {
            this.addFinding(
              'high',
              'disclosure',
              `Sensitive file exposed: ${endpoint}`,
              `File ${endpoint} is publicly accessible`,
              'Ensure sensitive files are not served by the web server'
            );
          } else if (
            response.body.includes('password') ||
            response.body.includes('secret') ||
            response.body.includes('key')
          ) {
            this.addFinding(
              'medium',
              'disclosure',
              `Potential sensitive information in ${endpoint}`,
              `Endpoint ${endpoint} may contain sensitive information`,
              'Review and sanitize publicly accessible content'
            );
          }
        }
      } catch (error) {
        // Continue testing
      }
    }
  }

  /**
   * Generate penetration test report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      target: this.baseUrl,
      summary: {
        totalFindings: this.findings.length,
        critical: this.findings.filter(f => f.severity === 'critical').length,
        high: this.findings.filter(f => f.severity === 'high').length,
        medium: this.findings.filter(f => f.severity === 'medium').length,
        low: this.findings.filter(f => f.severity === 'low').length,
      },
      findings: this.findings,
      recommendations: [
        'Implement proper input validation and sanitization',
        'Use parameterized queries to prevent SQL injection',
        'Implement CSRF protection for state-changing operations',
        'Add comprehensive security headers',
        'Ensure proper authentication and authorization checks',
        'Regular security testing and code reviews',
      ],
    };

    const reportPath = path.join(process.cwd(), 'penetration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Run complete penetration test suite
   */
  async runTests() {
    console.log('🔒 Starting penetration testing...\n');

    try {
      await this.testSqlInjection();
      await this.testXssVulnerabilities();
      await this.testAuthenticationBypass();
      await this.testDirectoryTraversal();
      await this.testCsrfProtection();
      await this.testSecurityHeaders();
      await this.testInformationDisclosure();

      const report = this.generateReport();

      console.log('\n📊 Penetration Test Results:');
      console.log(`Target: ${this.baseUrl}`);
      console.log(`Total findings: ${report.summary.totalFindings}`);
      console.log(`Critical: ${report.summary.critical}`);
      console.log(`High: ${report.summary.high}`);
      console.log(`Medium: ${report.summary.medium}`);
      console.log(`Low: ${report.summary.low}`);

      if (report.summary.critical > 0) {
        console.log('\n🚨 CRITICAL VULNERABILITIES FOUND - DO NOT DEPLOY');
        return false;
      } else if (report.summary.high > 0) {
        console.log(
          '\n⚠️ High-severity vulnerabilities found - Address before deployment'
        );
        return false;
      } else {
        console.log('\n✅ No critical or high-severity vulnerabilities found');
        return true;
      }
    } catch (error) {
      console.error('Penetration testing failed:', error);
      return false;
    }
  }
}

// Run penetration tests if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const tester = new PenetrationTester(baseUrl);

  tester
    .runTests()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Penetration testing failed:', error);
      process.exit(1);
    });
}

module.exports = PenetrationTester;
