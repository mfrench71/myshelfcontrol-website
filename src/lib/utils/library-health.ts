/**
 * Library Health Analysis Utilities
 * Analyzes book library for missing/incomplete data
 */

import type { Book } from '@/lib/types';

/** Health field configuration */
type HealthFieldConfig = {
  weight: number;
  label: string;
  icon: string;
};

/** Health fields configuration map */
export const HEALTH_FIELDS: Record<string, HealthFieldConfig> = {
  coverImageUrl: { weight: 2, label: 'Cover', icon: 'image' },
  genres: { weight: 2, label: 'Genres', icon: 'tags' },
  pageCount: { weight: 1, label: 'Pages', icon: 'hash' },
  physicalFormat: { weight: 1, label: 'Format', icon: 'book-open' },
  publisher: { weight: 1, label: 'Publisher', icon: 'building' },
  publishedDate: { weight: 1, label: 'Date', icon: 'calendar' },
  isbn: { weight: 0, label: 'ISBN', icon: 'barcode' }, // Not counted in score, but tracked
};

/** Issue type keys */
export type IssueType =
  | 'missingCover'
  | 'missingGenres'
  | 'missingPageCount'
  | 'missingFormat'
  | 'missingPublisher'
  | 'missingPublishedDate'
  | 'missingIsbn';

/** Library health issues */
export type HealthIssues = Record<IssueType, Book[]>;

/** Library health report */
export type HealthReport = {
  totalBooks: number;
  completenessScore: number;
  totalIssues: number;
  fixableBooks: number;
  issues: HealthIssues;
};

/** Completeness rating */
export type CompletenessRating = {
  label: string;
  colour: 'green' | 'amber' | 'red';
};

/** Issue configuration for display */
export const ISSUE_CONFIG: Record<IssueType, { icon: string; label: string }> = {
  missingCover: { icon: 'image', label: 'Cover' },
  missingGenres: { icon: 'tags', label: 'Genres' },
  missingPageCount: { icon: 'hash', label: 'Pages' },
  missingFormat: { icon: 'book-open', label: 'Format' },
  missingPublisher: { icon: 'building', label: 'Publisher' },
  missingPublishedDate: { icon: 'calendar', label: 'Date' },
  missingIsbn: { icon: 'barcode', label: 'ISBN' },
};

/**
 * Check if a book field has a value
 */
export function hasFieldValue(book: Book, field: string): boolean {
  if (field === 'genres') {
    return Array.isArray(book.genres) && book.genres.length > 0;
  }
  return !!(book as Record<string, unknown>)[field];
}

/**
 * Get list of missing fields for a book
 */
export function getMissingFields(book: Book): string[] {
  const missing: string[] = [];
  for (const field of Object.keys(HEALTH_FIELDS)) {
    if (!hasFieldValue(book, field)) {
      missing.push(field);
    }
  }
  return missing;
}

/**
 * Calculate completeness score for a single book (0-100%)
 */
export function calculateBookCompleteness(book: Book): number {
  let score = 0;
  let totalWeight = 0;

  for (const [field, config] of Object.entries(HEALTH_FIELDS)) {
    if (config.weight > 0) {
      totalWeight += config.weight;
      if (hasFieldValue(book, field)) {
        score += config.weight;
      }
    }
  }

  if (totalWeight === 0) return 100;
  return Math.round((score / totalWeight) * 100);
}

/**
 * Calculate overall library completeness (0-100%)
 */
export function calculateLibraryCompleteness(books: Book[]): number {
  if (!books || books.length === 0) return 100;

  let totalScore = 0;
  let hasIncompleteBook = false;

  for (const book of books) {
    const bookScore = calculateBookCompleteness(book);
    totalScore += bookScore;
    if (bookScore < 100) {
      hasIncompleteBook = true;
    }
  }

  const score = Math.round(totalScore / books.length);

  // Cap at 99% if any book has missing fields
  if (hasIncompleteBook && score === 100) {
    return 99;
  }

  return score;
}

/**
 * Analyze library for missing data
 */
export function analyzeLibraryHealth(books: Book[]): HealthReport {
  const activeBooks = books.filter((b) => !b.deletedAt);

  const issues: HealthIssues = {
    missingCover: [],
    missingGenres: [],
    missingPageCount: [],
    missingFormat: [],
    missingPublisher: [],
    missingPublishedDate: [],
    missingIsbn: [],
  };

  for (const book of activeBooks) {
    if (!hasFieldValue(book, 'coverImageUrl')) issues.missingCover.push(book);
    if (!hasFieldValue(book, 'genres')) issues.missingGenres.push(book);
    if (!hasFieldValue(book, 'pageCount')) issues.missingPageCount.push(book);
    if (!hasFieldValue(book, 'physicalFormat')) issues.missingFormat.push(book);
    if (!hasFieldValue(book, 'publisher')) issues.missingPublisher.push(book);
    if (!hasFieldValue(book, 'publishedDate')) issues.missingPublishedDate.push(book);
    if (!hasFieldValue(book, 'isbn')) issues.missingIsbn.push(book);
  }

  const completenessScore = calculateLibraryCompleteness(activeBooks);

  // Calculate total issues (excluding ISBN since it's not in completeness score)
  const totalIssues =
    issues.missingCover.length +
    issues.missingGenres.length +
    issues.missingPageCount.length +
    issues.missingFormat.length +
    issues.missingPublisher.length +
    issues.missingPublishedDate.length;

  // Books that can be fixed (have ISBN)
  const fixableBooks = activeBooks.filter(
    (b) => b.isbn && getMissingFields(b).some((f) => HEALTH_FIELDS[f]?.weight > 0)
  );

  return {
    totalBooks: activeBooks.length,
    completenessScore,
    totalIssues,
    fixableBooks: fixableBooks.length,
    issues,
  };
}

/**
 * Get completeness rating label
 */
export function getCompletenessRating(score: number): CompletenessRating {
  if (score >= 90) return { label: 'Excellent', colour: 'green' };
  if (score >= 70) return { label: 'Good', colour: 'green' };
  if (score >= 50) return { label: 'Fair', colour: 'amber' };
  return { label: 'Needs Attention', colour: 'red' };
}

/**
 * Get books with issues, grouped by book and sorted by most issues
 */
export function getBooksWithIssues(report: HealthReport): Array<{
  book: Book;
  missing: Array<{ label: string; icon: string }>;
}> {
  const booksMap = new Map<
    string,
    { book: Book; missing: Array<{ label: string; icon: string }> }
  >();

  for (const [issueType, config] of Object.entries(ISSUE_CONFIG)) {
    const issueBooks = report.issues[issueType as IssueType] || [];
    for (const book of issueBooks) {
      if (!booksMap.has(book.id)) {
        booksMap.set(book.id, { book, missing: [] });
      }
      booksMap.get(book.id)!.missing.push({
        label: config.label,
        icon: config.icon,
      });
    }
  }

  // Sort by most issues first
  return [...booksMap.values()].sort((a, b) => b.missing.length - a.missing.length);
}
