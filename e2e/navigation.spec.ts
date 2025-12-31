/**
 * Navigation E2E Tests
 * Tests for page accessibility and PWA configuration
 */
import { test, expect } from '@playwright/test';

test.describe('Navigation - Page Accessibility', () => {
  test('login page is accessible', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });

  test('home page returns 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('books page returns 200', async ({ page }) => {
    const response = await page.goto('/books');
    expect(response?.status()).toBe(200);
  });

  test('add book page returns 200', async ({ page }) => {
    const response = await page.goto('/books/add');
    expect(response?.status()).toBe(200);
  });

  test('settings page returns 200', async ({ page }) => {
    const response = await page.goto('/settings');
    expect(response?.status()).toBe(200);
  });
});

test.describe('PWA Configuration', () => {
  test('has correct meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');

    // Check theme color
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBe('#2563eb');

    // Check manifest link
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
  });
});

test.describe('Login Page Elements', () => {
  test('login form elements are visible', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();
  });

  test('can switch to register form', async ({ page }) => {
    await page.goto('/login');

    // Click to show register form
    await page.click('#show-register-btn');

    // Register form elements
    await expect(page.locator('#register-email')).toBeVisible();
    await expect(page.locator('#register-password')).toBeVisible();
    await expect(page.locator('#register-password-confirm')).toBeVisible();
  });
});

test.describe('Add Book Page Elements', () => {
  test('add book page has expected elements if not redirected', async ({ page }) => {
    await page.goto('/books/add');

    // Wait a moment for potential redirect
    await page.waitForTimeout(500);

    const url = page.url();
    if (url.includes('/books/add')) {
      await expect(page.locator('#scan-btn')).toBeVisible();
      await expect(page.locator('#book-search')).toBeVisible();
      await expect(page.locator('#book-form')).toBeVisible();
    } else {
      // We were redirected to login - expected for unauthenticated users
      expect(url).toContain('/login');
    }
  });
});

test.describe('Books Page Elements', () => {
  test('books page has filter button', async ({ page }) => {
    await page.goto('/books');

    await page.waitForTimeout(500);

    const url = page.url();
    if (url.includes('/books')) {
      // Check filter button exists (mobile)
      await expect(page.locator('#filter-btn')).toBeAttached();

      // Check book list container exists
      await expect(page.locator('#book-list')).toBeAttached();
    }
  });

  test('books page has add book button', async ({ page }) => {
    await page.goto('/books');

    await page.waitForTimeout(500);

    const url = page.url();
    if (url.includes('/books')) {
      // Check FAB or add button exists
      const addBtn = page.locator('a[href="/books/add"]');
      await expect(addBtn).toBeAttached();
    }
  });
});
