#!/usr/bin/env node

/**
 * Documentation vs Implementation Comparison Script
 * 
 * Compares documented features against actual implementation in the codebase
 */

const fs = require('fs');
const path = require('path');

class DocsImplementationComparator {
  constructor() {
    this.results = {
      documentedFeatures: [],
      implementedFeatures: [],
      matches: [],
      mismatches: {
        documentedButNotImplemented: [],
        implementedButNotDocumented: []
      },
      codebaseAnalysis: {},
      recommendations: []
    };
  }

  async compare() {
    console.log('🔍 Comparing documentation vs implementation...\n');
    
    try {
      // Analyze documented features
      await this.analyzeDocumentedFeatures();
      
      // Analyze implemented features
      await this.analyzeImplementedFeatures();
      
      // Compare and find mismatches
      this.compareFeatures();
      
      // Generate recommendations
      this.generateRecommendations();
      
      // Generate report
      await this.generateReport();
      
      console.log('✅ Comparison completed successfully!');
      console.log('📊 Report generated: docs-vs-implementation-report.json');
      
    } catch (error) {
      console.error('❌ Error during comparison:', error.message);
      process.exit(1);
    }
  }

  async analyzeDocumentedFeatures() {
    console.log('📚 Analyzing documented features...');
    
    // Analyze specs for documented features
    await this.analyzeSpecs();
    
    // Analyze documentation files
    await this.analyzeDocumentation();
    
    console.log(`   Found ${this.results.documentedFeatures.length} documented features`);
  }

  async analyzeSpecs() {
    const specsPath = path.join(process.cwd(), '.kiro', 'specs');
    if (!fs.existsSync(specsPath)) return;

    const specDirs = fs.readdirSync(specsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const specDir of specDirs) {
      const specPath = path.join(specsPath, specDir);
      const requirementsFile = path.join(specPath, 'requirements.md');
      const tasksFile = path.join(specPath, 'tasks.md');
      
      if (fs.existsSync(requirementsFile)) {
        const requirements = fs.readFileSync(requirementsFile, 'utf8');
        const tasks = fs.existsSync(tasksFile) ? fs.readFileSync(tasksFile, 'utf8') : '';
        
        this.results.documentedFeatures.push({
          name: specDir,
          type: 'specification',
          source: `specs/${specDir}`,
          requirements: this.extractRequirements(requirements),
          tasks: this.extractTasks(tasks),
          status: this.determineSpecStatus(tasks)
        });
      }
    }
  }

