import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('should navigate to courses page', async ({ page }) => {
    await page.getByRole('link', { name: /courses/i }).click();
    await expect(page).toHaveURL(/\/en\/courses/);
    await expect(page.getByText('Courses')).toBeVisible();
  });

  test('should navigate to community page', async ({ page }) => {
    await page.getByRole('link', { name: /community/i }).click();
    await expect(page).toHaveURL(/\/en\/community/);
    await expect(page.getByText('Community')).toBeVisible();
  });

  test('should navigate to news page', async ({ page }) => {
    await page.getByRole('link', { name: /news/i }).click();
    await expect(page).toHaveURL(/\/en\/news/);
    await expect(page.getByText('Crypto News')).toBeVisible();
  });

  test('should navigate to genesis page', async ({ page }) => {
    await page.getByRole('link', { name: /genesis/i }).click();
    await expect(page).toHaveURL(/\/en\/genesis/);
    await expect(page.getByText('Genesis Community')).toBeVisible();
  });

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();

    // Click to open mobile menu
    await menuButton.click();

    // Mobile menu should be visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should handle language switching', async ({ page }) => {
    // Check current language is English
    await expect(page).toHaveURL(/\/en/);

    // Switch to Spanish (this would be implemented with a language switcher)
    await page.goto('/es');
    await expect(page).toHaveURL(/\/es/);
  });

  test('should show search interface', async ({ page }) => {
    // Click search button
    await page.getByRole('button', { name: /search/i }).click();

    // Search input should be visible
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('should navigate using breadcrumbs', async ({ page }) => {
    // Navigate to a deep page
    await page.goto('/en/courses/blockchain-basics');

    // Breadcrumbs should be visible
    await expect(
      page.getByRole('navigation', { name: /breadcrumb/i })
    ).toBeVisible();

    // Click on courses breadcrumb
    await page
      .getByRole('link', { name: /courses/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/courses/);
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/en/non-existent-page');
    await expect(page.getByText(/page not found/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
  });
});
