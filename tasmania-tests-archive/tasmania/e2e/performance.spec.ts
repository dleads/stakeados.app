import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/en');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const metrics: Record<string, number> = {};

          entries.forEach(entry => {
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.LCP = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              metrics.FID = (entry as any).processingStart - entry.startTime;
            }
          });

          resolve(metrics);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });

        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    // LCP should be under 2.5 seconds
    if (metrics.LCP) {
      expect(metrics.LCP).toBeLessThan(2500);
    }

    // FID should be under 100ms
    if (metrics.FID) {
      expect(metrics.FID).toBeLessThan(100);
    }
  });

  test('should load critical resources quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/en');
    await page.waitForSelector('h1');

    const loadTime = Date.now() - startTime;

    // First meaningful paint should be under 1.5 seconds
    expect(loadTime).toBeLessThan(1500);
  });

  test('should have efficient bundle size', async ({ page }) => {
    await page.goto('/en');

    // Check for efficient resource loading
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];
      return entries.map(entry => ({
        name: entry.name,
        size: entry.transferSize,
        duration: entry.duration,
      }));
    });

    // Main bundle should be reasonable size
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.size || 0), 0);

    // Total JS should be under 1MB
    expect(totalJSSize).toBeLessThan(1024 * 1024);
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/en');
    await page.waitForSelector('h1');
    const loadTime = Date.now() - startTime;

    // Should still load within reasonable time on slow network
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have efficient image loading', async ({ page }) => {
    await page.goto('/en');

    const images = await page.locator('img').all();

    for (const image of images) {
      // Check for proper loading attributes
      const loading = await image.getAttribute('loading');
      const src = await image.getAttribute('src');

      // Images should have proper optimization
      if (src && !src.startsWith('data:')) {
        expect(loading).toBeTruthy();
      }
    }
  });

  test('should have minimal layout shift', async ({ page }) => {
    await page.goto('/en');

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;

        new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });

        // Resolve after 3 seconds
        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    // CLS should be under 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('should handle memory efficiently', async ({ page }) => {
    await page.goto('/en');

    // Check memory usage
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          }
        : null;
    });

    if (memoryInfo) {
      const usagePercentage =
        (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;

      // Memory usage should be reasonable
      expect(usagePercentage).toBeLessThan(50);
    }
  });
});
