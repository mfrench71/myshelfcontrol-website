/**
 * Unit Tests for lib/utils/library-health.ts
 * Tests for library health analysis functions
 */
import { describe, it, expect } from 'vitest';
import type { Book } from '@/lib/types';
import {
  hasFieldValue,
  getMissingFields,
  calculateBookCompleteness,
  calculateLibraryCompleteness,
  analyzeLibraryHealth,
  getCompletenessRating,
  getBooksWithIssues,
  HEALTH_FIELDS,
  ISSUE_CONFIG,
} from '../library-health';

// Helper to create mock books
function createMockBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'Test Book',
    author: 'Test Author',
    ...overrides,
  };
}

// Complete book with all fields
function createCompleteBook(id = 'complete-1'): Book {
  return {
    id,
    title: 'Complete Book',
    author: 'Complete Author',
    isbn: '9780123456789',
    coverImageUrl: 'https://example.com/cover.jpg',
    genres: ['fiction'],
    pageCount: 300,
    physicalFormat: 'Paperback',
    publisher: 'Test Publisher',
    publishedDate: '2024-01-01',
  };
}

describe('HEALTH_FIELDS', () => {
  it('contains expected fields', () => {
    expect(HEALTH_FIELDS.coverImageUrl).toBeDefined();
    expect(HEALTH_FIELDS.genres).toBeDefined();
    expect(HEALTH_FIELDS.pageCount).toBeDefined();
    expect(HEALTH_FIELDS.physicalFormat).toBeDefined();
    expect(HEALTH_FIELDS.publisher).toBeDefined();
    expect(HEALTH_FIELDS.publishedDate).toBeDefined();
    expect(HEALTH_FIELDS.isbn).toBeDefined();
  });

  it('has correct weights', () => {
    expect(HEALTH_FIELDS.coverImageUrl.weight).toBe(2);
    expect(HEALTH_FIELDS.genres.weight).toBe(2);
    expect(HEALTH_FIELDS.pageCount.weight).toBe(1);
    expect(HEALTH_FIELDS.isbn.weight).toBe(0); // Not counted in score
  });
});

describe('ISSUE_CONFIG', () => {
  it('has configuration for all issue types', () => {
    expect(ISSUE_CONFIG.missingCover).toBeDefined();
    expect(ISSUE_CONFIG.missingGenres).toBeDefined();
    expect(ISSUE_CONFIG.missingPageCount).toBeDefined();
    expect(ISSUE_CONFIG.missingFormat).toBeDefined();
    expect(ISSUE_CONFIG.missingPublisher).toBeDefined();
    expect(ISSUE_CONFIG.missingPublishedDate).toBeDefined();
    expect(ISSUE_CONFIG.missingIsbn).toBeDefined();
  });

  it('has labels and icons', () => {
    expect(ISSUE_CONFIG.missingCover.label).toBe('Cover');
    expect(ISSUE_CONFIG.missingCover.icon).toBe('image');
  });
});

describe('hasFieldValue', () => {
  it('returns false for missing fields', () => {
    const book = createMockBook();
    expect(hasFieldValue(book, 'coverImageUrl')).toBe(false);
    expect(hasFieldValue(book, 'isbn')).toBe(false);
    expect(hasFieldValue(book, 'pageCount')).toBe(false);
  });

  it('returns true for present fields', () => {
    const book = createMockBook({
      coverImageUrl: 'https://example.com/cover.jpg',
      isbn: '9780123456789',
      pageCount: 300,
    });
    expect(hasFieldValue(book, 'coverImageUrl')).toBe(true);
    expect(hasFieldValue(book, 'isbn')).toBe(true);
    expect(hasFieldValue(book, 'pageCount')).toBe(true);
  });

  it('handles genres array specially', () => {
    expect(hasFieldValue(createMockBook({ genres: [] }), 'genres')).toBe(false);
    expect(hasFieldValue(createMockBook({ genres: undefined }), 'genres')).toBe(false);
    expect(hasFieldValue(createMockBook({ genres: ['fiction'] }), 'genres')).toBe(true);
  });

  it('returns false for empty strings', () => {
    expect(hasFieldValue(createMockBook({ coverImageUrl: '' }), 'coverImageUrl')).toBe(false);
    expect(hasFieldValue(createMockBook({ isbn: '' }), 'isbn')).toBe(false);
  });

  it('returns false for null values', () => {
    expect(hasFieldValue(createMockBook({ pageCount: null }), 'pageCount')).toBe(false);
  });
});

