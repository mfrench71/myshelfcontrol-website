/**
 * Unit Tests for lib/schemas/book.ts
 * Tests for book form validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  BookFormSchema,
  BookUpdateSchema,
  QuickAddBookSchema,
  PhysicalFormatSchema,
  ReadingStatusSchema,
  BookReadSchema,
  BookImageSchema,
  BookCoversSchema,
} from '../book';

describe('PhysicalFormatSchema', () => {
  it('accepts valid formats', () => {
    const validFormats = [
      '',
      'Paperback',
      'Hardcover',
      'Mass Market Paperback',
      'Trade Paperback',
      'Library Binding',
      'Spiral-bound',
      'Audio CD',
      'Ebook',
    ];

    validFormats.forEach((format) => {
      const result = PhysicalFormatSchema.safeParse(format);
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid formats', () => {
    const result = PhysicalFormatSchema.safeParse('Invalid Format');
    expect(result.success).toBe(false);
  });
});

describe('ReadingStatusSchema', () => {
  it('accepts valid statuses', () => {
    const validStatuses = ['to-read', 'reading', 'completed', 'dnf'];

    validStatuses.forEach((status) => {
      const result = ReadingStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid status', () => {
    const result = ReadingStatusSchema.safeParse('unknown');
    expect(result.success).toBe(false);
  });
});

describe('BookReadSchema', () => {
  it('accepts empty read entry', () => {
    const result = BookReadSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts string dates', () => {
    const result = BookReadSchema.safeParse({
      startedAt: '2024-01-01',
      finishedAt: '2024-02-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts number timestamps', () => {
    const result = BookReadSchema.safeParse({
      startedAt: 1704067200000,
      finishedAt: 1706745600000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts Date objects', () => {
    const result = BookReadSchema.safeParse({
      startedAt: new Date(),
      finishedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('accepts null dates', () => {
    const result = BookReadSchema.safeParse({
      startedAt: null,
      finishedAt: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('BookImageSchema', () => {
  it('accepts valid image', () => {
    const result = BookImageSchema.safeParse({
      id: 'img-123',
      url: 'https://example.com/image.jpg',
      storagePath: 'users/123/books/456/images/img-123.jpg',
      isPrimary: true,
      uploadedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = BookImageSchema.safeParse({
      id: 'img-123',
      url: 'https://example.com/image.jpg',
      storagePath: 'path/to/image',
      isPrimary: false,
      caption: 'Book cover',
      uploadedAt: Date.now(),
      sizeBytes: 102400,
      width: 400,
      height: 600,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = BookImageSchema.safeParse({
      id: 'img-123',
      url: 'not-a-url',
      storagePath: 'path',
      isPrimary: true,
      uploadedAt: Date.now(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = BookImageSchema.safeParse({
      id: 'img-123',
    });
    expect(result.success).toBe(false);
  });
});

describe('BookCoversSchema', () => {
  it('accepts record of cover sources', () => {
    const result = BookCoversSchema.safeParse({
      googleBooks: 'https://books.google.com/cover.jpg',
      openLibrary: 'https://covers.openlibrary.org/cover.jpg',
      custom: 'https://example.com/cover.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = BookCoversSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts undefined values', () => {
    const result = BookCoversSchema.safeParse({
      googleBooks: undefined,
      openLibrary: 'https://example.com/cover.jpg',
    });
    expect(result.success).toBe(true);
  });
});

describe('BookFormSchema', () => {
  describe('title validation', () => {
    it('requires title', () => {
      const result = BookFormSchema.safeParse({
        title: '',
        author: 'Author',
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from title', () => {
      const result = BookFormSchema.safeParse({
        title: '  The Great Gatsby  ',
        author: 'F. Scott Fitzgerald',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('The Great Gatsby');
      }
    });

    it('rejects title over 500 characters', () => {
      const result = BookFormSchema.safeParse({
        title: 'A'.repeat(501),
        author: 'Author',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('author validation', () => {
    it('requires author', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: '',
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from author', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: '  Author Name  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe('Author Name');
      }
    });

    it('rejects author over 200 characters', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'A'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ISBN validation', () => {
    it('accepts valid ISBN-10', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '0123456789',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid ISBN-13', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '9780123456789',
      });
      expect(result.success).toBe(true);
    });

    it('accepts ISBN with dashes', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '978-0-12-345678-9',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn).toBe('9780123456789');
      }
    });

    it('accepts ISBN-10 with X check digit', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '012345678X',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty ISBN', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '',
      });
      expect(result.success).toBe(true);
    });

    it('accepts undefined ISBN', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid ISBN length', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '12345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('coverImageUrl validation', () => {
    it('accepts valid URL', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        coverImageUrl: 'https://example.com/cover.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty string', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        coverImageUrl: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        coverImageUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('publisher validation', () => {
    it('trims publisher', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        publisher: '  Penguin  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publisher).toBe('Penguin');
      }
    });

    it('converts empty string to undefined', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        publisher: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publisher).toBeUndefined();
      }
    });

    it('rejects publisher over 200 characters', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        publisher: 'P'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('pageCount validation', () => {
    it('accepts valid page count', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: 300,
      });
      expect(result.success).toBe(true);
    });

    it('accepts null page count', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects page count less than 1', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects page count over 50000', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: 50001,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer page count', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: 123.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('rating validation', () => {
    it('accepts rating between 0 and 5', () => {
      [0, 1, 2, 3, 4, 5].forEach((rating) => {
        const result = BookFormSchema.safeParse({
          title: 'Title',
          author: 'Author',
          rating,
        });
        expect(result.success).toBe(true);
      });
    });

    it('accepts null rating', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        rating: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects rating below 0', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        rating: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects rating above 5', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        rating: 6,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('seriesPosition validation', () => {
    it('accepts valid series position', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        seriesId: 'series-123',
        seriesPosition: 3,
      });
      expect(result.success).toBe(true);
    });

    it('accepts null series position', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        seriesPosition: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative series position', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        seriesPosition: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('notes validation', () => {
    it('trims notes', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        notes: '  My notes  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('My notes');
      }
    });

    it('converts empty notes to undefined', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        notes: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBeUndefined();
      }
    });

    it('rejects notes over 10000 characters', () => {
      const result = BookFormSchema.safeParse({
        title: 'Title',
        author: 'Author',
        notes: 'N'.repeat(10001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('full book object', () => {
    it('accepts complete book data', () => {
      const result = BookFormSchema.safeParse({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565',
        coverImageUrl: 'https://example.com/cover.jpg',
        publisher: 'Scribner',
        publishedDate: '1925',
        physicalFormat: 'Paperback',
        pageCount: 180,
        rating: 5,
        genres: ['Fiction', 'Classic'],
        seriesId: null,
        seriesPosition: null,
        notes: 'A classic American novel',
        reads: [{ startedAt: '2024-01-01', finishedAt: '2024-01-15' }],
        covers: { googleBooks: 'https://books.google.com/cover.jpg' },
        images: [],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('BookUpdateSchema', () => {
  it('allows partial updates', () => {
    const result = BookUpdateSchema.safeParse({
      title: 'New Title',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty update', () => {
    const result = BookUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates fields that are provided', () => {
    const result = BookUpdateSchema.safeParse({
      rating: 10,
    });
    expect(result.success).toBe(false);
  });
});

describe('QuickAddBookSchema', () => {
  it('accepts minimal required fields', () => {
    const result = QuickAddBookSchema.safeParse({
      title: 'Title',
      author: 'Author',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional ISBN', () => {
    const result = QuickAddBookSchema.safeParse({
      title: 'Title',
      author: 'Author',
      isbn: '9780123456789',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional coverImageUrl', () => {
    const result = QuickAddBookSchema.safeParse({
      title: 'Title',
      author: 'Author',
      coverImageUrl: 'https://example.com/cover.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('requires title', () => {
    const result = QuickAddBookSchema.safeParse({
      author: 'Author',
    });
    expect(result.success).toBe(false);
  });

  it('requires author', () => {
    const result = QuickAddBookSchema.safeParse({
      title: 'Title',
    });
    expect(result.success).toBe(false);
  });
});
