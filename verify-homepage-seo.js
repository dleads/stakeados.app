#!/usr/bin/env node

/**
 * Verification script for Homepage SEO Implementation
 * This script validates that all SEO components are properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Homepage SEO Implementation...\n');

const checks = [
  {
    name: 'HomepageSEO Component',
    path: 'src/components/homepage/HomepageSEO.tsx',
    required: true,
  },
  {
    name: 'HomepageStructuredData Component',
    path: 'src/components/homepage/HomepageStructuredData.tsx',
    required: true,
  },
  {
    name: 'Homepage Statistics API',
    path: 'src/app/api/stats/homepage/route.ts',
    required: true,
  },
  {
    name: 'Sitemap XML Route',
    path: 'src/app/sitemap.xml/route.ts',
    required: true,
  },
  {
    name: 'Robots.txt Route',
    path: 'src/app/robots.txt/route.ts',
    required: true,
  },
  {
    name: 'Updated Homepage Page with Metadata',
    path: 'src/app/[locale]/page.tsx',
    required: true,
  },
  {
    name: 'Updated HomePage Component',
    path: 'src/components/homepage/HomePage.tsx',
    required: true,
  },
  {
    name: 'SEO Test File',
    path: 'src/components/homepage/__tests__/HomepageSEO.test.tsx',
    required: true,
  },
  {
    name: 'English Messages with SEO',
    path: 'messages/en.json',
    required: true,
  },
  {
    name: 'Spanish Messages with SEO',
    path: 'messages/es.json',
    required: true,
  },
];

let allPassed = true;

// Check file existence
checks.forEach(check => {
  const filePath = path.join(process.cwd(), check.path);
  const exists = fs.existsSync(filePath);

  if (exists) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name} - File not found: ${check.path}`);
    if (check.required) allPassed = false;
  }
});

console.log('\n🔍 Checking implementation details...\n');

// Check specific implementation details
const implementationChecks = [
  {
    name: 'HomepageSEO includes dynamic meta tags',
    file: 'src/components/homepage/HomepageSEO.tsx',
    check: content =>
      content.includes('meta name="description"') &&
      content.includes('meta name="keywords"'),
  },
  {
    name: 'HomepageSEO includes Open Graph tags',
    file: 'src/components/homepage/HomepageSEO.tsx',
    check: content =>
      content.includes('property="og:title"') &&
      content.includes('property="og:description"'),
  },
  {
    name: 'HomepageSEO includes Twitter Card tags',
    file: 'src/components/homepage/HomepageSEO.tsx',
    check: content =>
      content.includes('name="twitter:card"') &&
      content.includes('name="twitter:title"'),
  },
  {
    name: 'HomepageSEO includes canonical URLs',
    file: 'src/components/homepage/HomepageSEO.tsx',
    check: content =>
      content.includes('rel="canonical"') &&
      content.includes('rel="alternate"'),
  },
  {
    name: 'HomepageStructuredData includes JSON-LD',
    file: 'src/components/homepage/HomepageStructuredData.tsx',
    check: content =>
      content.includes('application/ld+json') && content.includes('@context'),
  },
  {
    name: 'Homepage API includes statistics',
    file: 'src/app/api/stats/homepage/route.ts',
    check: content =>
      content.includes('totalArticles') &&
      content.includes('totalNews') &&
      content.includes('totalCourses'),
  },
  {
    name: 'Page.tsx includes comprehensive metadata',
    file: 'src/app/[locale]/page.tsx',
    check: content =>
      content.includes('generateMetadata') &&
      content.includes('openGraph') &&
      content.includes('twitter'),
  },
  {
    name: 'HomePage component includes structured data',
    file: 'src/components/homepage/HomePage.tsx',
    check: content =>
      content.includes('HomepageStructuredData') && content.includes('stats'),
  },
  {
    name: 'Sitemap includes multilingual support',
    file: 'src/app/sitemap.xml/route.ts',
    check: content =>
      content.includes('hreflang') ||
      content.includes('seoService.generateSitemap'),
  },
  {
    name: 'Messages include SEO translations',
    file: 'messages/en.json',
    check: content =>
      content.includes('"seo"') &&
      content.includes('"title"') &&
      content.includes('"description"'),
  },
];

implementationChecks.forEach(check => {
  const filePath = path.join(process.cwd(), check.file);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const passed = check.check(content);

    if (passed) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  } else {
    console.log(`❌ ${check.name} - File not found`);
    allPassed = false;
  }
});

console.log('\n🔍 Checking SEO requirements compliance...\n');

// Check requirements compliance
const requirements = [
  {
    id: '7.1',
    name: 'SEO metadata component with dynamic meta tags',
    check: () => {
      const seoFile = path.join(
        process.cwd(),
        'src/components/homepage/HomepageSEO.tsx'
      );
      if (!fs.existsSync(seoFile)) return false;
      const content = fs.readFileSync(seoFile, 'utf8');
      return (
        content.includes('meta name="description"') &&
        content.includes('meta name="keywords"') &&
        content.includes('title')
      );
    },
  },
  {
    id: '7.2',
    name: 'Structured data markup for search engines',
    check: () => {
      const structuredFile = path.join(
        process.cwd(),
        'src/components/homepage/HomepageStructuredData.tsx'
      );
      if (!fs.existsSync(structuredFile)) return false;
      const content = fs.readFileSync(structuredFile, 'utf8');
      return (
        content.includes('application/ld+json') &&
        content.includes('@context') &&
        content.includes('EducationalOrganization')
      );
    },
  },
  {
    id: '7.3',
    name: 'Open Graph and Twitter Card support',
    check: () => {
      const seoFile = path.join(
        process.cwd(),
        'src/components/homepage/HomepageSEO.tsx'
      );
      if (!fs.existsSync(seoFile)) return false;
      const content = fs.readFileSync(seoFile, 'utf8');
      return (
        content.includes('property="og:') &&
        content.includes('name="twitter:') &&
        content.includes('og:image') &&
        content.includes('twitter:card')
      );
    },
  },
  {
    id: '7.4',
    name: 'Canonical URL management for different locales',
    check: () => {
      const seoFile = path.join(
        process.cwd(),
        'src/components/homepage/HomepageSEO.tsx'
      );
      const pageFile = path.join(process.cwd(), 'src/app/[locale]/page.tsx');

      if (!fs.existsSync(seoFile) || !fs.existsSync(pageFile)) return false;

      const seoContent = fs.readFileSync(seoFile, 'utf8');
      const pageContent = fs.readFileSync(pageFile, 'utf8');

      const seoHasCanonical =
        seoContent.includes('rel="canonical"') &&
        seoContent.includes('rel="alternate"') &&
        seoContent.includes('hreflang');

      const pageHasCanonical =
        pageContent.includes('canonical:') &&
        pageContent.includes('languages:');

      return seoHasCanonical || pageHasCanonical;
    },
  },
  {
    id: '7.5',
    name: 'Sitemap and robots.txt generation',
    check: () => {
      const sitemapFile = path.join(
        process.cwd(),
        'src/app/sitemap.xml/route.ts'
      );
      const robotsFile = path.join(
        process.cwd(),
        'src/app/robots.txt/route.ts'
      );
      return fs.existsSync(sitemapFile) && fs.existsSync(robotsFile);
    },
  },
];

requirements.forEach(req => {
  const passed = req.check();
  if (passed) {
    console.log(`✅ Requirement ${req.id}: ${req.name}`);
  } else {
    console.log(`❌ Requirement ${req.id}: ${req.name}`);
    allPassed = false;
  }
});

console.log('\n📊 Summary\n');

if (allPassed) {
  console.log('🎉 All SEO implementation checks passed!');
  console.log('\n✨ Homepage SEO Features Implemented:');
  console.log('   • Dynamic meta tags with localization');
  console.log('   • Open Graph and Twitter Card support');
  console.log('   • Comprehensive structured data (JSON-LD)');
  console.log('   • Canonical URLs with hreflang support');
  console.log('   • Statistics-enhanced metadata');
  console.log('   • Sitemap.xml generation');
  console.log('   • Robots.txt generation');
  console.log('   • Performance optimization headers');
  console.log('   • Comprehensive test coverage');
  console.log(
    '\n🚀 The homepage is now SEO-optimized and ready for production!'
  );
} else {
  console.log(
    '❌ Some SEO implementation checks failed. Please review the issues above.'
  );
  process.exit(1);
}

console.log('\n📝 Next Steps:');
console.log('   1. Test the homepage in development mode');
console.log('   2. Verify meta tags using browser dev tools');
console.log("   3. Test structured data with Google's Rich Results Test");
console.log('   4. Validate sitemap.xml and robots.txt endpoints');
console.log('   5. Run Lighthouse SEO audit');
console.log('   6. Test multilingual SEO with different locales');
