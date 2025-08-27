import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('should display sign in and sign up buttons when not authenticated', async ({
    page,
  }) => {
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('should open sign in modal when sign in button is clicked', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
  });

  test('should open sign up modal when sign up button is clicked', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Sign Up')).toBeVisible();
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
  });

  test('should validate email format in sign in form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    // Fill invalid email
    await page.getByPlaceholder('your@email.com').fill('invalid-email');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show validation error
    await expect(page.getByText(/please fill in all fields/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    const passwordInput = page.getByPlaceholder('••••••••');
    const toggleButton = page.locator('[data-testid="password-toggle"]');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should switch between sign in and sign up modals', async ({ page }) => {
    // Open sign in modal
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Sign In')).toBeVisible();

    // Switch to sign up
    await page.getByText(/don't have an account/i).click();
    await expect(page.getByText('Sign Up')).toBeVisible();

    // Switch back to sign in
    await page.getByText(/already have an account/i).click();
    await expect(page.getByText('Sign In')).toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click outside the modal
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close modal when pressing escape', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press escape key
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
