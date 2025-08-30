import { test, expect } from '@playwright/test';

test.describe('Courses Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/courses');
  });

  test('should display courses grid', async ({ page }) => {
    await expect(page.getByText('Courses')).toBeVisible();
    await expect(
      page.getByText('Learn blockchain and Web3 technologies')
    ).toBeVisible();
  });

  test('should show course statistics', async ({ page }) => {
    // Check for stats section
    await expect(page.getByText('Available Courses')).toBeVisible();
    await expect(page.getByText('Active Learners')).toBeVisible();
    await expect(page.getByText('Certificates Issued')).toBeVisible();
    await expect(page.getByText('Completion Rate')).toBeVisible();
  });

  test('should display learning paths', async ({ page }) => {
    await expect(page.getByText('Learning Paths')).toBeVisible();
    await expect(page.getByText('Beginner Path')).toBeVisible();
    await expect(page.getByText('Developer Path')).toBeVisible();
    await expect(page.getByText('Expert Path')).toBeVisible();
  });

  test('should filter courses by difficulty', async ({ page }) => {
    // Wait for courses to load
    await page.waitForSelector('[data-testid="course-card"]', {
      timeout: 10000,
    });

    // Click on Basic filter
    await page.getByRole('button', { name: /basic/i }).click();

    // Should show only basic courses
    const courseCards = page.locator('[data-testid="course-card"]');
    await expect(courseCards.first()).toBeVisible();
  });

  test('should search courses', async ({ page }) => {
    // Enter search term
    await page.getByPlaceholder(/search courses/i).fill('blockchain');
    await page.getByRole('button', { name: /search/i }).click();

    // Should show search results
    await expect(page.getByText(/blockchain/i)).toBeVisible();
  });

  test('should show course enrollment', async ({ page }) => {
    // Find first course card
    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await expect(firstCourse).toBeVisible();

    // Should have enroll button
    await expect(
      firstCourse.getByRole('button', { name: /enroll/i })
    ).toBeVisible();
  });

  test('should handle course card interactions', async ({ page }) => {
    const firstCourse = page.locator('[data-testid="course-card"]').first();

    // Hover should show additional details
    await firstCourse.hover();

    // Click should navigate to course detail
    await firstCourse.click();
    await expect(page).toHaveURL(/\/en\/courses\/[^\/]+$/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Should still show main content
    await expect(page.getByText('Courses')).toBeVisible();

    // Grid should adapt to mobile
    const coursesGrid = page.locator('[data-testid="courses-grid"]');
    await expect(coursesGrid).toBeVisible();
  });
});
