/**
 * Books Pages E2E Tests
 * Tests for book list, add, view, and edit pages.
 */
import { test, expect } from '@playwright/test';

test.describe('Books List Page', () => {
  test('books page returns 200', async ({ page }) => {
    const response = await page.goto('/books');
    expect(response?.status()).toBe(200);
  });

  test('books page has filter panel', async ({ page }) => {
    await page.goto('/books');
    await page.waitForLoadState('domcontentloaded');

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
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books')) {
      // Check FAB or add button exists
      const addBtn = page.locator('a[href="/books/add"]');
      await expect(addBtn).toBeAttached();
    }
  });

  test('books page has loading and empty states', async ({ page }) => {
    await page.goto('/books');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books')) {
      // Check loading state element exists
      await expect(page.locator('#loading')).toBeAttached();

      // Check empty state element exists
      await expect(page.locator('#empty-state')).toBeAttached();
    }
  });
});

test.describe('Add Book Page', () => {
  test('add book page returns 200', async ({ page }) => {
    const response = await page.goto('/books/add');
    expect(response?.status()).toBe(200);
  });

  test('add book page has search functionality', async ({ page }) => {
    await page.goto('/books/add');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books/add')) {
      // Check search input exists
      await expect(page.locator('#book-search')).toBeAttached();

      // Check search results container exists
      await expect(page.locator('#search-results')).toBeAttached();

      // Check barcode scan button exists
      await expect(page.locator('#scan-btn')).toBeAttached();
    }
  });

  test('add book page has form with required fields', async ({ page }) => {
    await page.goto('/books/add');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books/add')) {
      // Check form exists
      await expect(page.locator('#book-form')).toBeAttached();

      // Check required fields
      await expect(page.locator('#title')).toBeAttached();
      await expect(page.locator('#author')).toBeAttached();
    }
  });

  test('add book page has optional fields', async ({ page }) => {
    await page.goto('/books/add');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books/add')) {
      // Check optional fields
      await expect(page.locator('#isbn')).toBeAttached();
      await expect(page.locator('#publisher')).toBeAttached();
      await expect(page.locator('#publishedDate')).toBeAttached();
      await expect(page.locator('#pageCount')).toBeAttached();
      await expect(page.locator('#physicalFormat')).toBeAttached();
    }
  });

  test('add book page has genre picker', async ({ page }) => {
    await page.goto('/books/add');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books/add')) {
      // Check genre picker container
      await expect(page.locator('#genre-picker')).toBeAttached();
    }
  });

  test('add book page has series picker', async ({ page }) => {
    await page.goto('/books/add');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books/add')) {
      // Check series picker container
      await expect(page.locator('#series-picker')).toBeAttached();
    }
  });

  test('add book page has rating input', async ({ page }) => {
    await page.goto('/books/add');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books/add')) {
      // Check rating input container
      await expect(page.locator('#rating-input')).toBeAttached();
    }
  });

  test('add book page has cover picker', async ({ page }) => {
    await page.goto('/books/add');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books/add')) {
      // Check cover picker container
      await expect(page.locator('#cover-picker')).toBeAttached();
    }
  });
});

test.describe('Book View Page', () => {
  test('book view page returns 200 with id param', async ({ page }) => {
    // Without a valid ID, should still return 200 (page exists, shows error state)
    const response = await page.goto('/books/test');
    expect(response?.status()).toBe(200);
  });

  test('book view page has expected containers', async ({ page }) => {
    await page.goto('/books/test');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/books/')) {
      // Check loading state exists
      await expect(page.locator('#loading-state')).toBeAttached();
    }
  });
});

test.describe('Book Edit Page', () => {
  test('book edit page returns 200 with id param', async ({ page }) => {
    const response = await page.goto('/books/test/edit');
    expect(response?.status()).toBe(200);
  });

  test('book edit page has form', async ({ page }) => {
    await page.goto('/books/test/edit');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    if (url.includes('/edit')) {
      // Check edit form exists
      await expect(page.locator('#edit-form')).toBeAttached();
    }
  });
});
