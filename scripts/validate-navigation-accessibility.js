#!/usr/bin/env node

/**
 * Navigation Accessibility Validation Script
 * 
 * This script performs basic accessibility validation for the navigation system
 * without requiring complex test dependencies.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bold}${colors.blue}=== ${message} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Navigation component paths
const navigationPaths = {
  components: 'src/components/navigation',
  tests: 'src/components/navigation/__tests__',
  docs: 'src/components/navigation'
};

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Check for accessibility patterns in code
function checkAccessibilityPatterns(content, filename) {
  const checks = [];
  
  // Check for ARIA attributes
  const ariaPatterns = [
    /aria-label/g,
    /aria-labelledby/g,
    /aria-describedby/g,
    /aria-expanded/g,
    /aria-current/g,
    /aria-hidden/g,
    /role=/g
  ];
  
  ariaPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      checks.push({
        type: 'success',
        message: `Found ${matches.length} ${pattern.source} attributes in ${filename}`
      });
    }
  });
  
  // Check for semantic HTML
  const semanticPatterns = [
    /<nav/g,
    /<button/g,
    /<a\s+href/g,
    /<ul/g,
    /<li/g
  ];
  
  semanticPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      checks.push({
        type: 'success',
        message: `Found ${matches.length} semantic ${pattern.source} elements in ${filename}`
      });
    }
  });
  
  // Check for accessibility anti-patterns
  const antiPatterns = [
    { pattern: /onClick.*div/gi, message: 'Avoid onClick on div elements - use button instead' },
    { pattern: /tabIndex.*-1/gi, message: 'Avoid tabIndex="-1" unless for focus management' },
    { pattern: /alt=""/g, message: 'Empty alt attributes found - ensure they are intentionally decorative' }
  ];
  
  antiPatterns.forEach(({ pattern, message }) => {
    const matches = content.match(pattern);
    if (matches) {
      checks.push({
        type: 'warning',
        message: `${message} in ${filename} (${matches.length} instances)`
      });
    }
  });
  
  return checks;
}

// Check TypeScript interfaces for accessibility
function checkAccessibilityInterfaces(content, filename) {
  const checks = [];
  
  // Check for accessibility-related interface properties
  const accessibilityProps = [
    /aria-\w+\??\s*:/g,
    /role\??\s*:/g,
    /tabIndex\??\s*:/g,
    /onKeyDown\??\s*:/g,
    /onKeyUp\??\s*:/g
  ];
  
  accessibilityProps.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      checks.push({
        type: 'success',
        message: `Found accessibility props in interface ${filename}: ${matches.join(', ')}`
      });
    }
  });
  
  return checks;
}

// Validate navigation component files
function validateNavigationComponents() {
  logHeader('Validating Navigation Components');
  
  const componentFiles = [
    'NavigationProvider.tsx',
    'MainNavigation.tsx',
    'NavLinks.tsx',
    'NavLogo.tsx',
    'UserMenu.tsx',
    'MobileMenu.tsx',
    'HamburgerButton.tsx',
    'Breadcrumbs.tsx'
  ];
  
  let totalChecks = 0;
  let passedChecks = 0;
  let warnings = 0;
  
  componentFiles.forEach(filename => {
    const filePath = path.join(navigationPaths.components, filename);
    
    if (!fileExists(filePath)) {
      logWarning(`Component file not found: ${filename}`);
      return;
    }
    
    const content = readFile(filePath);
    if (!content) {
      logError(`Could not read file: ${filename}`);
      return;
    }
    
    logSuccess(`Analyzing ${filename}...`);
    
    const checks = checkAccessibilityPatterns(content, filename);
    checks.forEach(check => {
      totalChecks++;
      if (check.type === 'success') {
        passedChecks++;
        log(`  ${check.message}`, 'green');
      } else if (check.type === 'warning') {
        warnings++;
        log(`  ${check.message}`, 'yellow');
      } else {
        log(`  ${check.message}`, 'red');
      }
    });
  });
  
  log(`\nComponent Analysis Summary:`);
  log(`  Total checks: ${totalChecks}`);
  log(`  Passed: ${passedChecks}`, 'green');
  log(`  Warnings: ${warnings}`, 'yellow');
  log(`  Failed: ${totalChecks - passedChecks - warnings}`, 'red');
}

// Validate TypeScript interfaces
function validateTypeScriptInterfaces() {
  logHeader('Validating TypeScript Interfaces');
  
  const typeFiles = [
    'src/types/navigation.ts'
  ];
  
  typeFiles.forEach(filePath => {
    if (!fileExists(filePath)) {
      logWarning(`Type file not found: ${filePath}`);
      return;
    }
    
    const content = readFile(filePath);
    if (!content) {
      logError(`Could not read file: ${filePath}`);
      return;
    }
    
    logSuccess(`Analyzing ${filePath}...`);
    
    const checks = checkAccessibilityInterfaces(content, filePath);
    checks.forEach(check => {
      log(`  ${check.message}`, check.type === 'success' ? 'green' : 'yellow');
    });
  });
}

// Check for required accessibility documentation
function validateDocumentation() {
  logHeader('Validating Accessibility Documentation');
  
  const requiredDocs = [
    { file: 'DOCUMENTATION.md', description: 'Main documentation' },
    { file: 'CONFIGURATION_GUIDE.md', description: 'Configuration guide' },
    { file: '__tests__/AccessibilityCompliance.test.tsx', description: 'Accessibility tests' },
    { file: '__tests__/CrossBrowserTesting.test.tsx', description: 'Cross-browser tests' }
  ];
  
  requiredDocs.forEach(({ file, description }) => {
    const filePath = path.join(navigationPaths.components, file);
    
    if (fileExists(filePath)) {
      logSuccess(`${description} exists: ${file}`);
      
      // Check documentation content
      const content = readFile(filePath);
      if (content) {
        const accessibilityMentions = (content.match(/accessibility|a11y|wcag|aria|screen reader/gi) || []).length;
        if (accessibilityMentions > 0) {
          logSuccess(`  Contains ${accessibilityMentions} accessibility references`);
        } else {
          logWarning(`  Limited accessibility documentation found`);
        }
      }
    } else {
      logError(`Missing ${description}: ${file}`);
    }
  });
}

// Check CSS for accessibility features
function validateCSS() {
  logHeader('Validating CSS Accessibility Features');
  
  const cssFiles = [
    'src/components/navigation/navigation.css',
    'src/styles/globals.css'
  ];
  
  cssFiles.forEach(filePath => {
    if (!fileExists(filePath)) {
      logWarning(`CSS file not found: ${filePath}`);
      return;
    }
    
    const content = readFile(filePath);
    if (!content) {
      logError(`Could not read CSS file: ${filePath}`);
      return;
    }
    
    logSuccess(`Analyzing ${filePath}...`);
    
    // Check for accessibility-related CSS
    const accessibilityPatterns = [
      { pattern: /:focus/g, message: 'Focus styles' },
      { pattern: /:focus-visible/g, message: 'Focus-visible styles' },
      { pattern: /prefers-reduced-motion/g, message: 'Reduced motion support' },
      { pattern: /prefers-color-scheme/g, message: 'Color scheme support' },
      { pattern: /sr-only|screen-reader/g, message: 'Screen reader utilities' }
    ];
    
    accessibilityPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        logSuccess(`  Found ${matches.length} ${message} declarations`);
      }
    });
  });
}

// Generate accessibility report
function generateAccessibilityReport() {
  logHeader('Generating Accessibility Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    components: [],
    summary: {
      totalComponents: 0,
      accessibleComponents: 0,
      warnings: 0,
      errors: 0
    }
  };
  
  // This would be expanded with actual test results
  // For now, we'll create a basic report structure
  
  const reportPath = 'src/components/navigation/__tests__/accessibility-report.json';
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logSuccess(`Accessibility report generated: ${reportPath}`);
  } catch (error) {
    logError(`Failed to generate report: ${error.message}`);
  }
}

// Main validation function
function main() {
  log(`${colors.bold}${colors.blue}Navigation System Accessibility Validation${colors.reset}`);
  log(`Starting validation at ${new Date().toLocaleString()}\n`);
  
  try {
    validateNavigationComponents();
    validateTypeScriptInterfaces();
    validateDocumentation();
    validateCSS();
    generateAccessibilityReport();
    
    logHeader('Validation Complete');
    logSuccess('Navigation system accessibility validation completed successfully!');
    
    log('\nNext Steps:');
    log('1. Review any warnings or errors above');
    log('2. Run full test suite: npm run test:navigation');
    log('3. Perform manual accessibility testing');
    log('4. Use automated tools like axe-core for additional validation');
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = {
  validateNavigationComponents,
  validateTypeScriptInterfaces,
  validateDocumentation,
  validateCSS,
  generateAccessibilityReport
};