#!/usr/bin/env node

/**
 * Performance validation script for production deployment
 * Checks Core Web Vitals and performance metrics
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const PERFORMANCE_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 95,
  fcp: 1800, // First Contentful Paint (ms)
  lcp: 2500, // Largest Contentful Paint (ms)
  cls: 0.1, // Cumulative Layout Shift
  fid: 100, // First Input Delay (ms)
};

const ADMIN_PAGES_TO_TEST = [
  '/es/admin',
  '/es/admin/articles',
  '/es/admin/news',
  '/es/admin/analytics',
];

async function runPerformanceCheck() {
  console.log('🔍 Starting performance validation...');

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const results = [];

  try {
    for (const page of ADMIN_PAGES_TO_TEST) {
      console.log(`Testing ${page}...`);

      const runnerResult = await lighthouse(`http://localhost:3000${page}`, {
        port: chrome.port,
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      });

      const scores = {
        url: page,
        performance: Math.round(
          runnerResult.lhr.categories.performance.score * 100
        ),
        accessibility: Math.round(
          runnerResult.lhr.categories.accessibility.score * 100
        ),
        bestPractices: Math.round(
          runnerResult.lhr.categories['best-practices'].score * 100
        ),
        seo: Math.round(runnerResult.lhr.categories.seo.score * 100),
        fcp: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
        lcp: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
        cls: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue,
      };

      results.push(scores);

      // Check thresholds
      const failed = [];
      if (scores.performance < PERFORMANCE_THRESHOLDS.performance)
        failed.push('Performance');
      if (scores.accessibility < PERFORMANCE_THRESHOLDS.accessibility)
        failed.push('Accessibility');
      if (scores.bestPractices < PERFORMANCE_THRESHOLDS['best-practices'])
        failed.push('Best Practices');
      if (scores.seo < PERFORMANCE_THRESHOLDS.seo) failed.push('SEO');
      if (scores.fcp > PERFORMANCE_THRESHOLDS.fcp) failed.push('FCP');
      if (scores.lcp > PERFORMANCE_THRESHOLDS.lcp) failed.push('LCP');
      if (scores.cls > PERFORMANCE_THRESHOLDS.cls) failed.push('CLS');

      if (failed.length > 0) {
        console.warn(`⚠️ ${page} failed: ${failed.join(', ')}`);
      } else {
        console.log(`✅ ${page} passed all performance checks`);
      }
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      thresholds: PERFORMANCE_THRESHOLDS,
      results: results,
      summary: {
        totalPages: results.length,
        passedPages: results.filter(
          r =>
            r.performance >= PERFORMANCE_THRESHOLDS.performance &&
            r.accessibility >= PERFORMANCE_THRESHOLDS.accessibility &&
            r.bestPractices >= PERFORMANCE_THRESHOLDS['best-practices'] &&
            r.seo >= PERFORMANCE_THRESHOLDS.seo
        ).length,
      },
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'performance-validation-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('📊 Performance validation complete!');
    console.log(
      `✅ ${report.summary.passedPages}/${report.summary.totalPages} pages passed all checks`
    );
  } finally {
    await chrome.kill();
  }
}

if (require.main === module) {
  runPerformanceCheck().catch(console.error);
}

module.exports = { runPerformanceCheck };
