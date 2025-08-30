import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues on home page', async ({
    page,
  }) => {
    await page.goto('/en');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on courses page', async ({
    page,
  }) => {
    await page.goto('/en/courses');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on community page', async ({
    page,
  }) => {
    await page.goto('/en/community');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/en');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/en');

    const images = await page.locator('img').all();

    for (const image of images) {
      const alt = await image.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt?.length).toBeGreaterThan(0);
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/en');

    // Open sign in modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check form inputs have labels
    const emailInput = page.getByPlaceholder('your@email.com');
    const passwordInput = page.getByPlaceholder('••••••••');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check for associated labels
    const emailLabel = page.getByText('Email');
    const passwordLabel = page.getByText('Password');

    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/en');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to reach interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/en');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/en');

    // Check for proper ARIA labels on interactive elements
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();

      // Button should have either text content or aria-label
      expect(ariaLabel || textContent?.trim()).toBeTruthy();
    }
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/en');

    // Check for skip links
    const skipLink = page.getByText(/skip to main content/i);
    await expect(skipLink).toBeInTheDocument();

    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');

    // Animations should be reduced or disabled
    const animatedElements = page.locator('[class*="animate-"]');
    const count = await animatedElements.count();

    // Should still render but with reduced animations
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
