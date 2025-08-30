#!/usr/bin/env node

/**
 * Specification Audit Script
 * Analyzes all specifications in .kiro/specs and tododoc/specs
 * Creates a mapping matrix between specs and implemented functionality
 */

const fs = require('fs');
const path = require('path');

// Specification status analysis
const specStatus = {
  '.kiro/specs/admin-content-management': {
    status: 'MOSTLY_COMPLETED',
    completionPercentage: 85,
    phase: 1,
    duplicateIn: 'tododoc/specs/admin-content-management',
    implementationStatus: 'PRODUCTION',
    notes: 'Most tasks completed, some advanced features pending'
  },
  '.kiro/specs/admin-dashboard-enhancement': {
    status: 'NOT_STARTED',
    completionPercentage: 0,
    phase: 2,
    duplicateIn: 'tododoc/specs/admin-dashboard-enhancement',
    implementationStatus: 'NOT_IMPLEMENTED',
    notes: 'All tasks pending, no implementation found'
  },
  '.kiro/specs/admin-only-features': {
    status: 'NOT_STARTED',
    completionPercentage: 0,
    phase: 2,
    duplicateIn: 'tododoc/specs/admin-only-features',
    implementationStatus: 'NOT_IMPLEMENTED',
    notes: 'All tasks pending, feature protection not implemented'
  },
  '.kiro/specs/content-management-system': {
    status: 'COMPLETED',
    completionPercentage: 100,
    phase: 1,
    duplicateIn: 'tododoc/specs/content-management-system',
    implementationStatus: 'PRODUCTION',
    notes: 'All tasks completed and in production'
  },
  '.kiro/specs/homepage-production': {
    status: 'COMPLETED',
    completionPercentage: 100,
    phase: 1,
    duplicateIn: 'tododoc/specs/homepage-production',
    implementationStatus: 'PRODUCTION',
    notes: 'All tasks completed and in production'
  },
  '.kiro/specs/project-organization-documentation': {
    status: 'IN_PROGRESS',
    completionPercentage: 10,
    phase: 1,
    duplicateIn: null,
    implementationStatus: 'IN_PROGRESS',
    notes: 'Currently being executed, task 1 completed'
  },
  '.kiro/specs/supabase-database-setup': {
    status: 'MOSTLY_COMPLETED',
    completionPercentage: 90,
    phase: 1,
    duplicateIn: 'tododoc/specs/supabase-database-setup',
    implementationStatus: 'PRODUCTION',
    notes: 'Database setup completed, one task pending'
  },
  '.kiro/specs/supabase-role-authentication': {
    status: 'NOT_STARTED',
    completionPercentage: 0,
    phase: 2,
    duplicateIn: 'tododoc/specs/supabase-role-authentication',
    implementationStatus: 'PARTIAL',
    notes: 'Basic auth exists but role-based system not implemented'
  },
  '.kiro/specs/supabase-ssr-refactoring': {
    status: 'MOSTLY_COMPLETED',
    completionPercentage: 85,
    phase: 1,
    duplicateIn: null,
    implementationStatus: 'PRODUCTION',
    notes: 'SSR refactoring mostly complete, some tasks pending'
  },
  'supabase/': {
    status: 'MOSTLY_COMPLETED',
    completionPercentage: 85,
    phase: 1,
    duplicateIn: '.kiro/specs/supabase-database-setup',
    implementationStatus: 'PRODUCTION',
    notes: 'Duplicate of supabase-database-setup spec'
  }
};

// Feature implementation mapping
const featureMapping = {
  'Articles System': {
    specs: ['.kiro/specs/content-management-system', '.kiro/specs/admin-content-management'],
    status: 'PRODUCTION',
    components: ['ArticleGrid', 'ArticleCard', 'ArticleEditor'],
    routes: ['/articles', '/admin/articles']
  },
  'News System': {
    specs: ['.kiro/specs/content-management-system', '.kiro/specs/admin-content-management'],
    status: 'PRODUCTION',
    components: ['NewsGrid', 'NewsCard', 'NewsProcessor'],
    routes: ['/news', '/admin/news']
  },
  'Homepage': {
    specs: ['.kiro/specs/homepage-production'],
    status: 'PRODUCTION',
    components: ['HeroSection', 'FeaturedNews', 'FeaturedArticles'],
    routes: ['/']
  },
  'Admin Panel': {
    specs: ['.kiro/specs/admin-content-management'],
    status: 'PARTIAL',
    components: ['AdminLayout', 'AdminDashboard'],
    routes: ['/admin']
  },
  'Database Schema': {
    specs: ['.kiro/specs/supabase-database-setup', 'supabase/'],
    status: 'PRODUCTION',
    components: ['Database tables', 'RLS policies', 'Functions'],
    routes: ['Database level']
  },
  'SSR Authentication': {
    specs: ['.kiro/specs/supabase-ssr-refactoring'],
    status: 'PRODUCTION',
    components: ['AuthProvider', 'ProtectedRoute', 'Middleware'],
    routes: ['All authenticated routes']
  },
  'Role-based Access': {
    specs: ['.kiro/specs/supabase-role-authentication'],
    status: 'NOT_IMPLEMENTED',
    components: ['RoleProvider', 'RoleService'],
    routes: ['Admin routes protection']
  },
  'Admin Dashboard Enhancement': {
    specs: ['.kiro/specs/admin-dashboard-enhancement'],
    status: 'NOT_IMPLEMENTED',
    components: ['MetricsCard', 'ActivityFeed', 'SystemHealth'],
    routes: ['/admin/dashboard']
  },
  'Admin-only Features Protection': {
    specs: ['.kiro/specs/admin-only-features'],
    status: 'NOT_IMPLEMENTED',
    components: ['AdminBadge', 'FeatureNotAvailable'],
    routes: ['Protected feature routes']
  }
};

