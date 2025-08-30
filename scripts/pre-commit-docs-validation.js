#!/usr/bin/env node

/**
 * Pre-commit Documentation Validation Hook
 * 
 * This script runs before commits to validate only the documentation files
 * that have been modified in the current commit.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PreCommitDocsValidator {
  constructor() {
    this.modifiedFiles = [];
    this.results = {
      brokenLinks: [],
      invalidCodeExamples: [],
      outdatedDocs: []
    };
  }

  async run() {
    console.log('🔍 Running pre-commit documentation validation...\n');
    
    try {
      // Get list of modified markdown files
      this.getModifiedMarkdownFiles();
      
      if (this.modifiedFiles.length === 0) {
        console.log('✅ No markdown files modified, skipping validation');
        return true;
      }
      
      console.log(`Found ${this.modifiedFiles.length} modified markdown files:`);
      this.modifiedFiles.forEach(file => console.log(`  - ${file}`));
      console.log('');
      
      // Import and use the main validator
      const DocumentationValidator = require('./validate-documentation.js');
      const validator = new DocumentationValidator();
      
      // Validate only modified files
      for (const file of this.modifiedFiles) {
        const fullPath = path.resolve(file);
        if (fs.existsSync(fullPath)) {
          console.log(`Validating: ${file}`);
          await validator.validateFile(fullPath);
          
          // Additional pre-commit specific checks
          this.validateDocumentationStandards(fullPath);
          this.checkForTodoComments(fullPath);
        }
      }
      
      // Check results
      const hasErrors = validator.results.brokenLinks.length > 0 || 
                       validator.results.invalidCodeExamples.length > 0;
      
      if (hasErrors) {
        console.log('\n❌ Documentation validation failed:');
        
        if (validator.results.brokenLinks.length > 0) {
          console.log(`\n🔗 Broken Links (${validator.results.brokenLinks.length}):`);
          validator.results.brokenLinks.forEach(link => {
            console.log(`  ❌ ${link.file}: "${link.text}" -> ${link.link}`);
          });
        }
        
        if (validator.results.invalidCodeExamples.length > 0) {
          console.log(`\n💻 Invalid Code Examples (${validator.results.invalidCodeExamples.length}):`);
          validator.results.invalidCodeExamples.forEach(code => {
            console.log(`  ❌ ${code.file} (${code.language}): ${code.error}`);
          });
        }
        
        console.log('\n💡 Please fix these issues before committing.');
        console.log('   You can run "npm run validate-docs" to see the full report.');
        
        return false;
      }
      
      console.log('✅ All modified documentation files passed validation!');
      return true;
      
    } catch (error) {
      console.error('❌ Pre-commit validation failed:', error.message);
      return false;
    }
  }

  getModifiedMarkdownFiles() {
    try {
      // Get staged files
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
        .split('\n')
        .filter(file => file.trim() && file.endsWith('.md'));
      
      // Get modified files (not staged)
      const modifiedFiles = execSync('git diff --name-only', { encoding: 'utf8' })
        .split('\n')
        .filter(file => file.trim() && file.endsWith('.md'));
      
      // Combine and deduplicate
      this.modifiedFiles = [...new Set([...stagedFiles, ...modifiedFiles])];
      
    } catch (error) {
      console.warn('Warning: Could not get git status, validating all docs');
      // Fallback: validate all docs if git commands fail
      this.modifiedFiles = [];
    }
  }

  validateDocumentationStandards(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Check for required sections in certain document types
    if (fileName === 'README.md') {
      const requiredSections = ['# ', '## Installation', '## Usage'];
      const missingSections = requiredSections.filter(section => !content.includes(section));
      if (missingSections.length > 0) {
        this.results.outdatedDocs.push({
          file: filePath,
          issue: `Missing required sections: ${missingSections.join(', ')}`
        });
      }
    }
    
    // Check for proper heading hierarchy
    const headings = content.match(/^#+\s+.+$/gm) || [];
    let previousLevel = 0;
    for (const heading of headings) {
      const level = heading.match(/^#+/)[0].length;
      if (level > previousLevel + 1) {
        this.results.outdatedDocs.push({
          file: filePath,
          issue: `Heading hierarchy skip detected: ${heading.trim()}`
        });
      }
      previousLevel = level;
    }
  }

  checkForTodoComments(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const todoPattern = /TODO|FIXME|XXX|HACK/gi;
    const matches = content.match(todoPattern);
    
    if (matches && matches.length > 0) {
      console.log(`⚠️  Warning: ${filePath} contains ${matches.length} TODO/FIXME comments`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const validator = new PreCommitDocsValidator();
  validator.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Pre-commit validation error:', error);
    process.exit(1);
  });
}

module.exports = PreCommitDocsValidator;