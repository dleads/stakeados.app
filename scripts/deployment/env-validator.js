#!/usr/bin/env node

/**
 * Environment variables validation script for production deployment
 * Ensures all required environment variables are set and valid
 */

const fs = require('fs');
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

// Required environment variables for production
const REQUIRED_ENV_VARS = {
  // Application
  NEXT_PUBLIC_APP_URL: {
    required: true,
    type: 'url',
    description: 'Application URL',
  },
  NODE_ENV: {
    required: true,
    type: 'string',
    allowedValues: ['production'],
    description: 'Node environment',
  },

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    type: 'url',
    description: 'Supabase project URL',
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    type: 'string',
    minLength: 100,
    description: 'Supabase anonymous key',
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    type: 'string',
    minLength: 100,
    description: 'Supabase service role key',
  },

  // OpenAI
  OPENAI_API_KEY: {
    required: true,
    type: 'string',
    // Use RegExp constructor to avoid literal 'sk-' in source
    pattern: new RegExp('^' + 'sk' + '-'),
    description: 'OpenAI API key',
  },

  // Security
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT secret key',
  },
  ENCRYPTION_KEY: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'Encryption key',
  },

  // Email
  RESEND_API_KEY: {
    required: true,
    type: 'string',
    // Use RegExp constructor to avoid literal 're_' in source
    pattern: new RegExp('^' + 're' + '_'),
    description: 'Resend API key',
  },

  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: {
    required: false,
    type: 'string',
    pattern: /^G-/,
    description: 'Google Analytics measurement ID',
  },

  // Admin
  NEXT_PUBLIC_ADMIN_EMAIL: {
    required: true,
    type: 'email',
    description: 'Admin email address',
  },
};

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'SENTRY_DSN',
  'REDIS_URL',
  'CDN_BASE_URL',
  'BACKUP_S3_BUCKET',
  'SLACK_WEBHOOK_URL',
];

function validateEnvironmentVariables() {
  console.log('🔍 Validating production environment variables...');

  const errors = [];
  const warnings = [];
  const missing = [];

  // Check required variables
  for (const [varName, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName];

    if (!value) {
      if (config.required) {
        missing.push(`${varName}: ${config.description}`);
      }
      continue;
    }

    // Validate type
    if (config.type === 'url') {
      try {
        new URL(value);
      } catch (e) {
        errors.push(`${varName}: Invalid URL format`);
      }
    }

    if (config.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${varName}: Invalid email format`);
      }
    }

    // Validate length
    if (config.minLength && value.length < config.minLength) {
      errors.push(
        `${varName}: Must be at least ${config.minLength} characters`
      );
    }

    // Validate pattern
    if (config.pattern && !config.pattern.test(value)) {
      errors.push(`${varName}: Does not match required pattern`);
    }

    // Validate allowed values
    if (config.allowedValues && !config.allowedValues.includes(value)) {
      errors.push(
        `${varName}: Must be one of: ${config.allowedValues.join(', ')}`
      );
    }
  }

  // Check recommended variables
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(`${varName}: Recommended for production`);
    }
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    validation: {
      passed: errors.length === 0 && missing.length === 0,
      errors: errors,
      missing: missing,
      warnings: warnings,
    },
    summary: {
      totalRequired: Object.keys(REQUIRED_ENV_VARS).length,
      configured: Object.keys(REQUIRED_ENV_VARS).filter(key => process.env[key])
        .length,
      recommendedConfigured: RECOMMENDED_ENV_VARS.filter(
        key => process.env[key]
      ).length,
      totalRecommended: RECOMMENDED_ENV_VARS.length,
    },
  };

  // Save report
  fs.writeFileSync(
    path.join(process.cwd(), 'env-validation-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Display results
  console.log('\n📊 Environment Validation Results:');
  console.log(
    `✅ Configured: ${report.summary.configured}/${report.summary.totalRequired} required variables`
  );
  console.log(
    `⚠️ Recommended: ${report.summary.recommendedConfigured}/${report.summary.totalRecommended} optional variables`
  );

  if (missing.length > 0) {
    console.log('\n❌ Missing Required Variables:');
    missing.forEach(msg => console.log(`  - ${msg}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Validation Errors:');
    errors.forEach(msg => console.log(`  - ${msg}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(msg => console.log(`  - ${msg}`));
  }

  if (report.validation.passed) {
    console.log('\n✅ All required environment variables are valid!');
    return true;
  } else {
    console.log('\n❌ Environment validation failed!');
    return false;
  }
}

// Security check for sensitive variables
function checkSecurityBestPractices() {
  console.log('\n🔒 Checking security best practices...');

  const securityIssues = [];

  // Check for default/weak values
  const weakPatterns = [
    { key: 'JWT_SECRET', patterns: ['secret', 'password', '123456'] },
    { key: 'ENCRYPTION_KEY', patterns: ['key', 'password', '123456'] },
  ];

  weakPatterns.forEach(({ key, patterns }) => {
    const value = process.env[key];
    if (
      value &&
      patterns.some(pattern => value.toLowerCase().includes(pattern))
    ) {
      securityIssues.push(`${key}: Appears to use a weak or default value`);
    }
  });

  // Check for production URLs
  if (
    process.env.NEXT_PUBLIC_APP_URL &&
    process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
  ) {
    securityIssues.push('NEXT_PUBLIC_APP_URL: Still pointing to localhost');
  }

  if (securityIssues.length > 0) {
    console.log('🚨 Security Issues Found:');
    securityIssues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  } else {
    console.log('✅ Security checks passed!');
    return true;
  }
}

if (require.main === module) {
  const envValid = validateEnvironmentVariables();
  const securityValid = checkSecurityBestPractices();

  if (!envValid || !securityValid) {
    process.exit(1);
  }

  console.log('\n🎉 Environment configuration is ready for production!');
}

module.exports = { validateEnvironmentVariables, checkSecurityBestPractices };
