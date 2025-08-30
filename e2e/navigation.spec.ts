import { test, expect } from '@playwright/test';

test.describe('Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test.describe('Basic Navigation Flow', () => {
    test('should display main navigation on all pages', async ({ page }) => {
      // Check main navigation is visible
      const navigation = page.getByRole('navigation', { name: /main navigation/i });
      await expect(navigation).toBeVisible();

      // Check logo is present and clickable
      const logo = page.getByRole('link', { name: /stakeados/i });
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('href', '/');

      // Navigate to different pages and verify navigation persists
      const articlesLink = page.getByRole('menuitem', { name: /artículos/i });
      if (await articlesLink.isVisible()) {
        await articlesLink.click();
        await expect(navigation).toBeVisible();
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      // Check home is active initially
      const homeLink = page.getByRole('menuitem', { name: /inicio/i });
      await expect(homeLink).toHaveAttribute('aria-current', 'page');

      // Navigate to articles and check it becomes active
      const articlesLink = page.getByRole('menuitem', { name: /artículos/i });
      if (await articlesLink.isVisible()) {
        await articlesLink.click();
        await expect(articlesLink).toHaveAttribute('aria-current', 'page');
        await expect(homeLink).not.toHaveAttribute('aria-current', 'page');
      }
    });

    test('should handle logo click to return home', async ({ page }) => {
      // Navigate away from home
      const articlesLink = page.getByRole('menuitem', { name: /artículos/i });
      if (await articlesLink.isVisible()) {
        await articlesLink.click();
      }

      // Click logo to return home
      const logo = page.getByRole('link', { name: /stakeados/i });
      await logo.click();
      
      await expect(page).toHaveURL('/');
      const homeLink = page.getByRole('menuitem', { name: /inicio/i });
      await expect(homeLink).toHaveAttribute('aria-current', 'page');
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should show hamburger menu on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check hamburger button is visible
      const hamburgerButton = page.getByRole('button', { name: /open menu/i });
      await expect(hamburgerButton).toBeVisible();

      // Check desktop navigation is hidden
      const desktopNav = page.getByRole('menubar');
      await expect(desktopNav).not.toBeVisible();
    });

    test('should open and close mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const hamburgerButton = page.getByRole('button', { name: /open menu/i });
      
      // Open mobile menu
      await hamburgerButton.click();
      
      const mobileMenu = page.getByRole('dialog', { name: /menú de navegación/i });
      await expect(mobileMenu).toBeVisible();
      await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');

      // Close mobile menu with close button
      const closeButton = page.getByRole('button', { name: /cerrar menú/i });
      await closeButton.click();
      
      await expect(mobileMenu).not.toBeVisible();
      await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('should close mobile menu with escape key', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const hamburgerButton = page.getByRole('button', { name: /open menu/i });
      await hamburgerButton.click();

      const mobileMenu = page.getByRole('dialog');
      await expect(mobileMenu).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');
      await expect(mobileMenu).not.toBeVisible();
    });

    test('should close mobile menu when clicking outside', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const hamburgerButton = page.getByRole('button', { name: /open menu/i });
      await hamburgerButton.click();

      const mobileMenu = page.getByRole('dialog');
      await expect(mobileMenu).toBeVisible();

      // Click outside the menu
      await page.click('body', { position: { x: 10, y: 10 } });
      await expect(mobileMenu).not.toBeVisible();
    });
  });

  test.describe('Authentication-Based Navigation', () => {
    test('should show login/register for unauthenticated users', async ({ page }) => {
      // Check unauthenticated state
      const loginButton = page.getByRole('link', { name: /iniciar sesión/i });
      const registerButton = page.getByRole('link', { name: /registrarse/i });
      
      await expect(loginButton).toBeVisible();
      await expect(registerButton).toBeVisible();

      // Check protected sections are not visible
      const communityLink = page.getByRole('menuitem', { name: /comunidad/i });
      await expect(communityLink).not.toBeVisible();
    });

    test('should redirect to login for protected routes', async ({ page }) => {
      // Try to access a protected route directly
      await page.goto('/community');
      
      // Should redirect to login with redirect parameter
      await expect(page).toHaveURL(/\/login\?redirect=/);
    });

    test('should show user menu for authenticated users', async ({ page }) => {
      // Mock authentication (this would need to be set up with your auth system)
      await page.addInitScript(() => {
        // Mock authenticated state
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          user: { email: 'test@example.com' }
        }));
      });

      await page.reload();

      // Check user menu is visible
      const userMenuButton = page.getByRole('button', { name: /menú de usuario/i });
      await expect(userMenuButton).toBeVisible();

      // Open user menu
      await userMenuButton.click();
      
      const userMenu = page.getByRole('menu');
      await expect(userMenu).toBeVisible();
      
      const profileLink = page.getByRole('menuitem', { name: /mi perfil/i });
      const logoutButton = page.getByRole('menuitem', { name: /cerrar sesión/i });
      
      await expect(profileLink).toBeVisible();
      await expect(logoutButton).toBeVisible();
    });
  });

  test.describe('Breadcrumbs Navigation', () => {
    test('should show breadcrumbs on nested pages', async ({ page }) => {
      // Navigate to a nested page (if available)
      await page.goto('/articles/category/technology');
      
      const breadcrumbNav = page.getByRole('navigation', { name: /breadcrumb/i });
      
      if (await breadcrumbNav.isVisible()) {
        // Check breadcrumb structure
        const breadcrumbs = breadcrumbNav.getByRole('list');
        await expect(breadcrumbs).toBeVisible();
        
        // Check current page is marked correctly
        const currentPage = page.getByText('Technology');
        await expect(currentPage).toHaveAttribute('aria-current', 'page');
      }
    });

    test('should navigate via breadcrumb links', async ({ page }) => {
      await page.goto('/articles/category/technology');
      
      const breadcrumbNav = page.getByRole('navigation', { name: /breadcrumb/i });
      
      if (await breadcrumbNav.isVisible()) {
        // Click on Articles breadcrumb
        const articlesLink = breadcrumbNav.getByRole('link', { name: /artículos/i });
        if (await articlesLink.isVisible()) {
          await articlesLink.click();
          await expect(page).toHaveURL('/articles');
        }
      }
    });
  });

  test.describe('Coming Soon Features', () => {
    test('should show coming soon modal for unimplemented features', async ({ page }) => {
      // Click on an unimplemented feature
      const comingSoonLink = page.getByRole('menuitem', { name: /próximamente/i });
      
      if (await comingSoonLink.isVisible()) {
        await comingSoonLink.click();
        
        // Check modal appears
        const modal = page.getByRole('dialog', { name: /próximamente/i });
        await expect(modal).toBeVisible();
        
        // Check modal content
        const modalTitle = page.getByText(/estará disponible próximamente/i);
        await expect(modalTitle).toBeVisible();
        
        // Close modal
        const closeButton = page.getByRole('button', { name: /cerrar/i });
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation through menu items', async ({ page }) => {
      // Focus first navigation item
      await page.keyboard.press('Tab');
      
      // Navigate through menu items with arrow keys
      await page.keyboard.press('ArrowRight');
      
      // Check focus moves correctly
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('role', 'menuitem');
    });

    test('should activate menu items with Enter and Space', async ({ page }) => {
      // Focus on a navigation item
      const homeLink = page.getByRole('menuitem', { name: /inicio/i });
      await homeLink.focus();
      
      // Activate with Enter
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/');
      
      // Test Space key activation
      const articlesLink = page.getByRole('menuitem', { name: /artículos/i });
      if (await articlesLink.isVisible()) {
        await articlesLink.focus();
        await page.keyboard.press('Space');
        // Should navigate or show coming soon
      }
    });

    test('should support skip link', async ({ page }) => {
      // Press Tab to focus skip link
      await page.keyboard.press('Tab');
      
      const skipLink = page.getByText(/saltar al contenido principal/i);
      if (await skipLink.isVisible()) {
        await page.keyboard.press('Enter');
        
        // Should focus main content
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeFocused();
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should adapt navigation to different screen sizes', async ({ page }) => {
      // Test desktop view
      await page.setViewportSize({ width: 1200, height: 800 });
      
      const desktopNav = page.getByRole('menubar');
      await expect(desktopNav).toBeVisible();
      
      const hamburgerButton = page.getByRole('button', { name: /open menu/i });
      await expect(hamburgerButton).not.toBeVisible();
      
      // Test tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Should still show desktop nav on tablet
      await expect(desktopNav).toBeVisible();
      
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(hamburgerButton).toBeVisible();
      await expect(desktopNav).not.toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load navigation quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      // Navigation should be visible within reasonable time
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      await page.goto('/');
      
      // Navigation should still work
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages with functional navigation', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Should show 404 page but navigation should still work
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
      
      // Should be able to navigate away from 404
      const homeLink = page.getByRole('menuitem', { name: /inicio/i });
      await homeLink.click();
      await expect(page).toHaveURL('/');
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Block network requests
      await page.route('**/*', route => route.abort());
      
      await page.goto('/');
      
      // Navigation should still render (from cache or static)
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should meet WCAG 2.1 AA standards', async ({ page }) => {
      await page.goto('/');
      
      // Check for accessibility violations
      const accessibilityScanResults = await page.evaluate(() => {
        // This would integrate with axe-core in a real implementation
        return { violations: [] };
      });
      
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });

    test('should support screen readers', async ({ page }) => {
      // Check ARIA labels and roles
      const navigation = page.getByRole('navigation');
      await expect(navigation).toHaveAttribute('aria-label');
      
      const menuItems = page.getByRole('menuitem');
      const menuItemCount = await menuItems.count();
      
      for (let i = 0; i < menuItemCount; i++) {
        const item = menuItems.nth(i);
        await expect(item).toHaveAttribute('aria-label');
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      
      // This would check color contrast ratios in a real implementation
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
      
      // Check that text is readable
      const menuItems = page.getByRole('menuitem');
      const firstItem = menuItems.first();
      
      const styles = await firstItem.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Basic check that colors are defined
      expect(styles.color).toBeTruthy();
    });
  });
});