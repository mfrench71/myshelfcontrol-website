/**
 * Unit Tests for lib/schemas/wishlist.ts
 * Tests for wishlist form validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  WishlistItemSchema,
  WishlistUpdateSchema,
  QuickAddWishlistSchema,
  WishlistPrioritySchema,
} from '../wishlist';

describe('WishlistPrioritySchema', () => {
  it('accepts high priority', () => {
    const result = WishlistPrioritySchema.safeParse('high');
    expect(result.success).toBe(true);
  });

  it('accepts medium priority', () => {
    const result = WishlistPrioritySchema.safeParse('medium');
    expect(result.success).toBe(true);
  });

  it('accepts low priority', () => {
    const result = WishlistPrioritySchema.safeParse('low');
    expect(result.success).toBe(true);
  });

  it('accepts null priority', () => {
    const result = WishlistPrioritySchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it('rejects invalid priority', () => {
    const result = WishlistPrioritySchema.safeParse('urgent');
    expect(result.success).toBe(false);
  });
});

describe('WishlistItemSchema', () => {
  describe('title validation', () => {
    it('accepts valid title', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Book Title',
        author: 'Author Name',
      });
      expect(result.success).toBe(true);
    });

    it('requires title', () => {
      const result = WishlistItemSchema.safeParse({
        title: '',
        author: 'Author',
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from title', () => {
      const result = WishlistItemSchema.safeParse({
        title: '  The Great Gatsby  ',
        author: 'Author',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('The Great Gatsby');
      }
    });

    it('rejects title over 500 characters', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'A'.repeat(501),
        author: 'Author',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('author validation', () => {
    it('requires author', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: '',
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from author', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: '  Author Name  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe('Author Name');
      }
    });

    it('rejects author over 200 characters', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'A'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ISBN validation', () => {
    it('accepts valid ISBN-10', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '0123456789',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid ISBN-13', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '9780123456789',
      });
      expect(result.success).toBe(true);
    });

    it('strips dashes from ISBN', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '978-0-12-345678-9',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn).toBe('9780123456789');
      }
    });

    it('accepts null ISBN', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: null,
      });
      expect(result.success).toBe(true);
    });

    it('converts empty ISBN to null', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn).toBe(null);
      }
    });

    it('accepts ISBN-10 with X check digit', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '012345678X',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid ISBN length', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        isbn: '12345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('coverImageUrl validation', () => {
    it('accepts valid URL', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        coverImageUrl: 'https://example.com/cover.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('accepts null cover URL', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        coverImageUrl: null,
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty string', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        coverImageUrl: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        coverImageUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('publisher validation', () => {
    it('trims publisher', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        publisher: '  Penguin  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publisher).toBe('Penguin');
      }
    });

    it('converts empty publisher to null', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        publisher: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publisher).toBe(null);
      }
    });

    it('accepts null publisher', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        publisher: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects publisher over 200 characters', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        publisher: 'P'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('pageCount validation', () => {
    it('accepts valid page count', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: 300,
      });
      expect(result.success).toBe(true);
    });

    it('accepts null page count', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects page count less than 1', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects page count over 50000', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        pageCount: 50001,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('priority validation', () => {
    it('accepts valid priority', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        priority: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('accepts null priority', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        priority: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('notes validation', () => {
    it('trims notes', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        notes: '  My notes  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('My notes');
      }
    });

    it('converts empty notes to null', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        notes: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe(null);
      }
    });

    it('rejects notes over 5000 characters', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'Title',
        author: 'Author',
        notes: 'N'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('full wishlist item', () => {
    it('accepts complete wishlist item data', () => {
      const result = WishlistItemSchema.safeParse({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565',
        coverImageUrl: 'https://example.com/cover.jpg',
        covers: { googleBooks: 'https://books.google.com/cover.jpg' },
        publisher: 'Scribner',
        publishedDate: '1925',
        pageCount: 180,
        priority: 'high',
        notes: 'Classic American literature',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('WishlistUpdateSchema', () => {
  it('allows partial updates', () => {
    const result = WishlistUpdateSchema.safeParse({
      priority: 'medium',
    });
    expect(result.success).toBe(true);
  });

  it('allows updating just notes', () => {
    const result = WishlistUpdateSchema.safeParse({
      notes: 'Updated notes',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty update', () => {
    const result = WishlistUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates fields that are provided', () => {
    const result = WishlistUpdateSchema.safeParse({
      pageCount: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe('QuickAddWishlistSchema', () => {
  it('accepts minimal required fields', () => {
    const result = QuickAddWishlistSchema.safeParse({
      title: 'Title',
      author: 'Author',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional ISBN', () => {
    const result = QuickAddWishlistSchema.safeParse({
      title: 'Title',
      author: 'Author',
      isbn: '9780123456789',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional coverImageUrl', () => {
    const result = QuickAddWishlistSchema.safeParse({
      title: 'Title',
      author: 'Author',
      coverImageUrl: 'https://example.com/cover.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional priority', () => {
    const result = QuickAddWishlistSchema.safeParse({
      title: 'Title',
      author: 'Author',
      priority: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('requires title', () => {
    const result = QuickAddWishlistSchema.safeParse({
      author: 'Author',
    });
    expect(result.success).toBe(false);
  });

  it('requires author', () => {
    const result = QuickAddWishlistSchema.safeParse({
      title: 'Title',
    });
    expect(result.success).toBe(false);
  });

  it('trims title and author', () => {
    const result = QuickAddWishlistSchema.safeParse({
      title: '  Title  ',
      author: '  Author  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Title');
      expect(result.data.author).toBe('Author');
    }
  });
});
