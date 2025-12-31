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
