import { test, expect } from '@playwright/test';

test.describe('SEO Tests', () => {
  test('should have proper meta tags on home page', async ({ page }) => {
    await page.goto('/en');

    // Check title
    await expect(page).toHaveTitle(/Stakeados/);

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    const ogImage = page.locator('meta[property="og:image"]');

    await expect(ogTitle).toHaveAttribute('content', /.+/);
    await expect(ogDescription).toHaveAttribute('content', /.+/);
    await expect(ogImage).toHaveAttribute('content', /.+/);

    // Check Twitter Card tags
    const twitterCard = page.locator('meta[name="twitter:card"]');
    const twitterTitle = page.locator('meta[name="twitter:title"]');

    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
    await expect(twitterTitle).toHaveAttribute('content', /.+/);
  });

  test('should have proper canonical URLs', async ({ page }) => {
    await page.goto('/en');

    const canonical = page.locator('link[rel="canonical"]');
    const href = await canonical.getAttribute('href');

    expect(href).toContain('/en');
  });

  test('should have proper language alternates', async ({ page }) => {
    await page.goto('/en');

    // Check for hreflang tags
    const englishAlternate = page.locator('link[hreflang="en"]');
    const spanishAlternate = page.locator('link[hreflang="es"]');
    const defaultAlternate = page.locator('link[hreflang="x-default"]');

    await expect(englishAlternate).toHaveAttribute('href', /\/en/);
    await expect(spanishAlternate).toHaveAttribute('href', /\/es/);
    await expect(defaultAlternate).toHaveAttribute('href', /\/en/);
  });

  test('should have proper structured data', async ({ page }) => {
    await page.goto('/en');

    // Check for JSON-LD structured data
    const structuredData = page.locator('script[type="application/ld+json"]');

    if ((await structuredData.count()) > 0) {
      const content = await structuredData.first().textContent();
      expect(() => JSON.parse(content || '')).not.toThrow();
    }
  });

  test('should have proper robots meta tag', async ({ page }) => {
    await page.goto('/en');

    const robotsMeta = page.locator('meta[name="robots"]');
    const content = await robotsMeta.getAttribute('content');

    // Should allow indexing for public pages
    expect(content).toContain('index');
    expect(content).toContain('follow');
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/en');

    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Check heading hierarchy
    const h1 = page.locator('h1').first();
    const h1Text = await h1.textContent();
    expect(h1Text?.trim()).toBeTruthy();
  });

  test('should have proper sitemap accessibility', async ({ page }) => {
    // Check if sitemap exists
    const sitemapResponse = await page.request.get('/sitemap.xml');
    expect(sitemapResponse.status()).toBe(200);

    const sitemapContent = await sitemapResponse.text();
    expect(sitemapContent).toContain('<?xml');
    expect(sitemapContent).toContain('<urlset');
  });

  test('should have proper robots.txt', async ({ page }) => {
    const robotsResponse = await page.request.get('/robots.txt');
    expect(robotsResponse.status()).toBe(200);

    const robotsContent = await robotsResponse.text();
    expect(robotsContent).toContain('User-agent:');
    expect(robotsContent).toContain('Sitemap:');
  });

  test('should have fast loading times', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have proper meta viewport', async ({ page }) => {
    await page.goto('/en');

    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute('content');

    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1');
  });

  test('should have proper favicon', async ({ page }) => {
    await page.goto('/en');

    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveAttribute('href', /.+/);
  });

  test('should work with different locales', async ({ page }) => {
    // Test English
    await page.goto('/en');
    await expect(page).toHaveTitle(/Stakeados/);

    // Test Spanish
    await page.goto('/es');
    await expect(page).toHaveTitle(/Stakeados/);

    // Check language-specific content
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'es');
  });
});
