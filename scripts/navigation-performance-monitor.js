#!/usr/bin/env node

/**
 * Navigation Performance Monitoring Script
 * Monitors and reports navigation component performance metrics
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds
const THRESHOLDS = {
  bundleSize: 50 * 1024, // 50KB
  componentLoad: 200, // 200ms
  navigationTime: 500, // 500ms
  renderTime: 100, // 100ms
};

// Component size analysis
function analyzeBundleSizes() {
  const buildDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(buildDir, 'static', 'chunks');
  
  if (!fs.existsSync(staticDir)) {
    console.log('Build directory not found. Run `npm run build` first.');
    return;
  }

  const chunks = fs.readdirSync(staticDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(staticDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
      };
    })
    .filter(chunk => chunk.name.includes('navigation'))
    .sort((a, b) => b.size - a.size);

  console.log('\n📊 Navigation Bundle Analysis:');
  console.log('================================');
  
  let totalSize = 0;
  chunks.forEach(chunk => {
    const status = chunk.size > THRESHOLDS.bundleSize ? '❌' : '✅';
    console.log(`${status} ${chunk.name}: ${chunk.sizeKB}KB`);
    totalSize += chunk.size;
  });

  console.log(`\nTotal Navigation Bundle Size: ${(totalSize / 1024).toFixed(2)}KB`);
  
  if (totalSize > THRESHOLDS.bundleSize * 2) {
    console.log('⚠️  Warning: Navigation bundle size exceeds recommended threshold');
    console.log('Consider lazy loading more components or optimizing imports');
  } else {
    console.log('✅ Navigation bundle size is within acceptable limits');
  }

  return chunks;
}

// Performance recommendations
function generateRecommendations(chunks) {
  const recommendations = [];

  // Bundle size recommendations
  const largeChunks = chunks.filter(chunk => chunk.size > THRESHOLDS.bundleSize);
  if (largeChunks.length > 0) {
    recommendations.push({
      type: 'bundle-size',
      severity: 'warning',
      message: `Large navigation chunks detected: ${largeChunks.map(c => c.name).join(', ')}`,
      solution: 'Consider code splitting or lazy loading these components',
    });
  }

  // Code splitting recommendations
  const coreChunks = chunks.filter(chunk => chunk.name.includes('navigation-core'));
  if (coreChunks.length === 0) {
    recommendations.push({
      type: 'code-splitting',
      severity: 'info',
      message: 'No navigation-core chunk found',
      solution: 'Ensure webpack configuration is properly splitting navigation components',
    });
  }

  // Lazy loading recommendations
  const lazyChunks = chunks.filter(chunk => chunk.name.includes('navigation-lazy'));
  if (lazyChunks.length === 0) {
    recommendations.push({
      type: 'lazy-loading',
      severity: 'info',
      message: 'No lazy-loaded navigation chunks found',
      solution: 'Consider implementing lazy loading for non-critical navigation components',
    });
  }

  return recommendations;
}

// Generate performance report
function generateReport() {
  console.log('🚀 Navigation Performance Monitor');
  console.log('=================================\n');

  const chunks = analyzeBundleSizes();
  const recommendations = generateRecommendations(chunks);

  if (recommendations.length > 0) {
    console.log('\n💡 Performance Recommendations:');
    console.log('================================');
    
    recommendations.forEach((rec, index) => {
      const icon = rec.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${index + 1}. ${rec.message}`);
      console.log(`   Solution: ${rec.solution}\n`);
    });
  }

  // Performance checklist
  console.log('\n✅ Performance Checklist:');
  console.log('=========================');
  
  const checklist = [
    { item: 'Code splitting implemented', status: chunks.some(c => c.name.includes('navigation-core')) },
    { item: 'Lazy loading configured', status: chunks.some(c => c.name.includes('navigation-lazy')) },
    { item: 'Bundle size optimized', status: chunks.every(c => c.size <= THRESHOLDS.bundleSize) },
    { item: 'Admin components separated', status: chunks.some(c => c.name.includes('navigation-admin')) },
  ];

  checklist.forEach(check => {
    const status = check.status ? '✅' : '❌';
    console.log(`${status} ${check.item}`);
  });

  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    chunks,
    recommendations,
    checklist,
    thresholds: THRESHOLDS,
  };

  const reportPath = path.join(process.cwd(), 'navigation-performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Runtime performance monitoring
function monitorRuntimePerformance() {
  console.log('\n⏱️  Runtime Performance Monitoring:');
  console.log('===================================');
  
  const performanceScript = `
    // Navigation performance monitoring
    if (typeof window !== 'undefined') {
      window.navigationPerformance = {
        metrics: [],
        
        track: function(componentName, startTime, endTime) {
          const loadTime = endTime - startTime;
          this.metrics.push({
            component: componentName,
            loadTime: loadTime,
            timestamp: Date.now(),
          });
          
          if (loadTime > ${THRESHOLDS.componentLoad}) {
            console.warn('Slow navigation component:', componentName, loadTime + 'ms');
          }
        },
        
        report: function() {
          console.log('Navigation Performance Metrics:', this.metrics);
          return this.metrics;
        }
      };
    }
  `;

  const scriptPath = path.join(process.cwd(), 'public', 'navigation-performance.js');
  fs.writeFileSync(scriptPath, performanceScript);
  console.log('✅ Runtime monitoring script created at /public/navigation-performance.js');
  console.log('   Add this script to your HTML head to enable runtime monitoring');
}

// Main execution
function main() {
  const command = process.argv[2];

  switch (command) {
    case 'analyze':
      analyzeBundleSizes();
      break;
    case 'monitor':
      monitorRuntimePerformance();
      break;
    case 'report':
    default:
      generateReport();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSizes,
  generateRecommendations,
  generateReport,
  monitorRuntimePerformance,
};