  async analyzeDocumentation() {
    const docsPath = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsPath)) return;

    // Look for feature documentation
    const docFiles = this.findDocumentationFiles(docsPath);
    
    for (const docFile of docFiles) {
      const content = fs.readFileSync(docFile, 'utf8');
      const features = this.extractFeaturesFromDoc(content, docFile);
      this.results.documentedFeatures.push(...features);
    }
  }

  findDocumentationFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...this.findDocumentationFiles(fullPath));
      } else if (item.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  extractRequirements(content) {
    const requirements = [];
    const lines = content.split('\n');
    let currentRequirement = null;
    
    for (const line of lines) {
      if (line.startsWith('### Requirement')) {
        if (currentRequirement) {
          requirements.push(currentRequirement);
        }
        currentRequirement = {
          title: line.replace('### Requirement', '').trim(),
          userStory: '',
          acceptanceCriteria: []
        };
      } else if (line.startsWith('**User Story:**') && currentRequirement) {
        currentRequirement.userStory = line.replace('**User Story:**', '').trim();
      } else if (line.match(/^\d+\.\s+(WHEN|IF|GIVEN)/) && currentRequirement) {
        currentRequirement.acceptanceCriteria.push(line.trim());
      }
    }
    
    if (currentRequirement) {
      requirements.push(currentRequirement);
    }
    
    return requirements;
  }

  extractTasks(content) {
    const tasks = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^- \[.\]/)) {
        const status = line.includes('[x]') ? 'completed' : 
                     line.includes('[-]') ? 'in-progress' : 'not-started';
        const taskText = line.replace(/^- \[.\]\s*/, '').trim();
        
        tasks.push({
          text: taskText,
          status,
          isSubTask: line.startsWith('  - ')
        });
      }
    }
    
    return tasks;
  }

  determineSpecStatus(tasksContent) {
    const completedTasks = (tasksContent.match(/- \[x\]/g) || []).length;
    const totalTasks = (tasksContent.match(/- \[.\]/g) || []).length;
    
    if (totalTasks === 0) return 'no-tasks';
    if (completedTasks === totalTasks) return 'completed';
    if (completedTasks > 0) return 'in-progress';
    return 'not-started';
  }

  extractFeaturesFromDoc(content, filePath) {
    const features = [];
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Look for feature mentions in documentation
    const featurePatterns = [
      /## (.+?) Feature/gi,
      /### (.+?) Implementation/gi,
      /# (.+?) Guide/gi
    ];
    
    for (const pattern of featurePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        features.push({
          name: match[1].trim(),
          type: 'documentation',
          source: relativePath,
          description: this.extractDescription(content, match.index)
        });
      }
    }
    
    return features;
  }

  extractDescription(content, startIndex) {
    const lines = content.substring(startIndex).split('\n');
    const description = [];
    
    for (let i = 1; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#')) {
        description.push(line);
      } else if (line.startsWith('#')) {
        break;
      }
    }
    
    return description.join(' ').substring(0, 200);
  }

  async analyzeImplementedFeatures() {
    console.log('💻 Analyzing implemented features...');
    
    // Analyze source code structure
    await this.analyzeSourceCode();
    
    // Analyze package.json dependencies
    await this.analyzeDependencies();
    
    // Analyze database schema
    await this.analyzeDatabaseSchema();
    
    // Analyze configuration files
    await this.analyzeConfiguration();
    
    console.log(`   Found ${this.results.implementedFeatures.length} implemented features`);
  }

  async analyzeSourceCode() {
    const srcPath = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcPath)) return;

    // Analyze app directory structure (Next.js 13+ app router)
    const appPath = path.join(srcPath, 'app');
    if (fs.existsSync(appPath)) {
      const routes = this.analyzeAppRoutes(appPath);
      this.results.implementedFeatures.push(...routes);
    }

    // Analyze components
    const componentsPath = path.join(srcPath, 'components');
    if (fs.existsSync(componentsPath)) {
      const components = this.analyzeComponents(componentsPath);
      this.results.implementedFeatures.push(...components);
    }

    // Analyze lib directory
    const libPath = path.join(srcPath, 'lib');
    if (fs.existsSync(libPath)) {
      const libraries = this.analyzeLibraries(libPath);
      this.results.implementedFeatures.push(...libraries);
    }
  }

  analyzeAppRoutes(appPath) {
    const routes = [];
    const items = fs.readdirSync(appPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('(')) {
        routes.push({
          name: `${item.name}-page`,
          type: 'route',
          category: 'frontend',
          path: `app/${item.name}`,
          implemented: true,
          files: this.getRouteFiles(path.join(appPath, item.name))
        });
      }
    }
    
    return routes;
  }

  getRouteFiles(routePath) {
    const files = [];
    if (!fs.existsSync(routePath)) return files;
    
    const items = fs.readdirSync(routePath);
    for (const item of items) {
      if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(item);
      }
    }
    
    return files;
  }

  analyzeComponents(componentsPath) {
    const components = [];
    const componentDirs = this.findDirectories(componentsPath);
    
    for (const dir of componentDirs) {
      const componentName = path.basename(dir);
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
      
      if (files.length > 0) {
        components.push({
          name: `${componentName}-component`,
          type: 'component',
          category: 'frontend',
          path: path.relative(process.cwd(), dir),
          implemented: true,
          files
        });
      }
    }
    
    return components;
  }

  analyzeLibraries(libPath) {
    const libraries = [];
    const libDirs = this.findDirectories(libPath);
    
    for (const dir of libDirs) {
      const libName = path.basename(dir);
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
      
      if (files.length > 0) {
        libraries.push({
          name: `${libName}-library`,
          type: 'library',
          category: 'backend',
          path: path.relative(process.cwd(), dir),
          implemented: true,
          files
        });
      }
    }
    
    return libraries;
  }

  findDirectories(dirPath) {
    const dirs = [];
    if (!fs.existsSync(dirPath)) return dirs;
    
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        const fullPath = path.join(dirPath, item.name);
        dirs.push(fullPath);
        // Recursively find subdirectories
        dirs.push(...this.findDirectories(fullPath));
      }
    }
    
    return dirs;
  }

  async analyzeDependencies() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) return;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Map dependencies to features
    const dependencyFeatures = [
      { deps: ['@supabase/supabase-js'], feature: 'supabase-integration' },
      { deps: ['next-auth'], feature: 'authentication' },
      { deps: ['@next/font', 'next/font'], feature: 'font-optimization' },
      { deps: ['tailwindcss'], feature: 'styling-system' },
      { deps: ['framer-motion'], feature: 'animations' },
      { deps: ['react-hook-form'], feature: 'form-handling' },
      { deps: ['zod'], feature: 'validation' },
      { deps: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'], feature: 'ui-components' },
      { deps: ['lucide-react'], feature: 'icons' },
      { deps: ['next-intl'], feature: 'internationalization' }
    ];

    for (const { deps, feature } of dependencyFeatures) {
      const hasFeature = deps.some(dep => dependencies[dep]);
      if (hasFeature) {
        this.results.implementedFeatures.push({
          name: feature,
          type: 'dependency',
          category: 'infrastructure',
          implemented: true,
          dependencies: deps.filter(dep => dependencies[dep])
        });
      }
    }
  }

  async analyzeDatabaseSchema() {
    const supabasePath = path.join(process.cwd(), 'supabase');
    if (!fs.existsSync(supabasePath)) return;

    // Check for migrations
    const migrationsPath = path.join(supabasePath, 'migrations');
    if (fs.existsSync(migrationsPath)) {
      const migrations = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql'));
      
      this.results.implementedFeatures.push({
        name: 'database-schema',
        type: 'database',
        category: 'backend',
        implemented: true,
        migrations: migrations.length,
        files: migrations
      });
    }

    // Analyze schema for specific features
    const schemaFeatures = this.analyzeSchemaFeatures(migrationsPath);
    this.results.implementedFeatures.push(...schemaFeatures);
  }

  analyzeSchemaFeatures(migrationsPath) {
    const features = [];
    if (!fs.existsSync(migrationsPath)) return features;

    const migrations = fs.readdirSync(migrationsPath);
    const allMigrationContent = migrations
      .map(file => fs.readFileSync(path.join(migrationsPath, file), 'utf8'))
      .join('\n');

    // Look for specific table patterns
    const tablePatterns = [
      { pattern: /create table.*articles/i, feature: 'articles-database' },
      { pattern: /create table.*news/i, feature: 'news-database' },
      { pattern: /create table.*users/i, feature: 'users-database' },
      { pattern: /create table.*profiles/i, feature: 'profiles-database' },
      { pattern: /create table.*categories/i, feature: 'categories-database' },
      { pattern: /create table.*tags/i, feature: 'tags-database' },
      { pattern: /create table.*courses/i, feature: 'courses-database' },
      { pattern: /create table.*certificates/i, feature: 'certificates-database' }
    ];

    for (const { pattern, feature } of tablePatterns) {
      if (pattern.test(allMigrationContent)) {
        features.push({
          name: feature,
          type: 'database-table',
          category: 'backend',
          implemented: true,
          source: 'migrations'
        });
      }
    }

    return features;
  }

  async analyzeConfiguration() {
    const configFiles = [
      { file: 'next.config.js', feature: 'nextjs-configuration' },
      { file: 'tailwind.config.js', feature: 'tailwind-configuration' },
      { file: 'supabase/config.toml', feature: 'supabase-configuration' },
      { file: '.env.example', feature: 'environment-configuration' },
      { file: 'netlify.toml', feature: 'netlify-deployment' },
      { file: 'docker-compose.yml', feature: 'docker-configuration' }
    ];

    for (const { file, feature } of configFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.results.implementedFeatures.push({
          name: feature,
          type: 'configuration',
          category: 'infrastructure',
          implemented: true,
          file
        });
      }
    }
  }

  compareFeatures() {
    console.log('🔄 Comparing documented vs implemented features...');
    
    // Find matches and mismatches
    for (const docFeature of this.results.documentedFeatures) {
      const matchingImpl = this.findMatchingImplementation(docFeature);
      
      if (matchingImpl) {
        this.results.matches.push({
          documented: docFeature,
          implemented: matchingImpl,
          matchType: this.determineMatchType(docFeature, matchingImpl)
        });
      } else {
        this.results.mismatches.documentedButNotImplemented.push(docFeature);
      }
    }

    // Find implemented features without documentation
    for (const implFeature of this.results.implementedFeatures) {
      const hasDocumentation = this.results.documentedFeatures.some(doc => 
        this.featuresMatch(doc, implFeature)
      );
      
      if (!hasDocumentation) {
        this.results.mismatches.implementedButNotDocumented.push(implFeature);
      }
    }
  }

  findMatchingImplementation(docFeature) {
    return this.results.implementedFeatures.find(impl => 
      this.featuresMatch(docFeature, impl)
    );
  }

  featuresMatch(docFeature, implFeature) {
    const docName = docFeature.name.toLowerCase().replace(/[-_\s]/g, '');
    const implName = implFeature.name.toLowerCase().replace(/[-_\s]/g, '');
    
    // Direct name match
    if (docName.includes(implName) || implName.includes(docName)) {
      return true;
    }

    // Feature category match
    const categoryMatches = {
      'articles': ['article', 'blog', 'content'],
      'news': ['news', 'article'],
      'authentication': ['auth', 'login', 'user'],
      'community': ['community', 'social'],
      'courses': ['course', 'learning', 'education'],
      'certificates': ['certificate', 'nft', 'credential']
    };

    for (const [category, keywords] of Object.entries(categoryMatches)) {
      if (keywords.some(keyword => docName.includes(keyword) && implName.includes(keyword))) {
        return true;
      }
    }

    return false;
  }

  determineMatchType(docFeature, implFeature) {
    if (docFeature.status === 'completed' && implFeature.implemented) {
      return 'fully-implemented';
    } else if (docFeature.status === 'in-progress' && implFeature.implemented) {
      return 'partially-implemented';
    } else if (docFeature.status === 'not-started' && implFeature.implemented) {
      return 'implemented-but-not-updated';
    }
    return 'status-mismatch';
  }

  generateRecommendations() {
    const recommendations = [];

    // Recommendations for documented but not implemented features
    if (this.results.mismatches.documentedButNotImplemented.length > 0) {
      recommendations.push({
        type: 'implementation-gap',
        priority: 'high',
        count: this.results.mismatches.documentedButNotImplemented.length,
        message: 'Features are documented but not implemented',
        action: 'Review documented features and either implement them or update documentation to reflect current scope'
      });
    }

    // Recommendations for implemented but not documented features
    if (this.results.mismatches.implementedButNotDocumented.length > 0) {
      recommendations.push({
        type: 'documentation-gap',
        priority: 'medium',
        count: this.results.mismatches.implementedButNotDocumented.length,
        message: 'Features are implemented but not documented',
        action: 'Create documentation for implemented features to improve maintainability'
      });
    }

    // Recommendations for status mismatches
    const statusMismatches = this.results.matches.filter(m => m.matchType === 'implemented-but-not-updated');
    if (statusMismatches.length > 0) {
      recommendations.push({
        type: 'status-sync',
        priority: 'low',
        count: statusMismatches.length,
        message: 'Feature documentation status does not reflect implementation status',
        action: 'Update task statuses in specifications to reflect actual implementation'
      });
    }

    this.results.recommendations = recommendations;
  }

  async generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      projectPath: process.cwd(),
      summary: {
        totalDocumentedFeatures: this.results.documentedFeatures.length,
        totalImplementedFeatures: this.results.implementedFeatures.length,
        totalMatches: this.results.matches.length,
        documentedButNotImplemented: this.results.mismatches.documentedButNotImplemented.length,
        implementedButNotDocumented: this.results.mismatches.implementedButNotDocumented.length
      },
      analysis: this.results,
      recommendations: this.results.recommendations
    };

    // Write JSON report
    fs.writeFileSync(
      path.join(process.cwd(), 'docs-vs-implementation-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Write markdown report
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(
      path.join(process.cwd(), 'docs-vs-implementation-report.md'),
      markdown
    );
  }

  generateMarkdownReport(report) {
    return `# Documentation vs Implementation Comparison Report

Generated on: ${new Date(report.generatedAt).toLocaleString()}

## Executive Summary

- **Documented Features**: ${report.summary.totalDocumentedFeatures}
- **Implemented Features**: ${report.summary.totalImplementedFeatures}
- **Matching Features**: ${report.summary.totalMatches}
- **Documented but Not Implemented**: ${report.summary.documentedButNotImplemented}
- **Implemented but Not Documented**: ${report.summary.implementedButNotDocumented}

## Feature Matches

${this.results.matches.map(match => `
### ${match.documented.name}
- **Documentation**: ${match.documented.source}
- **Implementation**: ${match.implemented.path || match.implemented.name}
- **Match Type**: ${match.matchType}
`).join('\n')}

## Documentation Gaps

### Documented but Not Implemented (${report.summary.documentedButNotImplemented})
${this.results.mismatches.documentedButNotImplemented.map(feature => `
- **${feature.name}** (${feature.type})
  - Source: ${feature.source}
  - Status: ${feature.status || 'unknown'}
`).join('\n')}

### Implemented but Not Documented (${report.summary.implementedButNotDocumented})
${this.results.mismatches.implementedButNotDocumented.map(feature => `
- **${feature.name}** (${feature.type})
  - Path: ${feature.path || 'N/A'}
  - Category: ${feature.category}
`).join('\n')}

## Recommendations

${this.results.recommendations.map((rec, index) => `
### ${index + 1}. ${rec.type.toUpperCase()} - Priority: ${rec.priority.toUpperCase()}
**Issue**: ${rec.message} (${rec.count} items)
**Action**: ${rec.action}
`).join('\n')}

---
*This report was generated automatically by the Documentation vs Implementation Comparator*
`;
  }
}

// Run the comparison if this script is executed directly
if (require.main === module) {
  const comparator = new DocsImplementationComparator();
  comparator.compare().catch(console.error);
}

module.exports = DocsImplementationComparator;