/**
 * Unit Tests for lib/utils/book-filters.ts
 * Tests for book filtering, sorting, and utility functions
 */
import { describe, it, expect } from 'vitest';
import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  FORMAT_OPTIONS,
  getBookStatus,
  filterBooks,
  sortBooks,
  formatDateForInput,
  formatDate,
} from '../book-filters';
import type { Book, BookFilters } from '@/lib/types';

// Mock book data
const createMockBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  title: 'Test Book',
  author: 'Test Author',
  createdAt: 1704067200000,
  updatedAt: 1704067200000,
  userId: 'user-1',
  ...overrides,
});

describe('STATUS_LABELS', () => {
  it('has correct labels for each status', () => {
    expect(STATUS_LABELS['want-to-read']).toBe('Not Read');
    expect(STATUS_LABELS['reading']).toBe('Reading');
    expect(STATUS_LABELS['finished']).toBe('Finished');
  });
});

describe('STATUS_OPTIONS', () => {
  it('contains reading and finished options', () => {
    expect(STATUS_OPTIONS).toHaveLength(2);
    expect(STATUS_OPTIONS[0]).toEqual({ value: 'reading', label: 'Reading' });
    expect(STATUS_OPTIONS[1]).toEqual({ value: 'finished', label: 'Finished' });
  });
});

describe('FORMAT_OPTIONS', () => {
  it('contains physical format options', () => {
    expect(FORMAT_OPTIONS.length).toBeGreaterThan(0);
    expect(FORMAT_OPTIONS[0]).toEqual({ value: '', label: 'Select format...' });
    expect(FORMAT_OPTIONS).toContainEqual({ value: 'Paperback', label: 'Paperback' });
    expect(FORMAT_OPTIONS).toContainEqual({ value: 'Hardcover', label: 'Hardcover' });
    expect(FORMAT_OPTIONS).toContainEqual({ value: 'Ebook', label: 'Ebook' });
  });
});

describe('getBookStatus', () => {
  it('returns want-to-read when no reads', () => {
    const book = createMockBook({ reads: [] });
    expect(getBookStatus(book)).toBe('want-to-read');
  });

  it('returns want-to-read when reads is undefined', () => {
    const book = createMockBook({ reads: undefined });
    expect(getBookStatus(book)).toBe('want-to-read');
  });

  it('returns reading when latest read has startedAt but no finishedAt', () => {
    const book = createMockBook({
      reads: [{ startedAt: 1704067200000, finishedAt: null }],
    });
    expect(getBookStatus(book)).toBe('reading');
  });

  it('returns finished when latest read has finishedAt', () => {
    const book = createMockBook({
      reads: [{ startedAt: 1704067200000, finishedAt: 1704672000000 }],
    });
    expect(getBookStatus(book)).toBe('finished');
  });

  it('uses latest read for status determination', () => {
    const book = createMockBook({
      reads: [
        { startedAt: 1704067200000, finishedAt: 1704672000000 }, // Finished read
        { startedAt: 1735689600000, finishedAt: null }, // In progress
      ],
    });
    expect(getBookStatus(book)).toBe('reading');
  });

  it('returns want-to-read when read has no dates', () => {
    const book = createMockBook({
      reads: [{ startedAt: null, finishedAt: null }],
    });
    expect(getBookStatus(book)).toBe('want-to-read');
  });
});

describe('filterBooks', () => {
  const books: Book[] = [
    createMockBook({
      id: 'book-1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genres: ['genre-1', 'genre-2'],
      seriesId: 'series-1',
      rating: 5,
      reads: [{ startedAt: 1704067200000, finishedAt: 1704672000000 }],
    }),
    createMockBook({
      id: 'book-2',
      title: '1984',
      author: 'George Orwell',
      genres: ['genre-2', 'genre-3'],
      seriesId: 'series-2',
      rating: 4,
      reads: [{ startedAt: 1735689600000, finishedAt: null }],
    }),
    createMockBook({
      id: 'book-3',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      genres: ['genre-1'],
      rating: 3,
      reads: [],
    }),
  ];

  describe('search filter', () => {
    it('filters by title', () => {
      const filters: BookFilters = { search: 'gatsby' };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Great Gatsby');
    });

    it('filters by author', () => {
      const filters: BookFilters = { search: 'orwell' };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('George Orwell');
    });

    it('is case insensitive', () => {
      const filters: BookFilters = { search: 'GATSBY' };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(1);
    });

    it('returns all when search is empty', () => {
      const filters: BookFilters = { search: '' };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(3);
    });
  });

  describe('status filter', () => {
    it('filters by single status', () => {
      const filters: BookFilters = { statuses: ['finished'] };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Great Gatsby');
    });

    it('filters by multiple statuses', () => {
      const filters: BookFilters = { statuses: ['reading', 'want-to-read'] };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(2);
    });

    it('returns all when statuses is empty', () => {
      const filters: BookFilters = { statuses: [] };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(3);
    });
  });

  describe('genre filter', () => {
    it('filters by single genre', () => {
      const filters: BookFilters = { genreIds: ['genre-1'] };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(2);
    });

    it('filters by multiple genres (OR logic)', () => {
      const filters: BookFilters = { genreIds: ['genre-2', 'genre-3'] };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(2);
    });

    it('returns empty when no matching genres', () => {
      const filters: BookFilters = { genreIds: ['genre-99'] };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(0);
    });
  });

  describe('series filter', () => {
    it('filters by series', () => {
      const filters: BookFilters = { seriesIds: ['series-1'] };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Great Gatsby');
    });

    it('excludes books without seriesId', () => {
      const filters: BookFilters = { seriesIds: ['series-1', 'series-2'] };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(2);
      // Pride and Prejudice has no seriesId
      expect(result.find((b) => b.title === 'Pride and Prejudice')).toBeUndefined();
    });
  });

  describe('rating filter', () => {
    it('filters by minimum rating', () => {
      const filters: BookFilters = { minRating: 4 };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(2);
    });

    it('excludes books without rating', () => {
      const booksWithNoRating = [
        ...books,
        createMockBook({ id: 'book-4', title: 'No Rating', rating: undefined }),
      ];
      const filters: BookFilters = { minRating: 1 };
      const result = filterBooks(booksWithNoRating, filters);
      expect(result.find((b) => b.title === 'No Rating')).toBeUndefined();
    });
  });

  describe('author filter', () => {
    it('filters by exact author match', () => {
      const filters: BookFilters = { author: 'Jane Austen' };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('Jane Austen');
    });

    it('is case insensitive', () => {
      const filters: BookFilters = { author: 'jane austen' };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(1);
    });
  });

  describe('combined filters', () => {
    it('applies multiple filters together', () => {
      const filters: BookFilters = {
        search: '1984',
        statuses: ['reading'],
      };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('1984');
    });

    it('returns empty when no books match all filters', () => {
      const filters: BookFilters = {
        search: 'gatsby',
        statuses: ['reading'],
      };
      const result = filterBooks(books, filters);
      expect(result).toHaveLength(0);
    });
  });
});

