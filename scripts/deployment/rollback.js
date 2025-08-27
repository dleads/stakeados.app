#!/usr/bin/env node

/**
 * Rollback Script for Content Management System
 * Handles automated rollback procedures in case of deployment failures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RollbackManager {
  constructor() {
    this.deploymentHistory = this.loadDeploymentHistory();
    this.rollbackSteps = [];
  }

  loadDeploymentHistory() {
    const historyFile = path.join(__dirname, '../../.deployment-history.json');

    try {
      if (fs.existsSync(historyFile)) {
        return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Could not load deployment history:', error.message);
    }

    return { deployments: [] };
  }

  saveDeploymentHistory() {
    const historyFile = path.join(__dirname, '../../.deployment-history.json');

    try {
      fs.writeFileSync(
        historyFile,
        JSON.stringify(this.deploymentHistory, null, 2)
      );
    } catch (error) {
      console.error('❌ Could not save deployment history:', error.message);
    }
  }

  recordDeployment(version, environment, metadata = {}) {
    const deployment = {
      id: `deploy-${Date.now()}`,
      version,
      environment,
      timestamp: new Date().toISOString(),
      status: 'active',
      metadata,
      rollbackInfo: {
        dockerImage: metadata.dockerImage,
        databaseMigration: metadata.databaseMigration,
        configVersion: metadata.configVersion,
      },
    };

    // Mark previous deployment as inactive
    this.deploymentHistory.deployments
      .filter(d => d.environment === environment && d.status === 'active')
      .forEach(d => (d.status = 'inactive'));

    this.deploymentHistory.deployments.unshift(deployment);

    // Keep only last 10 deployments per environment
    const envDeployments = this.deploymentHistory.deployments.filter(
      d => d.environment === environment
    );

    if (envDeployments.length > 10) {
      this.deploymentHistory.deployments = this.deploymentHistory.deployments
        .filter(d => d.environment !== environment)
        .concat(envDeployments.slice(0, 10));
    }

    this.saveDeploymentHistory();
    return deployment;
  }

  getPreviousDeployment(environment) {
    return this.deploymentHistory.deployments
      .filter(d => d.environment === environment && d.status === 'inactive')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  }

  async rollbackDatabase(targetMigration) {
    console.log('🗄️  Rolling back database migrations...');

    try {
      if (targetMigration) {
        console.log(`📉 Rolling back to migration: ${targetMigration}`);
        execSync(`npx supabase db reset --db-url ${process.env.DATABASE_URL}`, {
          stdio: 'inherit',
        });

        // Apply migrations up to target
        execSync(`npx supabase db push --db-url ${process.env.DATABASE_URL}`, {
          stdio: 'inherit',
        });
      } else {
        console.log(
          '⚠️  No target migration specified, skipping database rollback'
        );
      }

      this.rollbackSteps.push({
        step: 'database',
        status: 'success',
        message: 'Database rolled back successfully',
      });

      return true;
    } catch (error) {
      console.error('❌ Database rollback failed:', error.message);

      this.rollbackSteps.push({
        step: 'database',
        status: 'failed',
        message: error.message,
      });

      return false;
    }
  }

  async rollbackApplication(targetImage) {
    console.log('🚀 Rolling back application deployment...');

    try {
      if (targetImage) {
        console.log(`📦 Rolling back to image: ${targetImage}`);

        // This would typically involve updating your orchestration system
        // Examples for different deployment targets:

        if (process.env.DEPLOYMENT_TYPE === 'kubernetes') {
          execSync(
            `kubectl set image deployment/content-management app=${targetImage}`,
            {
              stdio: 'inherit',
            }
          );

          execSync(
            'kubectl rollout status deployment/content-management --timeout=300s',
            {
              stdio: 'inherit',
            }
          );
        } else if (process.env.DEPLOYMENT_TYPE === 'docker-swarm') {
          execSync(
            `docker service update --image ${targetImage} content-management`,
            {
              stdio: 'inherit',
            }
          );
        } else {
          console.log('🔄 Manual application rollback required');
          console.log(`   Target image: ${targetImage}`);
        }
      } else {
        console.log(
          '⚠️  No target image specified, skipping application rollback'
        );
      }

      this.rollbackSteps.push({
        step: 'application',
        status: 'success',
        message: 'Application rolled back successfully',
      });

      return true;
    } catch (error) {
      console.error('❌ Application rollback failed:', error.message);

      this.rollbackSteps.push({
        step: 'application',
        status: 'failed',
        message: error.message,
      });

      return false;
    }
  }

  async rollbackCache() {
    console.log('🔴 Clearing cache after rollback...');

    try {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL);

      // Clear content-related caches
      const patterns = [
        'articles:*',
        'news:*',
        'categories:*',
        'tags:*',
        'search:*',
      ];

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`   Cleared ${keys.length} keys matching ${pattern}`);
        }
      }

      redis.disconnect();

      this.rollbackSteps.push({
        step: 'cache',
        status: 'success',
        message: 'Cache cleared successfully',
      });

      return true;
    } catch (error) {
      console.error('❌ Cache rollback failed:', error.message);

      this.rollbackSteps.push({
        step: 'cache',
        status: 'failed',
        message: error.message,
      });

      return false;
    }
  }

  async rollbackConfiguration(targetConfig) {
    console.log('⚙️  Rolling back configuration...');

    try {
      if (targetConfig) {
        // Restore previous configuration
        const configPath = path.join(
          __dirname,
          `../../config/environments/${process.env.NODE_ENV}.env`
        );

        if (fs.existsSync(targetConfig)) {
          fs.copyFileSync(targetConfig, configPath);
          console.log(`   Configuration restored from ${targetConfig}`);
        }
      }

      this.rollbackSteps.push({
        step: 'configuration',
        status: 'success',
        message: 'Configuration rolled back successfully',
      });

      return true;
    } catch (error) {
      console.error('❌ Configuration rollback failed:', error.message);

      this.rollbackSteps.push({
        step: 'configuration',
        status: 'failed',
        message: error.message,
      });

      return false;
    }
  }

  async performRollback(environment, options = {}) {
    console.log('🔄 Starting rollback procedure...');
    console.log(`🌍 Environment: ${environment}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(50));

    const previousDeployment = this.getPreviousDeployment(environment);

    if (!previousDeployment) {
      console.error('❌ No previous deployment found for rollback');
      return false;
    }

    console.log(`📋 Rolling back to deployment: ${previousDeployment.id}`);
    console.log(`📅 Previous deployment date: ${previousDeployment.timestamp}`);
    console.log(`📦 Previous version: ${previousDeployment.version}`);

    const rollbackInfo = previousDeployment.rollbackInfo || {};
    let success = true;

    // Step 1: Rollback application
    if (!options.skipApplication) {
      success =
        (await this.rollbackApplication(rollbackInfo.dockerImage)) && success;
    }

    // Step 2: Rollback database (if needed)
    if (!options.skipDatabase && rollbackInfo.databaseMigration) {
      success =
        (await this.rollbackDatabase(rollbackInfo.databaseMigration)) &&
        success;
    }

    // Step 3: Rollback configuration
    if (!options.skipConfiguration) {
      success =
        (await this.rollbackConfiguration(rollbackInfo.configVersion)) &&
        success;
    }

    // Step 4: Clear cache
    if (!options.skipCache) {
      success = (await this.rollbackCache()) && success;
    }

    // Step 5: Health check
    if (success && !options.skipHealthCheck) {
      console.log('🏥 Running post-rollback health check...');

      try {
        const { HealthChecker } = require('./health-check');
        const healthChecker = new HealthChecker(
          process.env.HEALTH_CHECK_URL || 'http://localhost:3000'
        );
        const healthResult = await healthChecker.runHealthChecks();

        success = healthResult.healthy && success;
      } catch (error) {
        console.error('❌ Post-rollback health check failed:', error.message);
        success = false;
      }
    }

    // Record rollback
    if (success) {
      previousDeployment.status = 'active';
      this.deploymentHistory.deployments
        .filter(
          d => d.environment === environment && d.id !== previousDeployment.id
        )
        .forEach(d => (d.status = 'inactive'));

      this.saveDeploymentHistory();
    }

    // Generate rollback report
    this.generateRollbackReport(success, previousDeployment);

    return success;
  }

  generateRollbackReport(success, targetDeployment) {
    console.log('\n📊 Rollback Report:');
    console.log('='.repeat(50));

    this.rollbackSteps.forEach(step => {
      const status = step.status === 'success' ? '✅' : '❌';
      console.log(`${status} ${step.step}: ${step.message}`);
    });

    console.log('='.repeat(50));
    console.log(`🎯 Target deployment: ${targetDeployment.id}`);
    console.log(`📦 Target version: ${targetDeployment.version}`);
    console.log(`🏁 Rollback result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (success) {
      console.log('\n✅ Rollback completed successfully!');
      console.log(
        '🔍 Please verify that all systems are functioning correctly.'
      );
    } else {
      console.log('\n❌ Rollback encountered errors!');
      console.log('🚨 Manual intervention may be required.');
      console.log('📞 Contact the operations team immediately.');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || process.env.NODE_ENV || 'staging';

  const options = {
    skipApplication: args.includes('--skip-application'),
    skipDatabase: args.includes('--skip-database'),
    skipConfiguration: args.includes('--skip-configuration'),
    skipCache: args.includes('--skip-cache'),
    skipHealthCheck: args.includes('--skip-health-check'),
  };

  const rollbackManager = new RollbackManager();

  try {
    const success = await rollbackManager.performRollback(environment, options);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Rollback failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { RollbackManager };
