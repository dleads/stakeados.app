#!/usr/bin/env node

/**
 * Deployment Script for Content Management System
 * Handles the complete deployment process with validation and rollback capabilities
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { RollbackManager } = require('./rollback');
const { HealthChecker } = require('./health-check');

class DeploymentManager {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.rollbackManager = new RollbackManager();
    this.deploymentId = `deploy-${Date.now()}`;
    this.startTime = Date.now();
    this.deploymentSteps = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: '📝',
        success: '✅',
        error: '❌',
        warning: '⚠️',
      }[type] || '📝';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  recordStep(step, status, message, metadata = {}) {
    this.deploymentSteps.push({
      step,
      status,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  async validatePrerequisites() {
    this.log('Validating deployment prerequisites...', 'info');

    const checks = [
      {
        name: 'Environment variables',
        check: () => {
          const required = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY',
            'OPENAI_API_KEY',
            'REDIS_URL',
          ];

          const missing = required.filter(env => !process.env[env]);
          if (missing.length > 0) {
            throw new Error(
              `Missing environment variables: ${missing.join(', ')}`
            );
          }
          return true;
        },
      },
      {
        name: 'Node.js version',
        check: () => {
          const version = process.version;
          const major = parseInt(version.slice(1).split('.')[0]);
          if (major < 18) {
            throw new Error(
              `Node.js version ${version} is not supported. Minimum version: 18.x`
            );
          }
          return true;
        },
      },
      {
        name: 'Build artifacts',
        check: () => {
          const buildDir = path.join(__dirname, '../../.next');
          if (!fs.existsSync(buildDir)) {
            throw new Error(
              'Build artifacts not found. Run "npm run build" first.'
            );
          }
          return true;
        },
      },
      {
        name: 'Database connectivity',
        check: async () => {
          const { checkDatabase } = require('./health-check');
          return await checkDatabase();
        },
      },
    ];

    for (const check of checks) {
      try {
        await check.check();
        this.log(`✓ ${check.name}`, 'success');
        this.recordStep('prerequisite', 'success', check.name);
      } catch (error) {
        this.log(`✗ ${check.name}: ${error.message}`, 'error');
        this.recordStep('prerequisite', 'failed', check.name, {
          error: error.message,
        });
        throw new Error(`Prerequisite check failed: ${check.name}`);
      }
    }

    return true;
  }

  async runDatabaseMigrations() {
    this.log('Running database migrations...', 'info');

    try {
      // Check current migration status
      execSync('npx supabase db diff --schema public', { stdio: 'pipe' });

      // Apply pending migrations
      execSync('npx supabase db push', { stdio: 'inherit' });

      this.log('Database migrations completed successfully', 'success');
      this.recordStep('database', 'success', 'Migrations applied');

      return true;
    } catch (error) {
      this.log(`Database migration failed: ${error.message}`, 'error');
      this.recordStep('database', 'failed', 'Migration failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async deployApplication() {
    this.log('Deploying application...', 'info');

    try {
      const version = process.env.GITHUB_SHA || `local-${Date.now()}`;
      const dockerImage = `ghcr.io/stakeados/content-management:${version}`;

      if (process.env.DEPLOYMENT_TYPE === 'kubernetes') {
        // Kubernetes deployment
        execSync(
          `kubectl set image deployment/content-management app=${dockerImage}`,
          {
            stdio: 'inherit',
          }
        );

        execSync(
          'kubectl rollout status deployment/content-management --timeout=600s',
          {
            stdio: 'inherit',
          }
        );
      } else if (process.env.DEPLOYMENT_TYPE === 'docker-swarm') {
        // Docker Swarm deployment
        execSync(
          `docker service update --image ${dockerImage} content-management`,
          {
            stdio: 'inherit',
          }
        );
      } else {
        // Local or custom deployment
        this.log('Custom deployment logic would run here', 'info');
      }

      this.log('Application deployed successfully', 'success');
      this.recordStep('application', 'success', 'Application deployed', {
        dockerImage,
        version,
      });

      return { dockerImage, version };
    } catch (error) {
      this.log(`Application deployment failed: ${error.message}`, 'error');
      this.recordStep('application', 'failed', 'Deployment failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async warmupCache() {
    this.log('Warming up cache...', 'info');

    try {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL);

      // Warm up critical cache entries
      const warmupTasks = [
        // Categories
        async () => {
          const response = await fetch(
            `${process.env.HEALTH_CHECK_URL}/api/admin/categories`
          );
          if (response.ok) {
            this.log('✓ Categories cache warmed up', 'success');
          }
        },

        // Popular articles
        async () => {
          const response = await fetch(
            `${process.env.HEALTH_CHECK_URL}/api/articles?limit=20&sort=popular`
          );
          if (response.ok) {
            this.log('✓ Popular articles cache warmed up', 'success');
          }
        },

        // Trending news
        async () => {
          const response = await fetch(
            `${process.env.HEALTH_CHECK_URL}/api/news/trending`
          );
          if (response.ok) {
            this.log('✓ Trending news cache warmed up', 'success');
          }
        },
      ];

      await Promise.all(
        warmupTasks.map(task =>
          task().catch(err =>
            this.log(`Cache warmup task failed: ${err.message}`, 'warning')
          )
        )
      );

      redis.disconnect();

      this.log('Cache warmup completed', 'success');
      this.recordStep('cache', 'success', 'Cache warmed up');

      return true;
    } catch (error) {
      this.log(`Cache warmup failed: ${error.message}`, 'warning');
      this.recordStep('cache', 'warning', 'Cache warmup failed', {
        error: error.message,
      });
      // Don't fail deployment for cache warmup issues
      return false;
    }
  }

  async runHealthChecks() {
    this.log('Running post-deployment health checks...', 'info');

    try {
      const healthChecker = new HealthChecker(
        process.env.HEALTH_CHECK_URL || 'http://localhost:3000'
      );

      const healthResult = await healthChecker.runHealthChecks();

      if (healthResult.healthy) {
        this.log('Health checks passed', 'success');
        this.recordStep('health-check', 'success', 'All health checks passed', {
          successRate: healthResult.successRate,
          averageResponseTime: healthResult.summary.averageResponseTime,
        });
        return true;
      } else {
        this.log(
          `Health checks failed (${healthResult.successRate}% success rate)`,
          'error'
        );
        this.recordStep('health-check', 'failed', 'Health checks failed', {
          successRate: healthResult.successRate,
          failedChecks: healthResult.results.filter(r => !r.success).length,
        });
        return false;
      }
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      this.recordStep('health-check', 'failed', 'Health check error', {
        error: error.message,
      });
      return false;
    }
  }

  async performDeployment() {
    this.log(`Starting deployment to ${this.environment}`, 'info');
    this.log(`Deployment ID: ${this.deploymentId}`, 'info');
    this.log('='.repeat(60), 'info');

    let deploymentMetadata = {};
    let rollbackRequired = false;

    try {
      // Step 1: Validate prerequisites
      await this.validatePrerequisites();

      // Step 2: Run database migrations
      await this.runDatabaseMigrations();
      deploymentMetadata.databaseMigration = 'latest';

      // Step 3: Deploy application
      const appDeployment = await this.deployApplication();
      deploymentMetadata.dockerImage = appDeployment.dockerImage;
      deploymentMetadata.version = appDeployment.version;

      // Step 4: Warm up cache
      await this.warmupCache();

      // Step 5: Run health checks
      const healthPassed = await this.runHealthChecks();

      if (!healthPassed) {
        rollbackRequired = true;
        throw new Error('Health checks failed after deployment');
      }

      // Step 6: Record successful deployment
      this.rollbackManager.recordDeployment(
        deploymentMetadata.version,
        this.environment,
        deploymentMetadata
      );

      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
      this.log(`Deployment completed successfully in ${duration}s`, 'success');

      this.generateDeploymentReport(true);
      return true;
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');

      if (rollbackRequired && !process.env.SKIP_ROLLBACK) {
        this.log('Initiating automatic rollback...', 'warning');

        try {
          const rollbackSuccess = await this.rollbackManager.performRollback(
            this.environment,
            { skipHealthCheck: true }
          );

          if (rollbackSuccess) {
            this.log('Automatic rollback completed successfully', 'success');
          } else {
            this.log(
              'Automatic rollback failed - manual intervention required',
              'error'
            );
          }
        } catch (rollbackError) {
          this.log(`Rollback failed: ${rollbackError.message}`, 'error');
        }
      }

      this.generateDeploymentReport(false, error);
      throw error;
    }
  }

  generateDeploymentReport(success, error = null) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n📊 Deployment Report:');
    console.log('='.repeat(60));
    console.log(`🆔 Deployment ID: ${this.deploymentId}`);
    console.log(`🌍 Environment: ${this.environment}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`🏁 Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n📋 Deployment Steps:');
    console.log('-'.repeat(60));

    this.deploymentSteps.forEach(step => {
      const status =
        {
          success: '✅',
          failed: '❌',
          warning: '⚠️',
        }[step.status] || '📝';

      console.log(`${status} ${step.step}: ${step.message}`);
    });

    console.log('='.repeat(60));

    if (success) {
      console.log('🎉 Deployment completed successfully!');
      console.log('🔍 Monitor the application for any issues.');
    } else {
      console.log('💥 Deployment failed!');
      console.log('📞 Check logs and contact the development team if needed.');
    }

    // Save report to file
    const report = {
      deploymentId: this.deploymentId,
      environment: this.environment,
      success,
      duration: parseFloat(duration),
      error: error ? error.message : null,
      steps: this.deploymentSteps,
      timestamp: new Date().toISOString(),
    };

    const reportPath = path.join(
      __dirname,
      `../../deployment-reports/${this.deploymentId}.json`
    );

    try {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Deployment report saved to: ${reportPath}`);
    } catch (err) {
      console.warn(`⚠️  Could not save deployment report: ${err.message}`);
    }
  }
}

async function main() {
  const environment = process.argv[2] || process.env.NODE_ENV || 'staging';

  // Load environment-specific configuration
  const envFile = path.join(
    __dirname,
    `../../config/environments/${environment}.env`
  );
  if (fs.existsSync(envFile)) {
    require('dotenv').config({ path: envFile });
  }

  const deploymentManager = new DeploymentManager(environment);

  try {
    await deploymentManager.performDeployment();
    process.exit(0);
  } catch (error) {
    console.error('💥 Deployment process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DeploymentManager };
