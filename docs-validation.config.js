/**
 * Documentation Validation Configuration
 * 
 * This file contains configuration options for the documentation validation system.
 */

module.exports = {
  // Paths to include in validation
  includePaths: [
    'docs/**/*.md',
    '.kiro/specs/**/*.md',
    'README.md',
    'CHANGELOG.md',
    'CONTRIBUTING.md'
  ],
  
  // Paths to exclude from validation
  excludePaths: [
    'node_modules/**',
    '.git/**',
    'archive/**',
    '.next/**',
    'dist/**',
    'build/**'
  ],
  
  // Link validation settings
  linkValidation: {
    // Skip external link validation for these domains (to avoid rate limiting)
    skipDomains: [
      'localhost',
      '127.0.0.1',
      'example.com',
      'github.com',
      'openai.com',
      'platform.openai.com',
      'nextjs.org',
      'docs.netlify.com'
    ],
    
    // Timeout for external link checks (milliseconds)
    timeout: 5000,
    
    // Maximum number of concurrent external link checks
    maxConcurrent: 10,
    
    // Retry failed external links
    retryCount: 2
  },
  
  // Code validation settings
  codeValidation: {
    // Languages to validate
    supportedLanguages: [
      'javascript',
      'js',
      'typescript',
      'ts',
      'json',
      'sql',
      'bash',
      'shell'
    ],
    
    // Skip validation for code blocks with these markers
    skipMarkers: [
      '// @skip-validation',
      '# @skip-validation',
      '<!-- @skip-validation -->'
    ]
  },
  
  // Outdated documentation detection
  outdatedDetection: {
    // Consider files outdated after this many days
    maxAge: 90,
    
    // Patterns that indicate outdated content
    outdatedPatterns: [
      /TODO:/gi,
      /FIXME:/gi,
      /\b(coming soon|under construction|work in progress)\b/gi,
      /\b(placeholder|example|sample)\b/gi,
      /\b(version \d+\.\d+)\b/gi
    ],
    
    // File patterns to check for existence when referenced
    fileReferencePatterns: [
      /`[^`]*\.(js|ts|jsx|tsx|json|md|yml|yaml)`/g,
      /\]\([^)]*\.(js|ts|jsx|tsx|json|md|yml|yaml)\)/g
    ]
  },
  
  // Report settings
  reporting: {
    // Output format: 'console', 'json', 'html'
    format: 'console',
    
    // Save report to file
    saveToFile: true,
    
    // Report file path
    reportPath: 'docs-validation-report.json',
    
    // Include warnings in report
    includeWarnings: true,
    
    // Maximum number of issues to display per category
    maxDisplayItems: 20
  },
  
  // CI/CD integration settings
  ci: {
    // Fail build on broken links
    failOnBrokenLinks: true,
    
    // Fail build on invalid code examples
    failOnInvalidCode: true,
    
    // Fail build on outdated documentation (warning only)
    failOnOutdated: false,
    
    // Create GitHub issue for validation failures
    createIssue: false,
    
    // Assign GitHub issue to these users
    assignees: []
  }
};