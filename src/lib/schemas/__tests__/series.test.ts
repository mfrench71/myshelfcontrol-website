/**
 * Unit Tests for lib/schemas/series.ts
 * Tests for series form validation schemas
 */
import { describe, it, expect } from 'vitest';
import { SeriesFormSchema, SeriesUpdateSchema, ExpectedBookSchema } from '../series';

describe('ExpectedBookSchema', () => {
  it('accepts valid expected book', () => {
    const result = ExpectedBookSchema.safeParse({
      title: 'The Fellowship of the Ring',
      isbn: '9780261103573',
      position: 1,
      source: 'api',
    });
    expect(result.success).toBe(true);
  });

  it('requires title', () => {
    const result = ExpectedBookSchema.safeParse({
      position: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = ExpectedBookSchema.safeParse({
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null ISBN', () => {
    const result = ExpectedBookSchema.safeParse({
      title: 'Book Title',
      isbn: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null position', () => {
    const result = ExpectedBookSchema.safeParse({
      title: 'Book Title',
      position: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts api source', () => {
    const result = ExpectedBookSchema.safeParse({
      title: 'Book Title',
      source: 'api',
    });
    expect(result.success).toBe(true);
  });

  it('accepts manual source', () => {
    const result = ExpectedBookSchema.safeParse({
      title: 'Book Title',
      source: 'manual',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid source', () => {
    const result = ExpectedBookSchema.safeParse({
      title: 'Book Title',
      source: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});

describe('SeriesFormSchema', () => {
  describe('name validation', () => {
    it('accepts valid name', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'The Lord of the Rings',
      });
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const result = SeriesFormSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from name', () => {
      const result = SeriesFormSchema.safeParse({
        name: '  Harry Potter  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Harry Potter');
      }
    });

    it('rejects name over 200 characters', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'A'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('accepts name exactly 200 characters', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'A'.repeat(200),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('description validation', () => {
    it('accepts valid description', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        description: 'A great fantasy series.',
      });
      expect(result.success).toBe(true);
    });

    it('trims whitespace from description', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        description: '  Description text  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Description text');
      }
    });

    it('converts empty description to null', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        description: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it('accepts null description', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        description: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects description over 2000 characters', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        description: 'D'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('totalBooks validation', () => {
    it('accepts valid total books', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        totalBooks: 7,
      });
      expect(result.success).toBe(true);
    });

    it('accepts null total books', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        totalBooks: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects total books less than 1', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        totalBooks: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects total books over 1000', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        totalBooks: 1001,
      });
      expect(result.success).toBe(false);
    });

    it('accepts total books exactly 1000', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        totalBooks: 1000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-integer total books', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        totalBooks: 5.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('expectedBooks validation', () => {
    it('accepts valid expected books array', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        expectedBooks: [
          { title: 'Book 1', position: 1 },
          { title: 'Book 2', position: 2 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty expected books array', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        expectedBooks: [],
      });
      expect(result.success).toBe(true);
    });

    it('validates each expected book', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Series Name',
        expectedBooks: [
          { title: 'Valid Book' },
          { title: '' }, // Invalid - empty title
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('full series object', () => {
    it('accepts complete series data', () => {
      const result = SeriesFormSchema.safeParse({
        name: 'Harry Potter',
        description: 'A fantasy series about a young wizard.',
        totalBooks: 7,
        expectedBooks: [
          { title: "Harry Potter and the Philosopher's Stone", position: 1, source: 'manual' },
          { title: 'Harry Potter and the Chamber of Secrets', position: 2, source: 'manual' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('SeriesUpdateSchema', () => {
  it('allows partial updates', () => {
    const result = SeriesUpdateSchema.safeParse({
      totalBooks: 8,
    });
    expect(result.success).toBe(true);
  });

  it('allows updating just name', () => {
    const result = SeriesUpdateSchema.safeParse({
      name: 'Updated Series Name',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty update', () => {
    const result = SeriesUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates fields that are provided', () => {
    const result = SeriesUpdateSchema.safeParse({
      totalBooks: 0,
    });
    expect(result.success).toBe(false);
  });

  it('allows updating description to null', () => {
    const result = SeriesUpdateSchema.safeParse({
      description: null,
    });
    expect(result.success).toBe(true);
  });
});
