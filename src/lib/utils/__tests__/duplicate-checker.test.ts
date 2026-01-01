/**
 * Unit Tests for lib/utils/duplicate-checker.ts
 * Tests for ISBN validation and cleaning functions
 */
import { describe, it, expect, vi } from 'vitest';

// Mock Firebase before importing the module
vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
}));

import { isISBN, cleanISBN, DUPLICATE_CHECK_LIMIT } from '../duplicate-checker';

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
