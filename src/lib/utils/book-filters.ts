/**
 * Book filtering and sorting utilities
 * Shared logic for filtering and sorting book collections
 */

import type { Book, BookFilters, BookRead } from '@/lib/types';

/**
 * Reading status labels for display
 */
export const STATUS_LABELS: Record<'want-to-read' | 'reading' | 'finished', string> = {
  'want-to-read': 'Not Read',
  'reading': 'Currently Reading',
  'finished': 'Finished',
};

/**
 * Status options for filters (excludes 'Not Read' as it's the default/unread state)
 */
export const STATUS_OPTIONS = [
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Finished' },
] as const;

/**
 * Physical format options for book forms
 */
export const FORMAT_OPTIONS = [
  { value: '', label: 'Select format...' },
  { value: 'Paperback', label: 'Paperback' },
  { value: 'Hardcover', label: 'Hardcover' },
  { value: 'Mass Market Paperback', label: 'Mass Market Paperback' },
  { value: 'Trade Paperback', label: 'Trade Paperback' },
  { value: 'Library Binding', label: 'Library Binding' },
  { value: 'Spiral-bound', label: 'Spiral-bound' },
  { value: 'Audio CD', label: 'Audio CD' },
  { value: 'Ebook', label: 'Ebook' },
] as const;

/**
 * Get the reading status of a book based on its reads array
 */
export function getBookStatus(book: { reads?: BookRead[] }): 'want-to-read' | 'reading' | 'finished' {
  const reads = book.reads || [];
  if (reads.length === 0) return 'want-to-read';

  const latestRead = reads[reads.length - 1];
  if (latestRead.finishedAt) return 'finished';
  if (latestRead.startedAt) return 'reading';

  return 'want-to-read';
}

/**
 * Filter books based on active filters (multi-select for status, genre, series)
 */
export function filterBooks(books: Book[], filters: BookFilters): Book[] {
  return books.filter((book) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = book.title.toLowerCase().includes(searchLower);
      const matchesAuthor = book.author.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesAuthor) return false;
    }

    // Status filter (multi-select: book must match ANY selected status)
    if (filters.statuses && filters.statuses.length > 0) {
      const bookStatus = getBookStatus(book);
      if (!filters.statuses.includes(bookStatus)) return false;
    }

    // Genre filter (multi-select: book must have ANY selected genre)
    if (filters.genreIds && filters.genreIds.length > 0) {
      const bookGenres = book.genres || [];
      const hasMatchingGenre = filters.genreIds.some((genreId) => bookGenres.includes(genreId));
      if (!hasMatchingGenre) return false;
    }

    // Series filter (multi-select: book must be in ANY selected series)
    if (filters.seriesIds && filters.seriesIds.length > 0) {
      if (!book.seriesId || !filters.seriesIds.includes(book.seriesId)) return false;
    }

    // Rating filter
    if (filters.minRating) {
      if (!book.rating || book.rating < filters.minRating) return false;
    }

    // Author filter
    if (filters.author) {
      if (book.author.toLowerCase() !== filters.author.toLowerCase()) return false;
    }

    return true;
  });
}

/**
 * Sort books based on sort options
 */
export function sortBooks(
  books: Book[],
  sortBy: string,
  direction: 'asc' | 'desc'
): Book[] {
  const sorted = [...books].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'author':
        comparison = a.author.localeCompare(b.author);
        break;
      case 'rating':
        // Books without rating go to the end
        if (!a.rating && !b.rating) comparison = 0;
        else if (!a.rating) comparison = 1;
        else if (!b.rating) comparison = -1;
        else comparison = a.rating - b.rating;
        break;
      case 'seriesPosition':
        // Books without position go to the end
        const aPos = a.seriesPosition ?? Number.MAX_SAFE_INTEGER;
        const bPos = b.seriesPosition ?? Number.MAX_SAFE_INTEGER;
        comparison = aPos - bPos;
        break;
      case 'createdAt':
        const aTime = a.createdAt
          ? typeof a.createdAt === 'number'
            ? a.createdAt
            : 'toMillis' in a.createdAt
              ? a.createdAt.toMillis()
              : new Date(a.createdAt as unknown as string).getTime()
          : 0;
        const bTime = b.createdAt
          ? typeof b.createdAt === 'number'
            ? b.createdAt
            : 'toMillis' in b.createdAt
              ? b.createdAt.toMillis()
              : new Date(b.createdAt as unknown as string).getTime()
          : 0;
        comparison = aTime - bTime;
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display (e.g., "1 Jan 2024")
 */
export function formatDate(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
