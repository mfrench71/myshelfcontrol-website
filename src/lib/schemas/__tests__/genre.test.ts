/**
 * Unit Tests for lib/schemas/genre.ts
 * Tests for genre form validation schemas
 */
import { describe, it, expect } from 'vitest';
import { GenreFormSchema, GenreUpdateSchema } from '../genre';

describe('GenreFormSchema', () => {
  describe('name validation', () => {
    it('accepts valid name', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
      });
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const result = GenreFormSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from name', () => {
      const result = GenreFormSchema.safeParse({
        name: '  Science Fiction  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Science Fiction');
      }
    });

    it('rejects name over 50 characters', () => {
      const result = GenreFormSchema.safeParse({
        name: 'A'.repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it('accepts name exactly 50 characters', () => {
      const result = GenreFormSchema.safeParse({
        name: 'A'.repeat(50),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('color validation', () => {
    it('accepts valid hex colour', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
        color: '#FF5733',
      });
      expect(result.success).toBe(true);
    });

    it('accepts lowercase hex colour', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
        color: '#ff5733',
      });
      expect(result.success).toBe(true);
    });

    it('accepts mixed case hex colour', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
        color: '#Ff5733',
      });
      expect(result.success).toBe(true);
    });

    it('allows optional colour', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
      });
      expect(result.success).toBe(true);
    });

    it('rejects 3-digit hex colour', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
        color: '#F53',
      });
      expect(result.success).toBe(false);
    });

    it('rejects colour without hash', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
        color: 'FF5733',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid hex characters', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
        color: '#GGGGGG',
      });
      expect(result.success).toBe(false);
    });

    it('rejects colour names', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
        color: 'red',
      });
      expect(result.success).toBe(false);
    });

    it('rejects RGB format', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Fiction',
        color: 'rgb(255, 87, 51)',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('full genre object', () => {
    it('accepts complete genre data', () => {
      const result = GenreFormSchema.safeParse({
        name: 'Science Fiction',
        color: '#3498DB',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Science Fiction');
        expect(result.data.color).toBe('#3498DB');
      }
    });
  });
});

describe('GenreUpdateSchema', () => {
  it('allows partial updates', () => {
    const result = GenreUpdateSchema.safeParse({
      color: '#FF0000',
    });
    expect(result.success).toBe(true);
  });

  it('allows updating just name', () => {
    const result = GenreUpdateSchema.safeParse({
      name: 'Updated Genre',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty update', () => {
    const result = GenreUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates fields that are provided', () => {
    const result = GenreUpdateSchema.safeParse({
      color: 'invalid-color',
    });
    expect(result.success).toBe(false);
  });
});
