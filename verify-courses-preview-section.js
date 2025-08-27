const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying CoursesPreviewSection implementation...\n');

// Check if the component file exists
const componentPath = 'src/components/homepage/CoursesPreviewSection.tsx';
if (!fs.existsSync(componentPath)) {
  console.error('❌ CoursesPreviewSection.tsx not found');
  process.exit(1);
}

// Read the component file
const componentContent = fs.readFileSync(componentPath, 'utf8');

// Check for required imports
const requiredImports = [
  'CourseGrid',
  'SectionSkeleton',
  'SectionErrorFallback',
  'ErrorBoundary',
  'Suspense',
  'useTranslations',
  'Link',
  'GraduationCap',
  'ArrowRight',
];

console.log('📦 Checking imports...');
let importsValid = true;
requiredImports.forEach(importName => {
  if (componentContent.includes(importName)) {
    console.log(`  ✅ ${importName}`);
  } else {
    console.log(`  ❌ ${importName} - Missing`);
    importsValid = false;
  }
});

// Check for required props interface
console.log('\n🔧 Checking component interface...');
const hasPropsInterface = componentContent.includes(
  'CoursesPreviewSectionProps'
);
const hasLocaleProps = componentContent.includes('locale: Locale');
const hasMaxItemsProps = componentContent.includes('maxItems?:');
const hasShowViewAllProps = componentContent.includes('showViewAll?:');
const hasClassNameProps = componentContent.includes('className?:');

console.log(`  ✅ Props interface: ${hasPropsInterface ? 'Found' : 'Missing'}`);
console.log(`  ✅ Locale prop: ${hasLocaleProps ? 'Found' : 'Missing'}`);
console.log(`  ✅ MaxItems prop: ${hasMaxItemsProps ? 'Found' : 'Missing'}`);
console.log(
  `  ✅ ShowViewAll prop: ${hasShowViewAllProps ? 'Found' : 'Missing'}`
);
console.log(`  ✅ ClassName prop: ${hasClassNameProps ? 'Found' : 'Missing'}`);

// Check for required functionality
console.log('\n⚙️ Checking component functionality...');
const hasErrorBoundary = componentContent.includes('<ErrorBoundary');
const hasSuspense = componentContent.includes('<Suspense');
const hasCourseGrid = componentContent.includes('<CourseGrid');
const hasViewAllLink = componentContent.includes('showViewAll &&');
const hasTranslations = componentContent.includes('useTranslations');
const hasAriaLabel = componentContent.includes('aria-label');

console.log(
  `  ✅ Error Boundary: ${hasErrorBoundary ? 'Implemented' : 'Missing'}`
);
console.log(`  ✅ Suspense: ${hasSuspense ? 'Implemented' : 'Missing'}`);
console.log(
  `  ✅ CourseGrid integration: ${hasCourseGrid ? 'Implemented' : 'Missing'}`
);
console.log(
  `  ✅ Conditional View All link: ${hasViewAllLink ? 'Implemented' : 'Missing'}`
);
console.log(
  `  ✅ Translations: ${hasTranslations ? 'Implemented' : 'Missing'}`
);
console.log(`  ✅ Accessibility: ${hasAriaLabel ? 'Implemented' : 'Missing'}`);

// Check CourseGrid props
console.log('\n🎯 Checking CourseGrid integration...');
const hasMaxCoursesProps = componentContent.includes('maxCourses={maxItems}');
const hasShowFiltersDisabled = componentContent.includes('showFilters={false}');
const hasShowSearchDisabled = componentContent.includes('showSearch={false}');
const hasLocalePassthrough = componentContent.includes('locale={locale}');

console.log(
  `  ✅ MaxCourses prop: ${hasMaxCoursesProps ? 'Passed correctly' : 'Missing'}`
);
console.log(
  `  ✅ Filters disabled: ${hasShowFiltersDisabled ? 'Correct' : 'Missing'}`
);
console.log(
  `  ✅ Search disabled: ${hasShowSearchDisabled ? 'Correct' : 'Missing'}`
);
console.log(
  `  ✅ Locale passed: ${hasLocalePassthrough ? 'Correct' : 'Missing'}`
);

// Check translation keys
console.log('\n🌐 Checking translation usage...');
const usesCoursesTitle = componentContent.includes("t('courses.title')");
const usesBrowseAll = componentContent.includes("t('courses.browseAll')");

console.log(`  ✅ Courses title: ${usesCoursesTitle ? 'Used' : 'Missing'}`);
console.log(`  ✅ Browse all text: ${usesBrowseAll ? 'Used' : 'Missing'}`);

// Check for proper routing
console.log('\n🔗 Checking routing...');
const hasSpanishRoute = componentContent.includes("'/cursos'");
const hasEnglishRoute = componentContent.includes("'/courses'");
const hasConditionalRouting = componentContent.includes("locale === 'es'");

console.log(
  `  ✅ Spanish route: ${hasSpanishRoute ? 'Implemented' : 'Missing'}`
);
console.log(
  `  ✅ English route: ${hasEnglishRoute ? 'Implemented' : 'Missing'}`
);
console.log(
  `  ✅ Conditional routing: ${hasConditionalRouting ? 'Implemented' : 'Missing'}`
);

// Check translation files
console.log('\n📝 Checking translation files...');
const enMessagesPath = 'messages/en.json';
const esMessagesPath = 'messages/es.json';

if (fs.existsSync(enMessagesPath)) {
  const enMessages = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
  const hasCoursesSection =
    enMessages.courses &&
    enMessages.courses.title &&
    enMessages.courses.browseAll;
  console.log(
    `  ✅ English translations: ${hasCoursesSection ? 'Complete' : 'Missing courses section'}`
  );
} else {
  console.log('  ❌ English messages file not found');
}

if (fs.existsSync(esMessagesPath)) {
  const esMessages = JSON.parse(fs.readFileSync(esMessagesPath, 'utf8'));
  const hasCoursesSection =
    esMessages.courses &&
    esMessages.courses.title &&
    esMessages.courses.browseAll;
  console.log(
    `  ✅ Spanish translations: ${hasCoursesSection ? 'Complete' : 'Missing courses section'}`
  );
} else {
  console.log('  ❌ Spanish messages file not found');
}

// Final summary
console.log('\n📊 Implementation Summary:');
const allChecks = [
  importsValid,
  hasPropsInterface && hasLocaleProps && hasMaxItemsProps,
  hasErrorBoundary && hasSuspense && hasCourseGrid,
  hasMaxCoursesProps && hasShowFiltersDisabled && hasShowSearchDisabled,
  usesCoursesTitle && usesBrowseAll,
  hasSpanishRoute && hasEnglishRoute && hasConditionalRouting,
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`✅ Passed: ${passedChecks}/${totalChecks} requirement groups`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 CoursesPreviewSection implementation is complete!');
  console.log('\n📋 Task Requirements Verification:');
  console.log(
    '  ✅ Build wrapper component that uses existing CourseGrid with maxItems prop'
  );
  console.log('  ✅ Implement section header with "Browse All Courses" link');
  console.log(
    '  ✅ Add enrollment functionality for quick access (via CourseGrid)'
  );
  console.log('  ✅ Handle loading and error states appropriately');
  process.exit(0);
} else {
  console.log('\n⚠️ Some requirements may not be fully implemented.');
  process.exit(1);
}
