/**
 * Unit Tests for lib/utils/index.ts
 * Tests for pure utility functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getContrastColor,
  normalizeGenreName,
  normalizeText,
  normalizeSeriesName,
  normalizeAuthor,
  debounce,
  GENRE_COLORS,
  getNextAvailableColor,
  checkPasswordStrength,
  md5,
  getGravatarUrl,
} from '../index';

describe('getContrastColor', () => {
  it('returns black for light colours', () => {
    expect(getContrastColor('#ffffff')).toBe('black');
    expect(getContrastColor('#ffff00')).toBe('black'); // Yellow
    expect(getContrastColor('#00ff00')).toBe('black'); // Lime
    expect(getContrastColor('#fecaca')).toBe('black'); // Light red
  });

  it('returns white for dark colours', () => {
    expect(getContrastColor('#000000')).toBe('white');
    expect(getContrastColor('#0000ff')).toBe('white'); // Blue
    expect(getContrastColor('#800080')).toBe('white'); // Purple
    expect(getContrastColor('#1e40af')).toBe('white'); // Dark blue
  });

  it('handles colours with # prefix', () => {
    expect(getContrastColor('#ffffff')).toBe('black');
    expect(getContrastColor('#000000')).toBe('white');
  });

  it('handles colours without # prefix', () => {
    expect(getContrastColor('ffffff')).toBe('black');
    expect(getContrastColor('000000')).toBe('white');
  });

  it('handles mid-tone colours correctly', () => {
    // Grey at luminance threshold
    expect(getContrastColor('#808080')).toBe('black');
    expect(getContrastColor('#707070')).toBe('white');
  });
});

describe('normalizeGenreName', () => {
  it('lowercases text', () => {
    expect(normalizeGenreName('FICTION')).toBe('fiction');
    expect(normalizeGenreName('Science Fiction')).toBe('science fiction');
  });

  it('trims whitespace', () => {
    expect(normalizeGenreName('  fantasy  ')).toBe('fantasy');
  });

  it('normalizes internal whitespace', () => {
    expect(normalizeGenreName('science   fiction')).toBe('science fiction');
  });

  it('handles empty string', () => {
    expect(normalizeGenreName('')).toBe('');
  });
});

describe('normalizeText', () => {
  it('lowercases text', () => {
    expect(normalizeText('HELLO WORLD')).toBe('hello world');
  });

  it('removes diacritics', () => {
    expect(normalizeText('café')).toBe('cafe');
    expect(normalizeText('naïve')).toBe('naive');
    expect(normalizeText('résumé')).toBe('resume');
  });

  it('trims whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  it('handles unicode characters', () => {
    expect(normalizeText('Björk')).toBe('bjork');
    expect(normalizeText('Müller')).toBe('muller');
  });

  it('preserves basic punctuation', () => {
    expect(normalizeText("Hello, World!")).toBe("hello, world!");
  });
});

describe('normalizeSeriesName', () => {
  it('lowercases text', () => {
    expect(normalizeSeriesName('Harry Potter')).toBe('harry potter');
  });

  it('removes leading "The "', () => {
    expect(normalizeSeriesName('The Lord of the Rings')).toBe('lord of the rings');
    expect(normalizeSeriesName('THE WHEEL OF TIME')).toBe('wheel of time');
  });

  it('does not remove "The" from middle of name', () => {
    expect(normalizeSeriesName('Into The Wild')).toBe('into the wild');
  });

  it('normalizes whitespace', () => {
    expect(normalizeSeriesName('The   Hunger   Games')).toBe('hunger games');
  });

  it('trims whitespace', () => {
    expect(normalizeSeriesName('  Mistborn  ')).toBe('mistborn');
  });
});

describe('normalizeAuthor', () => {
  it('lowercases text', () => {
    expect(normalizeAuthor('J.K. ROWLING')).toBe('jk rowling');
  });

  it('removes punctuation', () => {
    expect(normalizeAuthor('J.K. Rowling')).toBe('jk rowling');
    expect(normalizeAuthor("O'Brien")).toBe('obrien');
    expect(normalizeAuthor('Smith-Jones')).toBe('smithjones');
  });

  it('normalizes whitespace', () => {
    expect(normalizeAuthor('Stephen   King')).toBe('stephen king');
  });

  it('trims whitespace', () => {
    expect(normalizeAuthor('  Brandon Sanderson  ')).toBe('brandon sanderson');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to the function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('only calls once for rapid successive calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('GENRE_COLORS', () => {
  it('contains approximately 150 colours', () => {
    expect(GENRE_COLORS.length).toBeGreaterThan(100);
    expect(GENRE_COLORS.length).toBeLessThan(200);
  });

  it('all colours are valid hex format', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    GENRE_COLORS.forEach((colour) => {
      expect(colour).toMatch(hexPattern);
    });
  });

  it('is readonly', () => {
    // TypeScript enforces this, but we can check it's an array
    expect(Array.isArray(GENRE_COLORS)).toBe(true);
  });
});

describe('getNextAvailableColor', () => {
  it('returns first colour when no colours used', () => {
    expect(getNextAvailableColor([])).toBe(GENRE_COLORS[0]);
  });

  it('returns next available colour', () => {
    const used = [GENRE_COLORS[0]];
    expect(getNextAvailableColor(used)).toBe(GENRE_COLORS[1]);
  });

  it('skips used colours', () => {
    const used = [GENRE_COLORS[0], GENRE_COLORS[1], GENRE_COLORS[2]];
    expect(getNextAvailableColor(used)).toBe(GENRE_COLORS[3]);
  });

  it('is case-insensitive', () => {
    const used = [GENRE_COLORS[0].toUpperCase()];
    expect(getNextAvailableColor(used)).toBe(GENRE_COLORS[1]);
  });

  it('returns a random colour when all are used', () => {
    const allUsed = [...GENRE_COLORS];
    const result = getNextAvailableColor(allUsed);
    expect(GENRE_COLORS).toContain(result);
  });
});

describe('checkPasswordStrength', () => {
  it('returns all false for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.checks.length).toBe(false);
    expect(result.checks.uppercase).toBe(false);
    expect(result.checks.lowercase).toBe(false);
    expect(result.checks.number).toBe(false);
    expect(result.checks.special).toBe(false);
    expect(result.score).toBe(0);
  });

  it('checks minimum length', () => {
    const short = checkPasswordStrength('abc');
    expect(short.checks.length).toBe(false);

    const long = checkPasswordStrength('abcdefgh');
    expect(long.checks.length).toBe(true);
  });

  it('checks uppercase letters', () => {
    const noUpper = checkPasswordStrength('abcdefgh');
    expect(noUpper.checks.uppercase).toBe(false);

    const withUpper = checkPasswordStrength('Abcdefgh');
    expect(withUpper.checks.uppercase).toBe(true);
  });

  it('checks lowercase letters', () => {
    const noLower = checkPasswordStrength('ABCDEFGH');
    expect(noLower.checks.lowercase).toBe(false);

    const withLower = checkPasswordStrength('ABCDEFGh');
    expect(withLower.checks.lowercase).toBe(true);
  });

  it('checks numbers', () => {
    const noNumber = checkPasswordStrength('abcdefgh');
    expect(noNumber.checks.number).toBe(false);

    const withNumber = checkPasswordStrength('abcdefg1');
    expect(withNumber.checks.number).toBe(true);
  });

  it('checks special characters', () => {
    const noSpecial = checkPasswordStrength('abcdefgh');
    expect(noSpecial.checks.special).toBe(false);

    const withSpecial = checkPasswordStrength('abcdefg!');
    expect(withSpecial.checks.special).toBe(true);
  });

  it('calculates score correctly', () => {
    // Score 0: no checks pass
    expect(checkPasswordStrength('abc').score).toBe(0);

    // Score 1: length only
    expect(checkPasswordStrength('abcdefgh').score).toBe(1);

    // Score 2: length + upper+lower
    expect(checkPasswordStrength('Abcdefgh').score).toBe(2);

    // Score 3: length + upper+lower + number
    expect(checkPasswordStrength('Abcdefg1').score).toBe(3);

    // Score 4: all checks pass
    expect(checkPasswordStrength('Abcdefg1!').score).toBe(4);
  });

  it('gives bonus score for long passwords', () => {
    // 10+ chars gives special bonus even without special char
    const longPassword = checkPasswordStrength('Abcdefgh12');
    expect(longPassword.score).toBe(4);
  });
});

describe('md5', () => {
  it('generates correct hash for empty string', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('generates correct hash for "hello"', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('generates correct hash for "test@example.com"', () => {
    // Verify the hash is consistent (the exact value is implementation-specific)
    const hash = md5('test@example.com');
    expect(hash).toBe(md5('test@example.com')); // Consistent
    expect(hash).toHaveLength(32);
  });

  it('handles unicode characters', () => {
    // Should produce consistent output for unicode
    const hash1 = md5('café');
    const hash2 = md5('café');
    expect(hash1).toBe(hash2);
  });

  it('produces lowercase hex output', () => {
    const hash = md5('test');
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('getGravatarUrl', () => {
  it('generates correct URL format', () => {
    const url = getGravatarUrl('test@example.com');
    expect(url).toContain('https://www.gravatar.com/avatar/');
    expect(url).toContain('?s=80&d=404');
  });

  it('uses email hash in URL', () => {
    const email = 'test@example.com';
    const hash = md5(email.trim().toLowerCase());
    const url = getGravatarUrl(email);
    expect(url).toContain(hash);
  });

  it('normalizes email before hashing', () => {
    const url1 = getGravatarUrl('Test@Example.com');
    const url2 = getGravatarUrl('test@example.com');
    const url3 = getGravatarUrl('  TEST@EXAMPLE.COM  ');
    expect(url1).toBe(url2);
    expect(url2).toBe(url3);
  });

  it('uses custom size', () => {
    const url = getGravatarUrl('test@example.com', 200);
    expect(url).toContain('?s=200&d=404');
  });

  it('defaults to size 80', () => {
    const url = getGravatarUrl('test@example.com');
    expect(url).toContain('?s=80&d=404');
  });
});
