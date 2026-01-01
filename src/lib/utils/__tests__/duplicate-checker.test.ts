/**
 * Unit Tests for lib/utils/duplicate-checker.ts
 * Tests for ISBN validation, cleaning, and duplicate checking functions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase before importing the module
const mockGetDocs = vi.fn();

vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'books-collection'),
  query: vi.fn(() => 'query'),
  where: vi.fn(),
  limit: vi.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}));

import { isISBN, cleanISBN, checkForDuplicate, DUPLICATE_CHECK_LIMIT } from '../duplicate-checker';

describe('isISBN', () => {
  describe('valid ISBN-10', () => {
    it('accepts 10-digit ISBN', () => {
      expect(isISBN('0123456789')).toBe(true);
    });

    it('accepts ISBN-10 with dashes', () => {
      expect(isISBN('0-12-345678-9')).toBe(true);
    });

    it('accepts ISBN-10 with spaces', () => {
      expect(isISBN('0 12 345678 9')).toBe(true);
    });

    it('accepts ISBN-10 with "ISBN:" prefix', () => {
      expect(isISBN('ISBN: 0123456789')).toBe(true);
    });

    it('accepts ISBN-10 with "ISBN-10:" prefix', () => {
      expect(isISBN('ISBN-10: 0123456789')).toBe(true);
    });
  });

  describe('valid ISBN-13', () => {
    it('accepts 13-digit ISBN', () => {
      expect(isISBN('9780123456789')).toBe(true);
    });

    it('accepts ISBN-13 with dashes', () => {
      expect(isISBN('978-0-12-345678-9')).toBe(true);
    });

    it('accepts ISBN-13 with spaces', () => {
      expect(isISBN('978 0 12 345678 9')).toBe(true);
    });

    it('accepts ISBN-13 with "ISBN:" prefix', () => {
      expect(isISBN('ISBN: 9780123456789')).toBe(true);
    });

    it('accepts ISBN-13 with "ISBN-13:" prefix', () => {
      expect(isISBN('ISBN-13: 9780123456789')).toBe(true);
    });
  });

  describe('invalid ISBN', () => {
    it('rejects empty string', () => {
      expect(isISBN('')).toBe(false);
    });

    it('rejects null', () => {
      expect(isISBN(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isISBN(undefined)).toBe(false);
    });

    it('rejects 9-digit number', () => {
      expect(isISBN('012345678')).toBe(false);
    });

    it('rejects 11-digit number', () => {
      expect(isISBN('01234567890')).toBe(false);
    });

    it('rejects 12-digit number', () => {
      expect(isISBN('012345678901')).toBe(false);
    });

    it('rejects 14-digit number', () => {
      expect(isISBN('01234567890123')).toBe(false);
    });

    it('rejects non-numeric text', () => {
      expect(isISBN('abcdefghij')).toBe(false);
    });

    it('rejects mixed alphanumeric', () => {
      expect(isISBN('012345678X')).toBe(false);
    });

    it('rejects book title', () => {
      expect(isISBN('The Great Gatsby')).toBe(false);
    });
  });
});

describe('cleanISBN', () => {
  describe('basic cleaning', () => {
    it('returns same digits for clean ISBN-10', () => {
      expect(cleanISBN('0123456789')).toBe('0123456789');
    });

    it('returns same digits for clean ISBN-13', () => {
      expect(cleanISBN('9780123456789')).toBe('9780123456789');
    });

    it('removes dashes', () => {
      expect(cleanISBN('978-0-12-345678-9')).toBe('9780123456789');
    });

    it('removes spaces', () => {
      expect(cleanISBN('978 0 12 345678 9')).toBe('9780123456789');
    });

    it('removes mixed dashes and spaces', () => {
      expect(cleanISBN('978-0 12-345678 9')).toBe('9780123456789');
    });
  });

  describe('prefix handling', () => {
    it('removes "ISBN:" prefix', () => {
      expect(cleanISBN('ISBN: 9780123456789')).toBe('9780123456789');
    });

    it('removes "ISBN-10:" prefix', () => {
      expect(cleanISBN('ISBN-10: 0123456789')).toBe('0123456789');
    });

    it('removes "ISBN-13:" prefix', () => {
      expect(cleanISBN('ISBN-13: 9780123456789')).toBe('9780123456789');
    });

    it('removes "isbn" prefix (lowercase)', () => {
      expect(cleanISBN('isbn 9780123456789')).toBe('9780123456789');
    });

    it('handles prefix with various separators', () => {
      expect(cleanISBN('ISBN:9780123456789')).toBe('9780123456789');
      expect(cleanISBN('ISBN-9780123456789')).toBe('9780123456789');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for null', () => {
      expect(cleanISBN(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(cleanISBN(undefined)).toBe('');
    });

    it('returns empty string for empty input', () => {
      expect(cleanISBN('')).toBe('');
    });

    it('preserves non-ISBN text after cleaning attempts', () => {
      // After removing ISBN prefix and separators, text remains
      expect(cleanISBN('TheGreatGatsby')).toBe('TheGreatGatsby');
    });
  });
});

describe('DUPLICATE_CHECK_LIMIT', () => {
  it('is defined', () => {
    expect(DUPLICATE_CHECK_LIMIT).toBeDefined();
  });

  it('is a reasonable number', () => {
    expect(DUPLICATE_CHECK_LIMIT).toBeGreaterThan(0);
    expect(DUPLICATE_CHECK_LIMIT).toBeLessThanOrEqual(500);
  });
});

describe('checkForDuplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocs.mockReset();
  });

  describe('ISBN matching', () => {
    it('finds duplicate by ISBN', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-book',
            data: () => ({
              isbn: '9780123456789',
              title: 'Existing Book',
              author: 'Existing Author',
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        '9780123456789',
        'New Book',
        'New Author'
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.matchType).toBe('isbn');
      expect(result.existingBook?.id).toBe('existing-book');
    });

    it('returns no duplicate when ISBN not found', async () => {
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await checkForDuplicate(
        'user-123',
        '9780123456789',
        'New Book',
        'New Author'
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.matchType).toBe(null);
      expect(result.existingBook).toBe(null);
    });
  });

  describe('title/author matching', () => {
    it('finds duplicate by exact title and author', async () => {
      // No ISBN provided, so only title/author query runs
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-book',
            data: () => ({
              title: 'The Great Gatsby',
              author: 'F. Scott Fitzgerald',
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        null,
        'The Great Gatsby',
        'F. Scott Fitzgerald'
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.matchType).toBe('title-author');
    });

    it('matches case-insensitively', async () => {
      // No ISBN provided, so only title/author query runs
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-book',
            data: () => ({
              title: 'THE GREAT GATSBY',
              author: 'F. SCOTT FITZGERALD',
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        null,
        'the great gatsby',
        'f. scott fitzgerald'
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.matchType).toBe('title-author');
    });

    it('handles extra whitespace in comparison', async () => {
      // No ISBN provided, so only title/author query runs
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-book',
            data: () => ({
              title: 'The   Great   Gatsby',
              author: 'F.  Scott  Fitzgerald',
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        null,
        'The Great Gatsby',
        'F. Scott Fitzgerald'
      );

      expect(result.isDuplicate).toBe(true);
    });

    it('does not match when only title matches', async () => {
      // No ISBN provided, so only title/author query runs
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-book',
            data: () => ({
              title: 'The Great Gatsby',
              author: 'Different Author',
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        null,
        'The Great Gatsby',
        'F. Scott Fitzgerald'
      );

      expect(result.isDuplicate).toBe(false);
    });

    it('does not match when only author matches', async () => {
      // No ISBN provided, so only title/author query runs
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-book',
            data: () => ({
              title: 'Different Title',
              author: 'F. Scott Fitzgerald',
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        null,
        'The Great Gatsby',
        'F. Scott Fitzgerald'
      );

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('ISBN priority', () => {
    it('checks ISBN before title/author', async () => {
      // ISBN match found first
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'isbn-match',
            data: () => ({
              isbn: '9780123456789',
              title: 'Different Title',
              author: 'Different Author',
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        '9780123456789',
        'The Great Gatsby',
        'F. Scott Fitzgerald'
      );

      expect(result.matchType).toBe('isbn');
      // Should only call getDocs once (for ISBN query)
      expect(mockGetDocs).toHaveBeenCalledTimes(1);
    });
  });

  describe('no ISBN provided', () => {
    it('skips ISBN query when ISBN is null', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      await checkForDuplicate(
        'user-123',
        null,
        'Test Book',
        'Test Author'
      );

      // Should only make one query (title/author check)
      expect(mockGetDocs).toHaveBeenCalledTimes(1);
    });

    it('skips ISBN query when ISBN is undefined', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      await checkForDuplicate(
        'user-123',
        undefined,
        'Test Book',
        'Test Author'
      );

      expect(mockGetDocs).toHaveBeenCalledTimes(1);
    });

    it('skips ISBN query when ISBN is empty string', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      await checkForDuplicate(
        'user-123',
        '',
        'Test Book',
        'Test Author'
      );

      // Empty string is falsy, so ISBN query skipped
      expect(mockGetDocs).toHaveBeenCalledTimes(1);
    });
  });

  describe('result structure', () => {
    it('returns existingBook with id and data for ISBN match', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'book-123',
            data: () => ({
              isbn: '9780123456789',
              title: 'Test Book',
              author: 'Test Author',
              rating: 5,
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        '9780123456789',
        'Different Title',
        'Different Author'
      );

      expect(result.existingBook).toEqual({
        id: 'book-123',
        isbn: '9780123456789',
        title: 'Test Book',
        author: 'Test Author',
        rating: 5,
      });
    });

    it('returns existingBook with id and data for title/author match', async () => {
      // No ISBN provided, so only title/author query runs
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'book-456',
            data: () => ({
              title: 'Test Book',
              author: 'Test Author',
              genres: ['Fiction'],
            }),
          },
        ],
      });

      const result = await checkForDuplicate(
        'user-123',
        null,
        'Test Book',
        'Test Author'
      );

      expect(result.existingBook).toEqual({
        id: 'book-456',
        title: 'Test Book',
        author: 'Test Author',
        genres: ['Fiction'],
      });
    });
  });
});