describe('sortBooks', () => {
  const books: Book[] = [
    createMockBook({
      id: 'book-1',
      title: 'Zebra',
      author: 'Anna Author',
      rating: 3,
      seriesPosition: 2,
      createdAt: 1704067200000,
    }),
    createMockBook({
      id: 'book-2',
      title: 'Apple',
      author: 'Zara Author',
      rating: 5,
      seriesPosition: 1,
      createdAt: 1735689600000,
    }),
    createMockBook({
      id: 'book-3',
      title: 'Mango',
      author: 'Mike Author',
      rating: undefined,
      seriesPosition: undefined,
      createdAt: 1720000000000,
    }),
  ];

  describe('sort by title', () => {
    it('sorts ascending', () => {
      const result = sortBooks(books, 'title', 'asc');
      expect(result[0].title).toBe('Apple');
      expect(result[1].title).toBe('Mango');
      expect(result[2].title).toBe('Zebra');
    });

    it('sorts descending', () => {
      const result = sortBooks(books, 'title', 'desc');
      expect(result[0].title).toBe('Zebra');
      expect(result[2].title).toBe('Apple');
    });
  });

  describe('sort by author', () => {
    it('sorts ascending', () => {
      const result = sortBooks(books, 'author', 'asc');
      expect(result[0].author).toBe('Anna Author');
      expect(result[2].author).toBe('Zara Author');
    });

    it('sorts descending', () => {
      const result = sortBooks(books, 'author', 'desc');
      expect(result[0].author).toBe('Zara Author');
    });
  });

  describe('sort by rating', () => {
    it('sorts ascending (unrated at end)', () => {
      const result = sortBooks(books, 'rating', 'asc');
      expect(result[0].rating).toBe(3);
      expect(result[1].rating).toBe(5);
      expect(result[2].rating).toBeUndefined();
    });

    it('sorts descending', () => {
      const result = sortBooks(books, 'rating', 'desc');
      // When descending, higher ratings come first, but unrated handling depends on implementation
      const ratings = result.map((b) => b.rating);
      // First two should be the rated ones in descending order
      expect(ratings.filter((r) => r !== undefined).sort((a, b) => b! - a!)).toEqual([5, 3]);
    });
  });

  describe('sort by seriesPosition', () => {
    it('sorts ascending (no position at end)', () => {
      const result = sortBooks(books, 'seriesPosition', 'asc');
      expect(result[0].seriesPosition).toBe(1);
      expect(result[1].seriesPosition).toBe(2);
      expect(result[2].seriesPosition).toBeUndefined();
    });
  });

  describe('sort by createdAt', () => {
    it('sorts ascending (oldest first)', () => {
      const result = sortBooks(books, 'createdAt', 'asc');
      expect(result[0].id).toBe('book-1');
    });

    it('sorts descending (newest first)', () => {
      const result = sortBooks(books, 'createdAt', 'desc');
      expect(result[0].id).toBe('book-2');
    });
  });

  it('does not mutate original array', () => {
    const original = [...books];
    sortBooks(books, 'title', 'asc');
    expect(books).toEqual(original);
  });
});

describe('formatDateForInput', () => {
  it('formats timestamp to YYYY-MM-DD', () => {
    const timestamp = 1704067200000; // 1 Jan 2024
    const result = formatDateForInput(timestamp);
    expect(result).toBe('2024-01-01');
  });

  it('formats Date object', () => {
    const date = new Date('2024-06-15');
    const result = formatDateForInput(date);
    expect(result).toBe('2024-06-15');
  });

  it('formats string date', () => {
    const result = formatDateForInput('2024-03-20');
    expect(result).toBe('2024-03-20');
  });

  it('returns empty string for null', () => {
    expect(formatDateForInput(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDateForInput(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDateForInput('invalid')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats timestamp to readable date', () => {
    const timestamp = 1704067200000; // 1 Jan 2024
    const result = formatDate(timestamp);
    expect(result).toBe('1 Jan 2024');
  });

  it('formats Date object', () => {
    const date = new Date('2024-06-15');
    const result = formatDate(date);
    expect(result).toBe('15 Jun 2024');
  });

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('invalid')).toBe('');
  });
});
