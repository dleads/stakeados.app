#!/usr/bin/env node

/**
 * Health Check Script for Content Management System
 * Validates critical endpoints and services after deployment
 */

const https = require('https');
const http = require('http');
const path = require('path');

// Load environment variables from .env.local (or custom path) at startup
try {
  const dotenv = require('dotenv');
  const envPath =
    process.env.dotenv_config_path || path.join(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (e) {
  // dotenv is optional; proceed if not available
}

class HealthChecker {
  constructor(baseUrl, timeout = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.results = [];
  }

  async checkEndpoint(path, expectedStatus = 200, method = 'GET') {
    return new Promise(resolve => {
      const url = `${this.baseUrl}${path}`;
      const client = url.startsWith('https') ? https : http;

      const req = client.request(
        url,
        { method, timeout: this.timeout },
        res => {
          const success = res.statusCode === expectedStatus;
          const result = {
            endpoint: path,
            status: res.statusCode,
            expected: expectedStatus,
            success,
            responseTime: Date.now() - startTime,
          };

          this.results.push(result);
          resolve(result);
        }
      );

      const startTime = Date.now();

      req.on('error', error => {
        const result = {
          endpoint: path,
          status: 'ERROR',
          expected: expectedStatus,
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime,
        };

        this.results.push(result);
        resolve(result);
      });

      req.on('timeout', () => {
        req.destroy();
        const result = {
          endpoint: path,
          status: 'TIMEOUT',
          expected: expectedStatus,
          success: false,
          error: 'Request timeout',
          responseTime: this.timeout,
        };

        this.results.push(result);
        resolve(result);
      });

      req.end();
    });
  }

  async runHealthChecks() {
    console.log(`🏥 Running health checks for ${this.baseUrl}`);
    console.log('='.repeat(50));

    // Critical content management endpoints
    const checks = [
      // API Health
      { path: '/api/health', status: 200 },
      { path: '/api/articles', status: 200 },
      { path: '/api/news', status: 200 },

      // Article Management
      { path: '/api/articles/proposals', status: 401 }, // Should require auth
      { path: '/api/admin/articles', status: 401 }, // Should require auth

      // News Aggregation
      { path: '/api/news/trending', status: 200 },
      { path: '/api/news/personalized', status: 401 }, // Should require auth

      // AI Services
      { path: '/api/ai/suggest-tags', status: 405, method: 'GET' }, // Should be POST only

      // Content Categories and Tags
      { path: '/api/admin/categories', status: 401 }, // Should require auth
      { path: '/api/admin/tags', status: 401 }, // Should require auth

      // Analytics
      { path: '/api/analytics/dashboard', status: 401 }, // Should require auth

      // Notifications
      { path: '/api/notifications', status: 401 }, // Should require auth

      // Gamification
      { path: '/api/gamification/stats', status: 401 }, // Should require auth

      // Performance endpoints
      { path: '/api/admin/performance', status: 401 }, // Should require auth
    ];

    const results = await Promise.all(
      checks.map(check =>
        this.checkEndpoint(check.path, check.status, check.method)
      )
    );

    return this.generateReport(results);
  }

  generateReport(results) {
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = ((successful / total) * 100).toFixed(2);

    console.log('\n📊 Health Check Results:');
    console.log('-'.repeat(50));

    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const responseTime = result.responseTime
        ? `(${result.responseTime}ms)`
        : '';
      console.log(
        `${status} ${result.endpoint} - ${result.status} ${responseTime}`
      );

      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('-'.repeat(50));
    console.log(`📈 Success Rate: ${successful}/${total} (${successRate}%)`);

    const avgResponseTime =
      results
        .filter(r => r.responseTime && r.success)
        .reduce((sum, r) => sum + r.responseTime, 0) / successful;

    if (avgResponseTime) {
      console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    }

    const isHealthy = successRate >= 90;
    console.log(
      `🏥 Overall Health: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`
    );

    return {
      healthy: isHealthy,
      successRate: parseFloat(successRate),
      results,
      summary: {
        total,
        successful,
        failed: total - successful,
        averageResponseTime: avgResponseTime || 0,
      },
    };
  }
}

// Database connectivity check
async function checkDatabase() {
  console.log('\n🗄️  Checking database connectivity...');

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test basic query
    const { data, error } = await supabase
      .from('articles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
    return false;
  }
}

// Redis connectivity check
async function checkRedis() {
  console.log('\n🔴 Checking Redis connectivity...');

  try {
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL);

    await redis.ping();
    console.log('✅ Redis connection successful');

    redis.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
    return false;
  }
}

// AI Services check
async function checkAIServices() {
  console.log('\n🤖 Checking AI services...');

  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test with a simple completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5,
    });

    if (response.choices && response.choices.length > 0) {
      console.log('✅ OpenAI API connection successful');
      return true;
    }

    console.log('❌ OpenAI API response invalid');
    return false;
  } catch (error) {
    console.log('❌ OpenAI API connection failed:', error.message);
    return false;
  }
}

async function main() {
  const baseUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:3000';

  console.log('🚀 Starting Content Management System Health Check');
  console.log(`🌐 Target URL: ${baseUrl}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  const healthChecker = new HealthChecker(baseUrl);

  try {
    // Run all health checks
    const [apiHealth, dbHealth, redisHealth, aiHealth] = await Promise.all([
      healthChecker.runHealthChecks(),
      checkDatabase(),
      checkRedis(),
      checkAIServices(),
    ]);

    const overallHealth =
      apiHealth.healthy && dbHealth && redisHealth && aiHealth;

    console.log('\n🏁 Final Health Check Summary:');
    console.log('='.repeat(50));
    console.log(
      `🌐 API Endpoints: ${apiHealth.healthy ? '✅' : '❌'} (${apiHealth.successRate}%)`
    );
    console.log(`🗄️  Database: ${dbHealth ? '✅' : '❌'}`);
    console.log(`🔴 Redis: ${redisHealth ? '✅' : '❌'}`);
    console.log(`🤖 AI Services: ${aiHealth ? '✅' : '❌'}`);
    console.log('='.repeat(50));
    console.log(
      `🏥 Overall System Health: ${overallHealth ? '✅ HEALTHY' : '❌ UNHEALTHY'}`
    );

    // Exit with appropriate code
    process.exit(overallHealth ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { HealthChecker, checkDatabase, checkRedis, checkAIServices };
