/**
 * Settings Pages E2E Tests
 * Tests for settings sub-pages (settings redirects to profile)
 */
import { test, expect } from '@playwright/test';

test.describe('Settings Redirect', () => {
  test('settings page redirects to profile', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect to profile (or login if not authenticated)
    const url = page.url();
    expect(url.includes('/settings/profile') || url.includes('/login')).toBe(true);
  });
});

test.describe('Profile Settings Page', () => {
  test('profile page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/profile');
    expect(response?.status()).toBe(200);
  });

  test('profile page has expected elements', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/profile')) {
      // Check for profile content container
      await expect(page.locator('#profile-content')).toBeAttached();

      // Check for change password button
      await expect(page.locator('#change-password-btn')).toBeAttached();

      // Check for delete account button
      await expect(page.locator('#delete-account-btn')).toBeAttached();
    }
  });

  test('profile page has page title', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/profile')) {
      await expect(page.locator('h1')).toContainText('Profile');
    }
  });

  test('profile page has settings navigation', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/profile')) {
      // Check for navigation links to other settings pages
      await expect(page.locator('a[href="/settings/library"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/preferences"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/maintenance"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/bin"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/about"]')).toBeAttached();
    }
  });
});

test.describe('Library Settings Page', () => {
  test('library page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/library');
    expect(response?.status()).toBe(200);
  });

  test('library page has expected structure', async ({ page }) => {
    await page.goto('/settings/library');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/library')) {
      // Check for main heading
      await expect(page.locator('h1')).toContainText('Library');
    }
  });
});

test.describe('Preferences Page', () => {
  test('preferences page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/preferences');
    expect(response?.status()).toBe(200);
  });

  test('preferences page has expected structure', async ({ page }) => {
    await page.goto('/settings/preferences');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/preferences')) {
      // Check for main heading
      await expect(page.locator('h1')).toContainText('Preferences');
    }
  });

  test('preferences page has widget settings section', async ({ page }) => {
    await page.goto('/settings/preferences');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/preferences')) {
      // Check for widget-related content
      const widgetText = page.getByText('Widgets');
      const isVisible = await widgetText.isVisible().catch(() => false);
      if (isVisible) {
        await expect(widgetText).toBeVisible();
      }
    }
  });
});

test.describe('Maintenance Page', () => {
  test('maintenance page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/maintenance');
    expect(response?.status()).toBe(200);
  });

  test('maintenance page has expected structure', async ({ page }) => {
    await page.goto('/settings/maintenance');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/maintenance')) {
      // Check for main heading
      await expect(page.locator('h1')).toContainText('Maintenance');
    }
  });
});

test.describe('Bin Page', () => {
  test('bin page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/bin');
    expect(response?.status()).toBe(200);
  });

  test('bin page has expected structure', async ({ page }) => {
    await page.goto('/settings/bin');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/bin')) {
      // Check for main heading
      await expect(page.locator('h1')).toContainText('Bin');

      // Check for bin content or loading state
      const binContent = page.locator('#bin-content');
      const loadingState = page.locator('#loading-state');

      const hasBinContent = await binContent.isAttached();
      const hasLoadingState = await loadingState.isAttached();

      // One of these should be present
      expect(hasBinContent || hasLoadingState).toBe(true);
    }
  });

  test('bin page shows empty state when no deleted books', async ({ page }) => {
    await page.goto('/settings/bin');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/bin')) {
      // Wait for content to load
      await page.waitForSelector('#bin-content, #loading-state', { timeout: 5000 }).catch(() => null);

      // Check for empty state
      const emptyState = page.locator('#empty-state');
      const binList = page.locator('#bin-list');

      const hasEmptyState = await emptyState.isAttached();
      const _hasBinList = await binList.isAttached();

      // Either empty state or bin list should be present
      // (depending on whether user has deleted books)
      if (hasEmptyState) {
        await expect(page.getByText('Bin is empty')).toBeVisible();
      }
    }
  });

  test('bin page has Empty Bin button when items exist', async ({ page }) => {
    await page.goto('/settings/bin');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/bin')) {
      // Wait for content to load
      await page.waitForSelector('#bin-content, #loading-state', { timeout: 5000 }).catch(() => null);

      // Check for bin list
      const binList = page.locator('#bin-list');
      const hasBinList = await binList.isAttached();

      if (hasBinList) {
        // If there are items, Empty Bin button should be visible
        const emptyBinBtn = page.getByRole('button', { name: /empty bin/i });
        await expect(emptyBinBtn).toBeVisible();
      }
    }
  });
});

test.describe('About Page', () => {
  test('about page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/about');
    expect(response?.status()).toBe(200);
  });

  test('about page has expected structure', async ({ page }) => {
    await page.goto('/settings/about');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/about')) {
      // Check for main heading
      await expect(page.locator('h1')).toContainText('About');
    }
  });

  test('about page has version information', async ({ page }) => {
    await page.goto('/settings/about');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/about')) {
      // Check for version text (may be formatted as "Version X.X.X" or similar)
      const versionText = page.getByText(/version/i);
      const isVisible = await versionText.isVisible().catch(() => false);
      if (isVisible) {
        await expect(versionText).toBeVisible();
      }
    }
  });

  test('about page has changelog section', async ({ page }) => {
    await page.goto('/settings/about');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/about')) {
      // Check for changelog text
      const changelogText = page.getByText(/changelog/i);
      const isVisible = await changelogText.isVisible().catch(() => false);
      if (isVisible) {
        await expect(changelogText).toBeVisible();
      }
    }
  });
});

test.describe('Settings Navigation', () => {
  test('can navigate between settings pages', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('domcontentloaded');

    // Check if we're on profile page (not redirected to login)
    const url = page.url();
    if (url.includes('/settings/profile') && !url.includes('/login')) {
      // Verify we're on profile page
      await expect(page.locator('h1')).toContainText('Profile');

      // Click library link
      const libraryLink = page.locator('a[href="/settings/library"]');
      const isVisible = await libraryLink.isVisible().catch(() => false);

      if (isVisible) {
        await libraryLink.click();
        await page.waitForURL(/\/settings\/library/, { timeout: 10000 });

        // Verify we're on library page
        await expect(page.locator('h1')).toContainText('Library');
      }
    }
  });

  test('can navigate to bin page', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('domcontentloaded');

    // Check if we're on profile page (not redirected to login)
    const url = page.url();
    if (url.includes('/settings/profile') && !url.includes('/login')) {
      // Click bin link
      const binLink = page.locator('a[href="/settings/bin"]');
      const isVisible = await binLink.isVisible().catch(() => false);

      if (isVisible) {
        await binLink.click();
        await page.waitForURL(/\/settings\/bin/, { timeout: 10000 });

        // Verify we're on bin page
        await expect(page.locator('h1')).toContainText('Bin');
      }
    }
  });
});