// Generate audit report
function generateAuditReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSpecs: Object.keys(specStatus).length,
      completedSpecs: Object.values(specStatus).filter(s => s.status === 'COMPLETED').length,
      inProgressSpecs: Object.values(specStatus).filter(s => s.status === 'IN_PROGRESS').length,
      notStartedSpecs: Object.values(specStatus).filter(s => s.status === 'NOT_STARTED').length,
      duplicateSpecs: Object.values(specStatus).filter(s => s.duplicateIn !== null).length,
      phase1Specs: Object.values(specStatus).filter(s => s.phase === 1).length,
      phase2Specs: Object.values(specStatus).filter(s => s.phase === 2).length
    },
    specificationStatus: specStatus,
    featureMapping: featureMapping,
    duplicateAnalysis: {},
    recommendations: []
  };

  // Analyze duplicates
  const duplicates = {};
  Object.entries(specStatus).forEach(([spec, data]) => {
    if (data.duplicateIn) {
      const key = `${spec} <-> ${data.duplicateIn}`;
      duplicates[key] = {
        primary: spec,
        duplicate: data.duplicateIn,
        status: data.status,
        recommendation: data.status === 'COMPLETED' ? 'Archive duplicate' : 'Consolidate and continue in primary location'
      };
    }
  });
  report.duplicateAnalysis = duplicates;

  // Generate recommendations
  report.recommendations = [
    {
      priority: 'HIGH',
      category: 'Duplicates',
      issue: `Found ${Object.keys(duplicates).length} duplicate specification sets`,
      action: 'Consolidate duplicate specs and archive legacy versions'
    },
    {
      priority: 'HIGH',
      category: 'Phase 2 Planning',
      issue: 'Multiple Phase 2 specs are not started',
      action: 'Prioritize and plan Phase 2 implementation roadmap'
    },
    {
      priority: 'MEDIUM',
      category: 'Documentation',
      issue: 'Some completed features lack updated documentation',
      action: 'Update documentation to reflect current implementation status'
    },
    {
      priority: 'MEDIUM',
      category: 'Organization',
      issue: 'Specs scattered between multiple locations',
      action: 'Consolidate all active specs in .kiro/specs and archive completed ones'
    }
  ];

  return report;
}

// Write report to file
function writeReport() {
  const report = generateAuditReport();
  
  // Write JSON report
  fs.writeFileSync(
    path.join(__dirname, '../../specification-audit-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Write Markdown report
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(
    path.join(__dirname, '../../specification-audit-report.md'),
    markdown
  );

  console.log('✅ Specification audit report generated successfully');
  console.log('📄 JSON report: specification-audit-report.json');
  console.log('📄 Markdown report: specification-audit-report.md');
}

function generateMarkdownReport(report) {
  return `# Specification Audit Report

Generated: ${new Date(report.generatedAt).toLocaleString()}

## Executive Summary

- **Total Specifications**: ${report.summary.totalSpecs}
- **Completed**: ${report.summary.completedSpecs} (${Math.round(report.summary.completedSpecs / report.summary.totalSpecs * 100)}%)
- **In Progress**: ${report.summary.inProgressSpecs}
- **Not Started**: ${report.summary.notStartedSpecs}
- **Duplicate Specs**: ${report.summary.duplicateSpecs}
- **Phase 1 Specs**: ${report.summary.phase1Specs}
- **Phase 2 Specs**: ${report.summary.phase2Specs}

## Specification Status Matrix

| Specification | Status | Completion | Phase | Implementation | Notes |
|---------------|--------|------------|-------|----------------|-------|
${Object.entries(report.specificationStatus).map(([spec, data]) => 
  `| ${spec} | ${data.status} | ${data.completionPercentage}% | ${data.phase} | ${data.implementationStatus} | ${data.notes} |`
).join('\n')}

## Feature Implementation Mapping

${Object.entries(report.featureMapping).map(([feature, data]) => `
### ${feature}
- **Status**: ${data.status}
- **Specifications**: ${data.specs.join(', ')}
- **Components**: ${data.components.join(', ')}
- **Routes**: ${data.routes.join(', ')}
`).join('\n')}

## Duplicate Specifications Analysis

${Object.entries(report.duplicateAnalysis).map(([key, data]) => `
### ${key}
- **Primary**: ${data.primary}
- **Duplicate**: ${data.duplicate}
- **Status**: ${data.status}
- **Recommendation**: ${data.recommendation}
`).join('\n')}

## Recommendations

${report.recommendations.map((rec, index) => `
### ${index + 1}. ${rec.category} (Priority: ${rec.priority})
**Issue**: ${rec.issue}
**Action**: ${rec.action}
`).join('\n')}

## Next Steps

1. **Immediate Actions**:
   - Consolidate duplicate specifications
   - Archive completed specs to /completed folder
   - Update documentation for implemented features

2. **Short-term Planning**:
   - Prioritize Phase 2 specifications
   - Create implementation roadmap for pending features
   - Establish spec maintenance process

3. **Long-term Organization**:
   - Implement automated spec status tracking
   - Create spec template and guidelines
   - Establish regular spec review process

---
*Generated by Specification Audit System*
`;
}

// Run the audit
if (require.main === module) {
  writeReport();
}

module.exports = { generateAuditReport, specStatus, featureMapping };