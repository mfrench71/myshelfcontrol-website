/**
 * Settings Pages E2E Tests
 * Tests for settings hub and sub-pages
 */
import { test, expect } from '@playwright/test';

test.describe('Settings Hub Page', () => {
  test('settings page returns 200', async ({ page }) => {
    const response = await page.goto('/settings');
    expect(response?.status()).toBe(200);
  });

  test('settings page has section links', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings')) {
      // Check for settings section links
      await expect(page.locator('a[href="/settings/profile"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/library"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/preferences"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/maintenance"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/bin"]')).toBeAttached();
      await expect(page.locator('a[href="/settings/about"]')).toBeAttached();
    }
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

  test('profile page has breadcrumb navigation', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/settings/profile')) {
      // Check breadcrumb has link back to settings
      await expect(page.locator('a[href="/settings"]')).toBeAttached();
    }
  });
});

test.describe('Library Settings Page', () => {
  test('library page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/library');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Preferences Page', () => {
  test('preferences page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/preferences');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Maintenance Page', () => {
  test('maintenance page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/maintenance');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Bin Page', () => {
  test('bin page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/bin');
    expect(response?.status()).toBe(200);
  });
});

test.describe('About Page', () => {
  test('about page returns 200', async ({ page }) => {
    const response = await page.goto('/settings/about');
    expect(response?.status()).toBe(200);
  });
});