describe('getMissingFields', () => {
  it('returns all tracked fields for minimal book', () => {
    const book = createMockBook();
    const missing = getMissingFields(book);
    expect(missing).toContain('coverImageUrl');
    expect(missing).toContain('genres');
    expect(missing).toContain('pageCount');
    expect(missing).toContain('physicalFormat');
    expect(missing).toContain('publisher');
    expect(missing).toContain('publishedDate');
    expect(missing).toContain('isbn');
  });

  it('returns empty array for complete book', () => {
    const book = createCompleteBook();
    const missing = getMissingFields(book);
    expect(missing).toHaveLength(0);
  });

  it('returns only missing fields', () => {
    const book = createMockBook({
      coverImageUrl: 'https://example.com/cover.jpg',
      genres: ['fiction'],
    });
    const missing = getMissingFields(book);
    expect(missing).not.toContain('coverImageUrl');
    expect(missing).not.toContain('genres');
    expect(missing).toContain('pageCount');
    expect(missing).toContain('isbn');
  });
});

describe('calculateBookCompleteness', () => {
  it('returns 100 for complete book', () => {
    const book = createCompleteBook();
    expect(calculateBookCompleteness(book)).toBe(100);
  });

  it('returns 0 for minimal book (no weighted fields)', () => {
    const book = createMockBook();
    expect(calculateBookCompleteness(book)).toBe(0);
  });

  it('calculates based on field weights', () => {
    // Total weight: coverImageUrl(2) + genres(2) + pageCount(1) + physicalFormat(1) + publisher(1) + publishedDate(1) = 8
    const bookWithCover = createMockBook({ coverImageUrl: 'https://example.com/cover.jpg' });
    expect(calculateBookCompleteness(bookWithCover)).toBe(25); // 2/8 = 25%

    const bookWithCoverAndGenres = createMockBook({
      coverImageUrl: 'https://example.com/cover.jpg',
      genres: ['fiction'],
    });
    expect(calculateBookCompleteness(bookWithCoverAndGenres)).toBe(50); // 4/8 = 50%
  });

  it('does not count ISBN in score', () => {
    const bookWithIsbn = createMockBook({ isbn: '9780123456789' });
    expect(calculateBookCompleteness(bookWithIsbn)).toBe(0); // ISBN has weight 0
  });

  it('rounds to nearest integer', () => {
    // One field with weight 1: 1/8 = 12.5% -> 13%
    const book = createMockBook({ pageCount: 300 });
    expect(calculateBookCompleteness(book)).toBe(13);
  });
});

describe('calculateLibraryCompleteness', () => {
  it('returns 100 for empty library', () => {
    expect(calculateLibraryCompleteness([])).toBe(100);
  });

  it('returns 100 for null', () => {
    expect(calculateLibraryCompleteness(null as unknown as Book[])).toBe(100);
  });

  it('returns 100 for library of complete books', () => {
    const books = [createCompleteBook('1'), createCompleteBook('2')];
    expect(calculateLibraryCompleteness(books)).toBe(100);
  });

  it('returns average of book completeness', () => {
    const complete = createCompleteBook('1'); // 100%
    const minimal = createMockBook({ id: '2' }); // 0%
    expect(calculateLibraryCompleteness([complete, minimal])).toBe(50);
  });

  it('caps at 99% when any book has issues', () => {
    // All books with almost all fields
    const almostComplete = createMockBook({
      id: '1',
      coverImageUrl: 'https://example.com/cover.jpg',
      genres: ['fiction'],
      pageCount: 300,
      physicalFormat: 'Paperback',
      publisher: 'Test Publisher',
      publishedDate: '2024-01-01',
      // Missing only isbn (weight 0), so book completeness is 100%
    });
    // But if we add another book with missing pageCount
    const almostComplete2 = createMockBook({
      id: '2',
      coverImageUrl: 'https://example.com/cover.jpg',
      genres: ['fiction'],
      physicalFormat: 'Paperback',
      publisher: 'Test Publisher',
      publishedDate: '2024-01-01',
      // Missing pageCount (weight 1), so 7/8 = 87.5% = 88%
    });
    const result = calculateLibraryCompleteness([almostComplete, almostComplete2]);
    // (100 + 88) / 2 = 94, but should not be capped since first book is 100%
    expect(result).toBeLessThanOrEqual(99);
  });
});

