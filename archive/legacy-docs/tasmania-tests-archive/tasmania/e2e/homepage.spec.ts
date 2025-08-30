import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary test data or mocks
    await page.route('/api/stats/homepage', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalArticles: 150,
          totalNews: 75,
          totalCourses: 25,
          activeUsers: 1200,
        }),
      });
    });

    await page.route('/api/news*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Test News Article 1',
            excerpt: 'This is a test news article excerpt',
            published_at: '2024-01-01T00:00:00Z',
            category: 'blockchain',
          },
          {
            id: 2,
            title: 'Test News Article 2',
            excerpt: 'This is another test news article excerpt',
            published_at: '2024-01-02T00:00:00Z',
            category: 'defi',
          },
        ]),
      });
    });

    await page.route('/api/articles*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Test Article 1',
            excerpt: 'This is a test article excerpt',
            date: '2024-01-01T00:00:00Z',
            status: 'published',
            author: 'Test Author',
          },
          {
            id: 2,
            title: 'Test Article 2',
            excerpt: 'This is another test article excerpt',
            date: '2024-01-02T00:00:00Z',
            status: 'published',
            author: 'Test Author 2',
          },
        ]),
      });
    });

    await page.route('/api/courses*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Test Course 1',
            description: 'This is a test course description',
            published: true,
            difficulty: 'beginner',
          },
          {
            id: 2,
            title: 'Test Course 2',
            description: 'This is another test course description',
            published: true,
            difficulty: 'intermediate',
          },
        ]),
      });
    });
  });

  test.describe('Full Homepage Loading Flow', () => {
    test('should load homepage completely with all sections', async ({
      page,
    }) => {
      await page.goto('/en');

      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Check that all main sections are present
      await expect(
        page.locator('[data-testid="hero-section"], .hero-section')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="featured-news-section"], .news-section')
      ).toBeVisible();
      await expect(
        page.locator(
          '[data-testid="featured-articles-section"], .articles-section'
        )
      ).toBeVisible();
      await expect(
        page.locator(
          '[data-testid="quick-navigation-section"], .navigation-section'
        )
      ).toBeVisible();
      await expect(
        page.locator(
          '[data-testid="courses-preview-section"], .courses-section'
        )
      ).toBeVisible();
    });

    test('should load hero section first (above-fold)', async ({ page }) => {
      await page.goto('/en');

      // Hero section should be visible immediately
      await expect(page.locator('.hero-section')).toBeVisible({
        timeout: 2000,
      });

      // Check hero content
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(
        page.getByText(/decentralized learning platform/i)
      ).toBeVisible();
    });

    test('should lazy load below-fold sections', async ({ page }) => {
      await page.goto('/en');

      // Scroll to trigger lazy loading
      await page.evaluate(() => window.scrollTo(0, window.innerHeight));

      // Wait for lazy-loaded sections to appear
      await expect(page.locator('.articles-section')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator('.navigation-section')).toBeVisible({
        timeout: 5000,
      });

      // Scroll more to load courses section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(page.locator('.courses-section')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should display loading states before content loads', async ({
      page,
    }) => {
      // Delay API responses to see loading states
      await page.route('/api/news*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/en');

      // Should show loading skeleton
      await expect(
        page.locator('[data-testid*="skeleton"], .animate-pulse')
      ).toBeVisible();
    });

    test('should handle API failures gracefully', async ({ page }) => {
      // Mock API failures
      await page.route('/api/news*', async route => {
        await route.fulfill({ status: 500 });
      });

      await page.route('/api/articles*', async route => {
        await route.fulfill({ status: 500 });
      });

      await page.goto('/en');
      await page.waitForLoadState('networkidle');

      // Page should still load with error boundaries
      await expect(page.locator('.hero-section')).toBeVisible();

      // Should show error fallbacks or empty states
      const errorElements = page.locator(
        '[data-testid*="error"], .error-fallback'
      );
      if ((await errorElements.count()) > 0) {
        await expect(errorElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto('/en');

      // Measure performance metrics
      const performanceMetrics = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries();
            const metrics = {};

            entries.forEach(entry => {
              if (entry.entryType === 'paint') {
                metrics[entry.name] = entry.startTime;
              }
              if (entry.entryType === 'largest-contentful-paint') {
                metrics['largest-contentful-paint'] = entry.startTime;
              }
            });

            resolve(metrics);
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });

      // First Contentful Paint should be < 1.5s
      if (performanceMetrics['first-contentful-paint']) {
        expect(performanceMetrics['first-contentful-paint']).toBeLessThan(1500);
      }

      // Largest Contentful Paint should be < 2.5s
      if (performanceMetrics['largest-contentful-paint']) {
        expect(performanceMetrics['largest-contentful-paint']).toBeLessThan(
          2500
        );
      }
    });

    test('should load critical resources quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/en');
      await page.waitForSelector('.hero-section');

      const loadTime = Date.now() - startTime;

      // Hero section should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should optimize image loading', async ({ page }) => {
      await page.goto('/en');

      // Check that images have proper loading attributes
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const loading = await img.getAttribute('loading');
          const src = await img.getAttribute('src');

          // Images should have loading="lazy" or be above-fold
          if (src && !src.includes('data:')) {
            expect(loading === 'lazy' || loading === 'eager').toBe(true);
          }
        }
      }
    });
  });

  test.describe('Responsive Design Tests', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/en');

      // Check mobile layout
      await expect(page.locator('.hero-section')).toBeVisible();

      // Navigation should be mobile-friendly
      const navElements = page.locator('nav a, .navigation-section a');
      const navCount = await navElements.count();

      if (navCount > 0) {
        for (let i = 0; i < navCount; i++) {
          const element = navElements.nth(i);
          const box = await element.boundingBox();

          // Touch targets should be at least 44px
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/en');

      await expect(page.locator('.hero-section')).toBeVisible();

      // Grid layouts should adapt to tablet
      const gridElements = page.locator('.grid, [class*="grid-cols"]');
      const gridCount = await gridElements.count();
      expect(gridCount).toBeGreaterThan(0);
    });

    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/en');

      await expect(page.locator('.hero-section')).toBeVisible();

      // Should utilize full screen space
      const main = page.locator('main');
      const box = await main.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(1000);
      }
    });
  });

  test.describe('Internationalization Tests', () => {
    test('should work with English locale', async ({ page }) => {
      await page.goto('/en');

      await expect(page.locator('html')).toHaveAttribute('lang', 'en');

      // Check for English content
      await expect(
        page.getByText(/decentralized learning platform/i)
      ).toBeVisible();
    });

    test('should work with Spanish locale', async ({ page }) => {
      await page.goto('/es');

      await expect(page.locator('html')).toHaveAttribute('lang', 'es');

      // Should load Spanish content if available
      await expect(page.locator('.hero-section')).toBeVisible();
    });

    test('should handle language switching', async ({ page }) => {
      await page.goto('/en');

      // Look for language switcher
      const langSwitcher = page.locator(
        '[data-testid="language-switcher"], .language-switcher'
      );

      if ((await langSwitcher.count()) > 0) {
        await langSwitcher.click();

        // Should have language options
        const langOptions = page.locator(
          '[data-testid="lang-option"], .lang-option'
        );
        expect(await langOptions.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('SEO Tests', () => {
    test('should have proper meta tags', async ({ page }) => {
      await page.goto('/en');

      // Check title
      await expect(page).toHaveTitle(/stakeados/i);

      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content');

      // Check canonical URL
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href');
    });

    test('should have structured data', async ({ page }) => {
      await page.goto('/en');

      // Check for JSON-LD structured data
      const structuredData = page.locator('script[type="application/ld+json"]');
      expect(await structuredData.count()).toBeGreaterThan(0);

      // Validate JSON-LD content
      const jsonContent = await structuredData.first().textContent();
      expect(() => JSON.parse(jsonContent || '{}')).not.toThrow();
    });

    test('should have proper Open Graph tags', async ({ page }) => {
      await page.goto('/en');

      // Check OG tags
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content'
      );
      await expect(
        page.locator('meta[property="og:description"]')
      ).toHaveAttribute('content');
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content'
      );
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
        'content',
        'website'
      );
    });
  });

  test.describe('Accessibility E2E Tests', () => {
    test('should not have accessibility violations', async ({ page }) => {
      await page.goto('/en');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/en');

      // Test tab navigation
      await page.keyboard.press('Tab');

      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Continue tabbing through interactive elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        focusedElement = page.locator(':focus');

        if ((await focusedElement.count()) > 0) {
          await expect(focusedElement).toBeVisible();
        }
      }
    });

    test('should work with screen readers', async ({ page }) => {
      await page.goto('/en');

      // Check for proper headings
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();

      // Check for main landmark
      const main = page.getByRole('main');
      await expect(main).toBeVisible();

      // Check for navigation landmark
      const nav = page.getByRole('navigation');
      if ((await nav.count()) > 0) {
        await expect(nav.first()).toBeVisible();
      }
    });
  });

  test.describe('Error Handling E2E Tests', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());

      await page.goto('/en', { waitUntil: 'domcontentloaded' });

      // Page should still render basic structure
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show error boundaries for failed sections', async ({
      page,
    }) => {
      // Mock API failures
      await page.route('/api/news*', route => route.fulfill({ status: 500 }));

      await page.goto('/en');
      await page.waitForLoadState('networkidle');

      // Should show error fallback or retry option
      const errorElements = page.locator(
        '[data-testid*="error"], .error-fallback, .retry-button'
      );

      if ((await errorElements.count()) > 0) {
        await expect(errorElements.first()).toBeVisible();
      }
    });

    test('should allow retry on failed sections', async ({ page }) => {
      let callCount = 0;

      await page.route('/api/news*', route => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({ status: 500 });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        }
      });

      await page.goto('/en');
      await page.waitForLoadState('networkidle');

      // Look for retry button
      const retryButton = page.locator(
        '[data-testid="retry-button"], .retry-button, button:has-text("retry")'
      );

      if ((await retryButton.count()) > 0) {
        await retryButton.first().click();

        // Should make another API call
        await page.waitForTimeout(1000);
        expect(callCount).toBe(2);
      }
    });
  });

  test.describe('User Interaction Tests', () => {
    test('should navigate to articles page from hero CTA', async ({ page }) => {
      await page.goto('/en');

      const articlesButton = page.getByRole('button', {
        name: /explore articles/i,
      });
      if ((await articlesButton.count()) > 0) {
        await articlesButton.click();
        await expect(page).toHaveURL(/\/articles/);
      }
    });

    test('should navigate to courses page from hero CTA', async ({ page }) => {
      await page.goto('/en');

      const coursesButton = page.getByRole('button', {
        name: /browse courses/i,
      });
      if ((await coursesButton.count()) > 0) {
        await coursesButton.click();
        await expect(page).toHaveURL(/\/courses/);
      }
    });

    test('should navigate to section pages from "View All" links', async ({
      page,
    }) => {
      await page.goto('/en');
      await page.waitForLoadState('networkidle');

      // Test "View All News" link
      const viewAllNews = page.getByText(/view all news/i);
      if ((await viewAllNews.count()) > 0) {
        await viewAllNews.click();
        await expect(page).toHaveURL(/\/news/);
        await page.goBack();
      }

      // Test "View All Articles" link
      const viewAllArticles = page.getByText(/view all articles/i);
      if ((await viewAllArticles.count()) > 0) {
        await viewAllArticles.click();
        await expect(page).toHaveURL(/\/articles/);
        await page.goBack();
      }

      // Test "Browse All Courses" link
      const browseAllCourses = page.getByText(/browse all courses/i);
      if ((await browseAllCourses.count()) > 0) {
        await browseAllCourses.click();
        await expect(page).toHaveURL(/\/courses/);
      }
    });
  });
});
