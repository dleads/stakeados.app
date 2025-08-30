#!/usr/bin/env node

/**
 * Project Documentation Analysis Script
 * 
 * This script performs a comprehensive analysis of the project's documentation,
 * detects duplicates, and generates a status report comparing documentation vs implemented code.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ProjectDocumentationAnalyzer {
    constructor() {
        this.results = {
            duplicates: [],
            documentationFiles: [],
            specificationFiles: [],
            implementationStatus: {},
            summary: {}
        };
        this.processedFiles = new Map();
        this.fileHashes = new Map();
    }

    /**
     * Main analysis function
     */
    async analyze() {
        console.log('🔍 Starting project documentation analysis...\n');

        try {
            // Analyze documentation directories
            await this.analyzeDocs();
            await this.analyzeTododoc();
            await this.analyzeSpecs();

            // Detect duplicates
            this.detectDuplicates();

            // Analyze implementation status
            await this.analyzeImplementationStatus();

            // Generate summary
            this.generateSummary();

            // Generate report
            await this.generateReport();

            console.log('✅ Analysis completed successfully!');
            console.log(`📊 Report generated: project-analysis-report.json`);

        } catch (error) {
            console.error('❌ Error during analysis:', error.message);
            process.exit(1);
        }
    }

    /**
     * Analyze /docs directory
     */
    async analyzeDocs() {
        console.log('📁 Analyzing /docs directory...');
        const docsPath = path.join(process.cwd(), 'docs');

        if (fs.existsSync(docsPath)) {
            await this.analyzeDirectory(docsPath, 'docs');
        } else {
            console.log('⚠️  /docs directory not found');
        }
    }

    /**
     * Analyze /tododoc directory
     */
    async analyzeTododoc() {
        console.log('📁 Analyzing /tododoc directory...');
        const tododocPath = path.join(process.cwd(), 'tododoc');

        if (fs.existsSync(tododocPath)) {
            await this.analyzeDirectory(tododocPath, 'tododoc');
        } else {
            console.log('⚠️  /tododoc directory not found');
        }
    }

    /**
     * Analyze specifications in .kiro/specs and tododoc/specs
     */
    async analyzeSpecs() {
        console.log('📋 Analyzing specifications...');

        // Analyze .kiro/specs
        const kiroSpecsPath = path.join(process.cwd(), '.kiro', 'specs');
        if (fs.existsSync(kiroSpecsPath)) {
            await this.analyzeDirectory(kiroSpecsPath, 'kiro-specs');
        }

        // Analyze tododoc/specs
        const tododocSpecsPath = path.join(process.cwd(), 'tododoc', 'specs');
        if (fs.existsSync(tododocSpecsPath)) {
            await this.analyzeDirectory(tododocSpecsPath, 'tododoc-specs');
        }
    }

    /**
     * Recursively analyze a directory
     */
    async analyzeDirectory(dirPath, category) {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);

            if (file.isDirectory()) {
                await this.analyzeDirectory(fullPath, category);
            } else if (this.isDocumentationFile(file.name)) {
                await this.analyzeFile(fullPath, category);
            }
        }
    }

    /**
     * Check if file is a documentation file
     */
    isDocumentationFile(filename) {
        const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
        const ext = path.extname(filename).toLowerCase();
        return docExtensions.includes(ext);
    }

    /**
     * Analyze individual file
     */
    async analyzeFile(filePath, category) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const stats = fs.statSync(filePath);
            const hash = crypto.createHash('md5').update(content).digest('hex');

            const fileInfo = {
                path: filePath,
                relativePath: path.relative(process.cwd(), filePath),
                category,
                size: stats.size,
                lastModified: stats.mtime,
                hash,
                contentPreview: content.substring(0, 200).replace(/\n/g, ' '),
                lineCount: content.split('\n').length,
                wordCount: content.split(/\s+/).length
            };

            // Store file info
            if (category.includes('spec')) {
                this.results.specificationFiles.push(fileInfo);
            } else {
                this.results.documentationFiles.push(fileInfo);
            }

            // Store hash for duplicate detection
            if (!this.fileHashes.has(hash)) {
                this.fileHashes.set(hash, []);
            }
            this.fileHashes.get(hash).push(fileInfo);

        } catch (error) {
            console.error(`❌ Error analyzing file ${filePath}:`, error.message);
        }
    }

    /**
     * Detect duplicate files based on content hash
     */
    detectDuplicates() {
        console.log('🔍 Detecting duplicate files...');

        for (const [hash, files] of this.fileHashes) {
            if (files.length > 1) {
                this.results.duplicates.push({
                    hash,
                    files: files.map(f => ({
                        path: f.relativePath,
                        category: f.category,
                        size: f.size,
                        lastModified: f.lastModified
                    }))
                });
            }
        }

        console.log(`📊 Found ${this.results.duplicates.length} sets of duplicate files`);
    }

    /**
     * Analyze implementation status by comparing docs with actual code
     */
    async analyzeImplementationStatus() {
        console.log('🔧 Analyzing implementation status...');

        // Check if key directories exist
        const srcPath = path.join(process.cwd(), 'src');
        const componentsPath = path.join(srcPath, 'components');
        const pagesPath = path.join(srcPath, 'app');

        this.results.implementationStatus = {
            srcExists: fs.existsSync(srcPath),
            componentsExists: fs.existsSync(componentsPath),
            pagesExists: fs.existsSync(pagesPath),
            packageJsonExists: fs.existsSync(path.join(process.cwd(), 'package.json')),
            nextConfigExists: fs.existsSync(path.join(process.cwd(), 'next.config.js')),
            supabaseConfigExists: fs.existsSync(path.join(process.cwd(), 'supabase', 'config.toml'))
        };

        // Analyze package.json for implemented features
        if (this.results.implementationStatus.packageJsonExists) {
            const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
            this.results.implementationStatus.dependencies = Object.keys(packageJson.dependencies || {});
            this.results.implementationStatus.devDependencies = Object.keys(packageJson.devDependencies || {});
        }

        // Check for specific feature implementations
        await this.checkFeatureImplementations();
    }

    /**
     * Check for specific feature implementations mentioned in docs
     */
    async checkFeatureImplementations() {
        const features = {
            authentication: this.checkAuthImplementation(),
            articles: this.checkArticlesImplementation(),
            community: this.checkCommunityImplementation(),
            news: this.checkNewsImplementation(),
            courses: this.checkCoursesImplementation(),
            nfts: this.checkNFTImplementation(),
            rbac: this.checkRBACImplementation()
        };

        this.results.implementationStatus.features = features;
    }

    checkAuthImplementation() {
        const authFiles = [
            'src/lib/supabase/auth.ts',
            'src/lib/supabase/client.ts',
            'src/lib/supabase/server.ts'
        ];

        return {
            implemented: authFiles.some(file => fs.existsSync(path.join(process.cwd(), file))),
            files: authFiles.filter(file => fs.existsSync(path.join(process.cwd(), file)))
        };
    }

    checkArticlesImplementation() {
        const articlePaths = [
            'src/app/articles',
            'src/components/articles'
        ];

        return {
            implemented: articlePaths.some(dir => fs.existsSync(path.join(process.cwd(), dir))),
            paths: articlePaths.filter(dir => fs.existsSync(path.join(process.cwd(), dir)))
        };
    }

    checkCommunityImplementation() {
        const communityPaths = [
            'src/app/community',
            'src/components/community'
        ];

        return {
            implemented: communityPaths.some(dir => fs.existsSync(path.join(process.cwd(), dir))),
            paths: communityPaths.filter(dir => fs.existsSync(path.join(process.cwd(), dir)))
        };
    }

    checkNewsImplementation() {
        const newsPaths = [
            'src/app/news',
            'src/components/news'
        ];

        return {
            implemented: newsPaths.some(dir => fs.existsSync(path.join(process.cwd(), dir))),
            paths: newsPaths.filter(dir => fs.existsSync(path.join(process.cwd(), dir)))
        };
    }

    checkCoursesImplementation() {
        const coursesPaths = [
            'src/app/courses',
            'src/components/courses'
        ];

        return {
            implemented: coursesPaths.some(dir => fs.existsSync(path.join(process.cwd(), dir))),
            paths: coursesPaths.filter(dir => fs.existsSync(path.join(process.cwd(), dir)))
        };
    }

    checkNFTImplementation() {
        const nftFiles = [
            'contracts/StakeadosCertificate.sol',
            'contracts/StakeadosCitizenship.sol'
        ];

        return {
            implemented: nftFiles.some(file => fs.existsSync(path.join(process.cwd(), file))),
            files: nftFiles.filter(file => fs.existsSync(path.join(process.cwd(), file)))
        };
    }

    checkRBACImplementation() {
        // Check for role-based access control implementation
        const rbacIndicators = [
            'src/lib/auth/roles.ts',
            'src/lib/auth/permissions.ts',
            'src/middleware.ts'
        ];

        return {
            implemented: rbacIndicators.some(file => fs.existsSync(path.join(process.cwd(), file))),
            files: rbacIndicators.filter(file => fs.existsSync(path.join(process.cwd(), file)))
        };
    }

    /**
     * Generate analysis summary
     */
    generateSummary() {
        console.log('📊 Generating summary...');

        this.results.summary = {
            totalDocumentationFiles: this.results.documentationFiles.length,
            totalSpecificationFiles: this.results.specificationFiles.length,
            totalDuplicateSets: this.results.duplicates.length,
            totalDuplicateFiles: this.results.duplicates.reduce((sum, dup) => sum + dup.files.length, 0),
            documentationByCategory: this.groupByCategory(this.results.documentationFiles),
            specificationsByCategory: this.groupByCategory(this.results.specificationFiles),
            implementedFeatures: Object.entries(this.results.implementationStatus.features || {})
                .filter(([_, feature]) => feature.implemented).length,
            totalFeatures: Object.keys(this.results.implementationStatus.features || {}).length
        };
    }

    groupByCategory(files) {
        return files.reduce((acc, file) => {
            acc[file.category] = (acc[file.category] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Generate comprehensive report
     */
    async generateReport() {
        console.log('📝 Generating comprehensive report...');

        const report = {
            generatedAt: new Date().toISOString(),
            projectPath: process.cwd(),
            analysis: this.results,
            recommendations: this.generateRecommendations()
        };

        // Write JSON report
        fs.writeFileSync(
            path.join(process.cwd(), 'project-analysis-report.json'),
            JSON.stringify(report, null, 2)
        );

        // Write human-readable report
        await this.generateHumanReadableReport(report);
    }

    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations() {
        const recommendations = [];

        // Duplicate files recommendations
        if (this.results.duplicates.length > 0) {
            recommendations.push({
                type: 'duplicates',
                priority: 'high',
                message: `Found ${this.results.duplicates.length} sets of duplicate files. Consider consolidating or removing duplicates.`,
                action: 'Review duplicate files and merge or remove unnecessary copies'
            });
        }

        // Documentation organization recommendations
        if (this.results.documentationFiles.some(f => f.category === 'tododoc')) {
            recommendations.push({
                type: 'organization',
                priority: 'medium',
                message: 'Documentation is scattered between /docs and /tododoc directories.',
                action: 'Consolidate documentation into a single /docs directory structure'
            });
        }

        // Implementation status recommendations
        const implementedFeatures = Object.entries(this.results.implementationStatus.features || {})
            .filter(([_, feature]) => feature.implemented).length;
        const totalFeatures = Object.keys(this.results.implementationStatus.features || {}).length;

        if (implementedFeatures < totalFeatures) {
            recommendations.push({
                type: 'implementation',
                priority: 'medium',
                message: `${totalFeatures - implementedFeatures} features appear to be documented but not fully implemented.`,
                action: 'Review and update documentation to reflect actual implementation status'
            });
        }

        return recommendations;
    }

    /**
     * Generate human-readable markdown report
     */
    async generateHumanReadableReport(report) {
        const markdown = `# Project Documentation Analysis Report

Generated on: ${new Date(report.generatedAt).toLocaleString()}
Project Path: \`${report.projectPath}\`

## Executive Summary

- **Total Documentation Files**: ${report.analysis.summary.totalDocumentationFiles}
- **Total Specification Files**: ${report.analysis.summary.totalSpecificationFiles}
- **Duplicate File Sets**: ${report.analysis.summary.totalDuplicateSets}
- **Total Duplicate Files**: ${report.analysis.summary.totalDuplicateFiles}
- **Implemented Features**: ${report.analysis.summary.implementedFeatures}/${report.analysis.summary.totalFeatures}

## Documentation Distribution

### By Category
${Object.entries(report.analysis.summary.documentationByCategory)
                .map(([category, count]) => `- **${category}**: ${count} files`)
                .join('\n')}

### Specifications by Category
${Object.entries(report.analysis.summary.specificationsByCategory)
                .map(([category, count]) => `- **${category}**: ${count} files`)
                .join('\n')}

## Duplicate Files Analysis

${report.analysis.duplicates.length === 0 ?
                '✅ No duplicate files detected.' :
                report.analysis.duplicates.map((dup, index) => `
### Duplicate Set ${index + 1}
${dup.files.map(file => `- \`${file.path}\` (${file.category}, ${file.size} bytes)`).join('\n')}
`).join('\n')
            }

## Implementation Status

### Core Infrastructure
- **Source Directory**: ${report.analysis.implementationStatus.srcExists ? '✅' : '❌'}
- **Components Directory**: ${report.analysis.implementationStatus.componentsExists ? '✅' : '❌'}
- **Pages Directory**: ${report.analysis.implementationStatus.pagesExists ? '✅' : '❌'}
- **Package.json**: ${report.analysis.implementationStatus.packageJsonExists ? '✅' : '❌'}
- **Next.js Config**: ${report.analysis.implementationStatus.nextConfigExists ? '✅' : '❌'}
- **Supabase Config**: ${report.analysis.implementationStatus.supabaseConfigExists ? '✅' : '❌'}

### Feature Implementation Status
${Object.entries(report.analysis.implementationStatus.features || {})
                .map(([feature, status]) => `- **${feature}**: ${status.implemented ? '✅ Implemented' : '❌ Not Implemented'}`)
                .join('\n')}

## Recommendations

${report.recommendations.map((rec, index) => `
### ${index + 1}. ${rec.type.toUpperCase()} - Priority: ${rec.priority.toUpperCase()}
**Issue**: ${rec.message}
**Action**: ${rec.action}
`).join('\n')}

## Next Steps

1. **Review Duplicate Files**: Examine duplicate file sets and consolidate or remove unnecessary copies
2. **Organize Documentation**: Move all documentation to a centralized structure
3. **Update Implementation Status**: Ensure documentation reflects actual code implementation
4. **Create Missing Documentation**: Document implemented features that lack documentation
5. **Archive Legacy Files**: Move outdated files to an archive directory

---
*This report was generated automatically by the Project Documentation Analyzer*
`;

        fs.writeFileSync(
            path.join(process.cwd(), 'project-analysis-report.md'),
            markdown
        );
    }
}

// Run the analysis if this script is executed directly
if (require.main === module) {
    const analyzer = new ProjectDocumentationAnalyzer();
    analyzer.analyze().catch(console.error);
}

module.exports = ProjectDocumentationAnalyzer;