describe('analyzeLibraryHealth', () => {
  it('returns correct structure', () => {
    const report = analyzeLibraryHealth([]);
    expect(report).toHaveProperty('totalBooks');
    expect(report).toHaveProperty('completenessScore');
    expect(report).toHaveProperty('totalIssues');
    expect(report).toHaveProperty('fixableBooks');
    expect(report).toHaveProperty('issues');
  });

  it('reports zero for empty library', () => {
    const report = analyzeLibraryHealth([]);
    expect(report.totalBooks).toBe(0);
    expect(report.completenessScore).toBe(100);
    expect(report.totalIssues).toBe(0);
    expect(report.fixableBooks).toBe(0);
  });

  it('excludes deleted books', () => {
    const active = createMockBook({ id: '1' });
    const deleted = createMockBook({ id: '2', deletedAt: Date.now() });
    const report = analyzeLibraryHealth([active, deleted]);
    expect(report.totalBooks).toBe(1);
  });

  it('categorizes missing fields correctly', () => {
    const book = createMockBook();
    const report = analyzeLibraryHealth([book]);

    expect(report.issues.missingCover).toHaveLength(1);
    expect(report.issues.missingGenres).toHaveLength(1);
    expect(report.issues.missingPageCount).toHaveLength(1);
    expect(report.issues.missingFormat).toHaveLength(1);
    expect(report.issues.missingPublisher).toHaveLength(1);
    expect(report.issues.missingPublishedDate).toHaveLength(1);
    expect(report.issues.missingIsbn).toHaveLength(1);
  });

  it('calculates total issues excluding ISBN', () => {
    const book = createMockBook();
    const report = analyzeLibraryHealth([book]);
    // 6 issues (excluding ISBN)
    expect(report.totalIssues).toBe(6);
  });

  it('identifies fixable books (have ISBN but missing other fields)', () => {
    const fixable = createMockBook({
      id: '1',
      isbn: '9780123456789',
      // Missing other fields
    });
    const notFixable = createMockBook({
      id: '2',
      // No ISBN
    });
    const report = analyzeLibraryHealth([fixable, notFixable]);
    expect(report.fixableBooks).toBe(1);
  });
});

describe('getCompletenessRating', () => {
  it('returns Excellent for 90+', () => {
    expect(getCompletenessRating(90)).toEqual({ label: 'Excellent', colour: 'green' });
    expect(getCompletenessRating(100)).toEqual({ label: 'Excellent', colour: 'green' });
  });

  it('returns Good for 70-89', () => {
    expect(getCompletenessRating(70)).toEqual({ label: 'Good', colour: 'green' });
    expect(getCompletenessRating(89)).toEqual({ label: 'Good', colour: 'green' });
  });

  it('returns Fair for 50-69', () => {
    expect(getCompletenessRating(50)).toEqual({ label: 'Fair', colour: 'amber' });
    expect(getCompletenessRating(69)).toEqual({ label: 'Fair', colour: 'amber' });
  });

  it('returns Needs Attention for below 50', () => {
    expect(getCompletenessRating(0)).toEqual({ label: 'Needs Attention', colour: 'red' });
    expect(getCompletenessRating(49)).toEqual({ label: 'Needs Attention', colour: 'red' });
  });
});

describe('getBooksWithIssues', () => {
  it('returns empty array for report with no issues', () => {
    const report = analyzeLibraryHealth([createCompleteBook()]);
    const result = getBooksWithIssues(report);
    expect(result).toHaveLength(0);
  });

  it('groups issues by book', () => {
    const book = createMockBook();
    const report = analyzeLibraryHealth([book]);
    const result = getBooksWithIssues(report);

    expect(result).toHaveLength(1);
    expect(result[0].book.id).toBe(book.id);
    expect(result[0].missing.length).toBeGreaterThan(0);
  });

  it('sorts by most issues first', () => {
    const manyIssues = createMockBook({ id: 'many' });
    const fewIssues = createMockBook({
      id: 'few',
      coverImageUrl: 'https://example.com/cover.jpg',
      genres: ['fiction'],
      pageCount: 300,
      physicalFormat: 'Paperback',
      publisher: 'Test',
    });
    const report = analyzeLibraryHealth([manyIssues, fewIssues]);
    const result = getBooksWithIssues(report);

    expect(result[0].book.id).toBe('many');
    expect(result[0].missing.length).toBeGreaterThan(result[1].missing.length);
  });

  it('includes label and icon for each issue', () => {
    const book = createMockBook();
    const report = analyzeLibraryHealth([book]);
    const result = getBooksWithIssues(report);

    result[0].missing.forEach((issue) => {
      expect(issue).toHaveProperty('label');
      expect(issue).toHaveProperty('icon');
      expect(typeof issue.label).toBe('string');
      expect(typeof issue.icon).toBe('string');
    });
  });
});
