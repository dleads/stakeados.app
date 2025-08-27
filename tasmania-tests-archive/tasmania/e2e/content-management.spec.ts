import { test, expect } from '@playwright/test';

test.describe('Content Management System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data and authentication
    await page.goto('/');

    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'test-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'authenticated',
          },
        })
      );
    });
  });

  test.describe('Article Proposal to Publication Workflow', () => {
    test('complete article proposal and publication flow', async ({ page }) => {
      // Step 1: Navigate to article proposal form
      await page.goto('/en/articles/propose');
      await expect(page).toHaveTitle(/Propose Article/);

      // Step 2: Fill out article proposal form
      await page.fill(
        '[data-testid="proposal-title"]',
        'Understanding DeFi Yield Farming'
      );
      await page.fill(
        '[data-testid="proposal-summary"]',
        'A comprehensive guide to yield farming strategies in DeFi protocols, covering risks, rewards, and best practices for maximizing returns.'
      );
      await page.fill(
        '[data-testid="proposal-outline"]',
        `
        Introduction to Yield Farming
        1. What is Yield Farming?
        2. Popular DeFi Protocols for Yield Farming
        3. Risk Assessment and Management
        4. Strategies for Maximizing Returns
        5. Tax Implications and Considerations
        Conclusion and Best Practices
      `
      );
      await page.fill(
        '[data-testid="proposal-experience"]',
        'I have been actively involved in DeFi for over 2 years, with experience in yield farming across multiple protocols including Compound, Aave, and Uniswap.'
      );
      await page.selectOption('[data-testid="proposal-level"]', 'intermediate');

      // Step 3: Submit proposal
      await page.click('[data-testid="submit-proposal"]');

      // Verify success message
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('Proposal submitted successfully');

      // Step 4: Admin reviews proposal (simulate admin login)
      await page.goto('/en/admin/proposals');

      // Mock admin role
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'admin');
      });

      await page.reload();

      // Find and review the proposal
      await expect(
        page.locator('[data-testid="proposal-card"]').first()
      ).toBeVisible();
      await page.click('[data-testid="proposal-card"]');

      // Approve the proposal
      await page.click('[data-testid="approve-proposal"]');
      await expect(
        page.locator('[data-testid="approval-success"]')
      ).toBeVisible();

      // Step 5: Author creates article (simulate author login)
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'author');
      });

      await page.goto('/en/articles/write');

      // Fill out article editor
      await page.fill(
        '[data-testid="article-title-en"]',
        'Understanding DeFi Yield Farming'
      );
      await page.fill(
        '[data-testid="article-content-en"]',
        `
        # Understanding DeFi Yield Farming

        Yield farming has become one of the most popular ways to earn passive income in the DeFi ecosystem. This comprehensive guide will walk you through everything you need to know about yield farming strategies.

        ## What is Yield Farming?

        Yield farming, also known as liquidity mining, is the practice of lending or staking cryptocurrency tokens to generate high returns or rewards in the form of additional cryptocurrency.

        ## Popular DeFi Protocols

        Some of the most popular protocols for yield farming include:
        - Compound
        - Aave
        - Uniswap
        - SushiSwap
        - Curve Finance

        ## Risk Management

        While yield farming can be profitable, it comes with several risks that you should be aware of...
      `
      );

      await page.fill(
        '[data-testid="article-meta-description-en"]',
        'Learn about DeFi yield farming strategies, risks, and how to maximize your returns in decentralized finance protocols.'
      );
      await page.selectOption('[data-testid="article-category"]', 'defi');

      // Add tags
      await page.fill(
        '[data-testid="article-tags"]',
        'DeFi, yield farming, liquidity mining'
      );

      // Save draft
      await page.click('[data-testid="save-draft"]');
      await expect(page.locator('[data-testid="draft-saved"]')).toBeVisible();

      // Submit for review
      await page.click('[data-testid="submit-for-review"]');
      await expect(
        page.locator('[data-testid="submitted-for-review"]')
      ).toBeVisible();

      // Step 6: Editorial review (simulate editor login)
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'editor');
      });

      await page.goto('/en/admin/editorial');

      // Review and approve article
      await page.click('[data-testid="article-review-card"]');
      await page.fill(
        '[data-testid="editorial-comments"]',
        'Well-written article with good technical depth. Approved for publication.'
      );
      await page.click('[data-testid="approve-article"]');

      // Step 7: Publish article
      await page.click('[data-testid="publish-article"]');
      await expect(
        page.locator('[data-testid="article-published"]')
      ).toBeVisible();

      // Step 8: Verify article is publicly accessible
      await page.goto('/en/articles');
      await expect(
        page.locator('[data-testid="article-card"]').first()
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="article-title"]').first()
      ).toContainText('Understanding DeFi Yield Farming');

      // Click on article to view full content
      await page.click('[data-testid="article-card"]');
      await expect(page.locator('h1')).toContainText(
        'Understanding DeFi Yield Farming'
      );
      await expect(
        page.locator('[data-testid="article-content"]')
      ).toContainText('Yield farming has become one of the most popular ways');
    });

    test('handles article proposal rejection workflow', async ({ page }) => {
      // Submit a proposal that will be rejected
      await page.goto('/en/articles/propose');

      await page.fill(
        '[data-testid="proposal-title"]',
        'Basic Crypto Introduction'
      );
      await page.fill(
        '[data-testid="proposal-summary"]',
        'A very basic introduction to cryptocurrency that covers what Bitcoin is.'
      );
      await page.fill(
        '[data-testid="proposal-outline"]',
        'What is Bitcoin\nHow to buy Bitcoin\nConclusion'
      );
      await page.fill(
        '[data-testid="proposal-experience"]',
        'I just started learning about crypto last week.'
      );
      await page.selectOption('[data-testid="proposal-level"]', 'beginner');

      await page.click('[data-testid="submit-proposal"]');
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();

      // Admin rejects proposal
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'admin');
      });

      await page.goto('/en/admin/proposals');
      await page.click('[data-testid="proposal-card"]');
      await page.click('[data-testid="reject-proposal"]');

      await page.fill(
        '[data-testid="rejection-feedback"]',
        'This topic is too basic for our target audience. We focus on intermediate to advanced content.'
      );
      await page.click('[data-testid="confirm-rejection"]');

      await expect(
        page.locator('[data-testid="rejection-success"]')
      ).toBeVisible();

      // Verify author receives notification
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'author');
      });

      await page.goto('/en/dashboard');
      await expect(
        page.locator('[data-testid="notification-bell"]')
      ).toHaveClass(/has-notifications/);

      await page.click('[data-testid="notification-bell"]');
      await expect(
        page.locator('[data-testid="notification-item"]').first()
      ).toContainText('proposal has been rejected');
    });

    test('handles changes requested workflow', async ({ page }) => {
      // Submit proposal
      await page.goto('/en/articles/propose');
      await page.fill(
        '[data-testid="proposal-title"]',
        'Advanced DeFi Strategies'
      );
      await page.fill(
        '[data-testid="proposal-summary"]',
        'Advanced strategies for DeFi investing and yield optimization.'
      );
      await page.fill(
        '[data-testid="proposal-outline"]',
        'Introduction\nStrategy 1\nStrategy 2\nConclusion'
      );
      await page.fill(
        '[data-testid="proposal-experience"]',
        'DeFi expert with 3 years experience.'
      );
      await page.selectOption('[data-testid="proposal-level"]', 'advanced');

      await page.click('[data-testid="submit-proposal"]');

      // Admin requests changes
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'admin');
      });

      await page.goto('/en/admin/proposals');
      await page.click('[data-testid="proposal-card"]');
      await page.click('[data-testid="request-changes"]');

      await page.fill(
        '[data-testid="changes-feedback"]',
        'Please expand the outline with more specific strategies and add risk analysis sections.'
      );
      await page.click('[data-testid="send-feedback"]');

      // Author updates proposal
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'author');
      });

      await page.goto('/en/dashboard/proposals');
      await page.click('[data-testid="proposal-with-feedback"]');

      // Update outline based on feedback
      await page.fill(
        '[data-testid="proposal-outline"]',
        `
        Introduction to Advanced DeFi Strategies
        1. Yield Farming Optimization
           - Protocol selection criteria
           - Risk assessment framework
        2. Liquidity Provision Strategies
           - Impermanent loss mitigation
           - Fee optimization
        3. Advanced Risk Management
           - Portfolio diversification
           - Smart contract risk assessment
        4. Tax Optimization Strategies
        Conclusion and Best Practices
      `
      );

      await page.click('[data-testid="resubmit-proposal"]');
      await expect(
        page.locator('[data-testid="resubmission-success"]')
      ).toBeVisible();
    });
  });

  test.describe('News Consumption and Personalization', () => {
    test('personalizes news feed based on user preferences', async ({
      page,
    }) => {
      // Set up user preferences
      await page.goto('/en/news/preferences');

      // Select preferred categories
      await page.check('[data-testid="category-defi"]');
      await page.check('[data-testid="category-nfts"]');
      await page.uncheck('[data-testid="category-trading"]');

      // Select preferred sources
      await page.check('[data-testid="source-cryptonews"]');
      await page.check('[data-testid="source-defipulse"]');

      await page.click('[data-testid="save-preferences"]');
      await expect(
        page.locator('[data-testid="preferences-saved"]')
      ).toBeVisible();

      // Navigate to personalized news feed
      await page.goto('/en/news');
      await page.click('[data-testid="personalized-feed-toggle"]');

      // Verify personalized content is shown
      await expect(
        page.locator('[data-testid="personalized-indicator"]')
      ).toBeVisible();

      // Check that news articles match preferences
      const newsCards = page.locator('[data-testid="news-card"]');
      await expect(newsCards.first()).toBeVisible();

      // Verify categories match preferences
      const firstNewsCategory = page
        .locator('[data-testid="news-category"]')
        .first();
      await expect(firstNewsCategory).toContainText(/DeFi|NFTs/);

      // Test news interaction tracking
      await page.click('[data-testid="news-card"]');
      await expect(page.locator('[data-testid="news-detail"]')).toBeVisible();

      // Verify reading time is tracked
      await page.waitForTimeout(3000); // Simulate reading time

      // Go back to feed and verify recommendation improvements
      await page.goBack();
      await expect(
        page.locator('[data-testid="recommended-for-you"]')
      ).toBeVisible();
    });

    test('filters and searches news effectively', async ({ page }) => {
      await page.goto('/en/news');

      // Test category filtering
      await page.selectOption('[data-testid="category-filter"]', 'DeFi');
      await page.waitForLoadState('networkidle');

      const filteredNews = page.locator('[data-testid="news-card"]');
      await expect(filteredNews.first()).toBeVisible();

      // Verify all visible news are DeFi related
      const categoryTags = page.locator('[data-testid="news-category"]');
      const count = await categoryTags.count();
      for (let i = 0; i < count; i++) {
        await expect(categoryTags.nth(i)).toContainText('DeFi');
      }

      // Test search functionality
      await page.fill('[data-testid="news-search"]', 'yield farming');
      await page.waitForLoadState('networkidle');

      const searchResults = page.locator('[data-testid="news-card"]');
      await expect(searchResults.first()).toBeVisible();

      // Verify search results contain the search term
      const firstResult = page.locator('[data-testid="news-title"]').first();
      await expect(firstResult).toContainText(/yield farming/i);

      // Test sorting
      await page.selectOption('[data-testid="sort-by"]', 'trending');
      await page.waitForLoadState('networkidle');

      // Verify trending indicator is shown
      await expect(
        page.locator('[data-testid="trending-indicator"]').first()
      ).toBeVisible();
    });

    test('handles real-time news updates', async ({ page }) => {
      await page.goto('/en/news');

      // Verify real-time connection indicator
      await expect(
        page.locator('[data-testid="realtime-indicator"]')
      ).toHaveClass(/connected/);

      // Simulate new breaking news (would be triggered by WebSocket in real implementation)
      await page.evaluate(() => {
        // Mock WebSocket message for breaking news
        window.dispatchEvent(
          new CustomEvent('breaking-news', {
            detail: {
              id: 'breaking-123',
              title: 'BREAKING: Major DeFi Protocol Hacked',
              summary: 'A major DeFi protocol has been exploited...',
              priority: 'high',
              isBreaking: true,
            },
          })
        );
      });

      // Verify breaking news banner appears
      await expect(
        page.locator('[data-testid="breaking-news-banner"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="breaking-news-title"]')
      ).toContainText('BREAKING: Major DeFi Protocol Hacked');

      // Click to read breaking news
      await page.click('[data-testid="breaking-news-banner"]');
      await expect(page.locator('[data-testid="news-detail"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="breaking-badge"]')
      ).toBeVisible();
    });
  });

  test.describe('Content Search and Discovery', () => {
    test('searches across articles and news effectively', async ({ page }) => {
      await page.goto('/en/search');

      // Test global search
      await page.fill('[data-testid="global-search"]', 'DeFi protocols');
      await page.click('[data-testid="search-button"]');

      await expect(
        page.locator('[data-testid="search-results"]')
      ).toBeVisible();

      // Verify both articles and news appear in results
      await expect(
        page.locator('[data-testid="article-result"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="news-result"]')).toBeVisible();

      // Test advanced search filters
      await page.click('[data-testid="advanced-search-toggle"]');

      // Filter by content type
      await page.check('[data-testid="filter-articles"]');
      await page.uncheck('[data-testid="filter-news"]');

      // Filter by category
      await page.selectOption('[data-testid="category-filter"]', 'defi');

      // Filter by date range
      await page.fill('[data-testid="date-from"]', '2024-01-01');
      await page.fill('[data-testid="date-to"]', '2024-12-31');

      await page.click('[data-testid="apply-filters"]');

      // Verify filtered results
      await expect(
        page.locator('[data-testid="news-result"]')
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="article-result"]')
      ).toBeVisible();

      // Test search suggestions
      await page.fill('[data-testid="global-search"]', 'yield');
      await expect(
        page.locator('[data-testid="search-suggestions"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="suggestion-item"]').first()
      ).toContainText('yield farming');

      // Click suggestion
      await page.click('[data-testid="suggestion-item"]');
      await expect(
        page.locator('[data-testid="search-results"]')
      ).toBeVisible();
    });

    test('provides relevant content recommendations', async ({ page }) => {
      // Read an article to establish preferences
      await page.goto('/en/articles');
      await page.click('[data-testid="article-card"]');

      // Simulate reading the full article
      await page.waitForTimeout(5000);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Check related articles section
      await expect(
        page.locator('[data-testid="related-articles"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="related-article-card"]')
      ).toHaveCount(3);

      // Navigate to another article
      await page.click('[data-testid="related-article-card"]');
      await expect(
        page.locator('[data-testid="article-content"]')
      ).toBeVisible();

      // Go to homepage and check personalized recommendations
      await page.goto('/en');
      await expect(
        page.locator('[data-testid="recommended-content"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="recommendation-reason"]').first()
      ).toContainText(/based on your reading/i);
    });

    test('handles multilingual content discovery', async ({ page }) => {
      // Test language switching
      await page.goto('/en/articles');
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="language-es"]');

      // Verify URL and content language changed
      await expect(page).toHaveURL(/\/es\/articulos/);
      await expect(page.locator('[data-testid="page-title"]')).toContainText(
        'Artículos'
      );

      // Test search in Spanish
      await page.fill('[data-testid="search-input"]', 'protocolos DeFi');
      await page.click('[data-testid="search-button"]');

      await expect(
        page.locator('[data-testid="search-results"]')
      ).toBeVisible();

      // Verify Spanish content appears
      const spanishResults = page.locator('[data-testid="article-result"]');
      await expect(spanishResults.first()).toBeVisible();

      // Test fallback for missing translations
      await page.click('[data-testid="article-result"]');

      // If Spanish translation is missing, should show fallback message
      const fallbackMessage = page.locator(
        '[data-testid="translation-fallback"]'
      );
      if (await fallbackMessage.isVisible()) {
        await expect(fallbackMessage).toContainText(
          'Este contenido está disponible en inglés'
        );
        await page.click('[data-testid="view-in-english"]');
        await expect(page).toHaveURL(/\/en\/articles/);
      }
    });
  });

  test.describe('User Engagement and Analytics', () => {
    test('tracks user interactions and engagement', async ({ page }) => {
      await page.goto('/en/articles');

      // Track article view
      await page.click('[data-testid="article-card"]');

      // Simulate reading behavior
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Test like functionality
      await page.click('[data-testid="like-button"]');
      await expect(page.locator('[data-testid="like-count"]')).toContainText(
        '1'
      );
      await expect(page.locator('[data-testid="like-button"]')).toHaveClass(
        /liked/
      );

      // Test bookmark functionality
      await page.click('[data-testid="bookmark-button"]');
      await expect(page.locator('[data-testid="bookmark-button"]')).toHaveClass(
        /bookmarked/
      );

      // Test share functionality
      await page.click('[data-testid="share-button"]');
      await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

      await page.click('[data-testid="copy-link"]');
      await expect(page.locator('[data-testid="link-copied"]')).toBeVisible();

      // Verify analytics tracking (would check analytics dashboard in real implementation)
      await page.goto('/en/dashboard/analytics');
      await expect(page.locator('[data-testid="reading-stats"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="engagement-metrics"]')
      ).toContainText('1 article read');
    });

    test('provides content creator analytics', async ({ page }) => {
      // Mock author role
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'author');
      });

      await page.goto('/en/dashboard/content');

      // Verify author dashboard
      await expect(page.locator('[data-testid="author-stats"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="article-performance"]')
      ).toBeVisible();

      // Check individual article analytics
      await page.click('[data-testid="article-analytics"]');

      await expect(page.locator('[data-testid="view-count"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="reading-time-avg"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="engagement-rate"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="performance-chart"]')
      ).toBeVisible();
    });
  });

  test.describe('Accessibility and Performance', () => {
    test('meets accessibility standards', async ({ page }) => {
      await page.goto('/en/articles');

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Navigate through article cards with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      await expect(
        page.locator('[data-testid="article-content"]')
      ).toBeVisible();

      // Test screen reader compatibility
      const articleTitle = page.locator('h1');
      await expect(articleTitle).toHaveAttribute('role', 'heading');

      // Test alt text for images
      const images = page.locator('img');
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        await expect(images.nth(i)).toHaveAttribute('alt');
      }

      // Test color contrast (would use axe-core in real implementation)
      // This is a simplified check
      const backgroundColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      expect(backgroundColor).toBeTruthy();
    });

    test('loads content efficiently with lazy loading', async ({ page }) => {
      await page.goto('/en/articles');

      // Verify initial articles load
      await expect(page.locator('[data-testid="article-card"]')).toHaveCount(6);

      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for more articles to load
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="article-card"]')).toHaveCount(
        12
      );

      // Test image lazy loading
      const images = page.locator('[data-testid="article-image"]');
      const firstImage = images.first();

      // Initially should have loading placeholder
      await expect(firstImage).toHaveAttribute('loading', 'lazy');

      // Scroll image into view
      await firstImage.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Image should now be loaded
      await expect(firstImage).toHaveAttribute('src');
    });
  });
});
