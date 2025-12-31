/**
 * Utility Functions
 * Common helpers used across the application
 */

/**
 * Calculate contrast color (black or white) for a background color
 * @param hexColor - Hex color code (e.g., "#ff0000")
 * @returns "black" or "white" for optimal contrast
 */
export function getContrastColor(hexColor: string): 'black' | 'white' {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance using sRGB
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Normalize genre name for comparison
 * Lowercases and removes extra whitespace
 */
export function normalizeGenreName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Normalize text for search/comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Predefined colour palette for genres (~150 colours) - rainbow order
 * Expanded with Tailwind 200-800 shades for extensive genre lists
 */
export const GENRE_COLORS: readonly string[] = [
  // Reds
  '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
  // Roses
  '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c',
  // Oranges
  '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412',
  // Ambers
  '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309',
  // Yellows
  '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04',
  // Limes
  '#d9f99d', '#bef264', '#a3e635', '#84cc16', '#65a30d', '#4d7c0f',
  // Greens
  '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534',
  // Emeralds
  '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857',
  // Teals
  '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e',
  // Cyans
  '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490',
  // Skys
  '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1',
  // Blues
  '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
  // Indigos
  '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca',
  // Violets
  '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9',
  // Purples
  '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce',
  // Fuchsias
  '#f5d0fe', '#f0abfc', '#e879f9', '#d946ef', '#c026d3', '#a21caf',
  // Pinks
  '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d',
  // Grays
  '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151',
];

/**
 * Get an available color for a new genre
 * @param usedColors - Array of colors already in use
 * @returns First available color from palette, or random if all used
 */
export function getNextAvailableColor(usedColors: string[]): string {
  const usedSet = new Set(usedColors.map((c) => c.toLowerCase()));
  const available = GENRE_COLORS.find((c) => !usedSet.has(c.toLowerCase()));
  return available || GENRE_COLORS[Math.floor(Math.random() * GENRE_COLORS.length)];
}

/**
 * Normalize series name for comparison
 * Lowercases, removes "the" prefix, and normalizes whitespace
 */
export function normalizeSeriesName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^the\s+/i, '') // Remove leading "The "
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Normalize author name for comparison
 * Lowercases, removes punctuation, and normalizes whitespace
 */
export function normalizeAuthor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,\-']/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Password strength check results
 */
export interface PasswordStrengthChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export interface PasswordStrengthResult {
  checks: PasswordStrengthChecks;
  score: number; // 0-4
}

/**
 * Check password strength
 * Returns checks for individual requirements and overall score (0-4)
 * @param password - Password to evaluate
 * @returns Object with checks and score
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const checks: PasswordStrengthChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  let score = 0;
  if (checks.length) score++;
  if (checks.uppercase && checks.lowercase) score++;
  if (checks.number) score++;
  if (checks.special || password.length >= 10) score++;

  return { checks, score };
}

/**
 * MD5 hash implementation for Gravatar
 * @param string - String to hash
 * @returns MD5 hash as hex string
 */
export function md5(string: string): string {
  function rotateLeft(val: number, shift: number): number {
    return (val << shift) | (val >>> (32 - shift));
  }
  function addUnsigned(x: number, y: number): number {
    const x4 = x & 0x40000000,
      y4 = y & 0x40000000;
    const x8 = x & 0x80000000,
      y8 = y & 0x80000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
    if (x4 | y4) {
      if (result & 0x40000000) return result ^ 0xc0000000 ^ x8 ^ y8;
      return result ^ 0x40000000 ^ x8 ^ y8;
    }
    return result ^ x8 ^ y8;
  }
  function F(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }
  function G(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }
  function H(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }
  function I(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac)), s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac)), s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac)), s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac)), s), b);
  }
  function convertToWordArray(str: string): number[] {
    const len = str.length,
      words: number[] = [];
    for (let i = 0; i < len; i += 4) {
      words.push(
        str.charCodeAt(i) | (str.charCodeAt(i + 1) << 8) | (str.charCodeAt(i + 2) << 16) | (str.charCodeAt(i + 3) << 24)
      );
    }
    return words;
  }
  function wordToHex(val: number): string {
    let hex = '',
      temp: number;
    for (let i = 0; i <= 3; i++) {
      temp = (val >>> (i * 8)) & 255;
      hex += ('0' + temp.toString(16)).slice(-2);
    }
    return hex;
  }
  function utf8Encode(str: string): string {
    return unescape(encodeURIComponent(str));
  }

  let x: number[] = [],
    k: number,
    AA: number,
    BB: number,
    CC: number,
    DD: number,
    a: number,
    b: number,
    c: number,
    d: number;
  const S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22,
    S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  const S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23,
    S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;
  string = utf8Encode(string);
  const len = string.length;
  string += String.fromCharCode(0x80);
  while (string.length % 64 !== 56) string += String.fromCharCode(0);
  string += String.fromCharCode(
    (len * 8) & 0xff,
    ((len * 8) >>> 8) & 0xff,
    ((len * 8) >>> 16) & 0xff,
    ((len * 8) >>> 24) & 0xff,
    0,
    0,
    0,
    0
  );
  x = convertToWordArray(string);
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;
  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = FF(a, b, c, d, x[k], S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k], S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = II(a, b, c, d, x[k], S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

/**
 * Get Gravatar URL for an email address
 * @param email - Email address to get avatar for
 * @param size - Size in pixels (default 80)
 * @returns Gravatar URL with d=404 (returns 404 if no avatar)
 */
export function getGravatarUrl(email: string, size = 80): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}
