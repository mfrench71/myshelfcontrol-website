/**
 * Duplicate Checker Utilities
 * ISBN validation and duplicate book detection
 */

import { db } from '@/lib/firebase/client';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';

/** Book data for duplicate checking */
interface BookData {
  id?: string;
  isbn?: string;
  title?: string;
  author?: string;
  [key: string]: unknown;
}

/** Match type for duplicates */
type MatchType = 'isbn' | 'title-author' | null;

/** Duplicate check result */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType: MatchType;
  existingBook: BookData | null;
}

// Max books to check for title/author duplicates
export const DUPLICATE_CHECK_LIMIT = 200;

/**
 * Normalize text for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if a string looks like an ISBN (10 or 13 digits, with optional dashes/spaces)
 * Also handles common formats like "ISBN: 978-0-123456-78-9" or "ISBN-13: 9780123456789"
 */
export function isISBN(input: string | undefined | null): boolean {
  if (!input) return false;
  // Remove ISBN prefix, dashes, spaces, and colons
  const cleaned = input.replace(/^isbn[-:\s]*(10|13)?[-:\s]*/i, '').replace(/[-\s]/g, '');
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
}

/**
 * Clean an ISBN string by removing prefix, dashes, spaces
 */
export function cleanISBN(input: string | undefined | null): string {
  if (!input) return '';
  return input.replace(/^isbn[-:\s]*(10|13)?[-:\s]*/i, '').replace(/[-\s]/g, '');
}

/**
 * Check if a book with the same ISBN or title/author already exists
 */
export async function checkForDuplicate(
  userId: string,
  isbn: string | undefined | null,
  title: string,
  author: string
): Promise<DuplicateCheckResult> {
  const booksRef = collection(db, 'users', userId, 'books');

  // Check by ISBN first (most reliable - uses indexed query)
  if (isbn) {
    const isbnQuery = query(booksRef, where('isbn', '==', isbn), limit(1));
    const isbnSnapshot = await getDocs(isbnQuery);
    if (!isbnSnapshot.empty) {
      const existingBook: BookData = {
        id: isbnSnapshot.docs[0].id,
        ...isbnSnapshot.docs[0].data(),
      };
      return { isDuplicate: true, matchType: 'isbn', existingBook };
    }
  }

  // Check by normalized title + author (limited to prevent excessive reads)
  const normalizedTitle = normalizeText(title);
  const normalizedAuthor = normalizeText(author);

  // Fetch limited books and check client-side (Firestore doesn't support case-insensitive queries)
  const limitedQuery = query(booksRef, limit(DUPLICATE_CHECK_LIMIT));
  const booksSnapshot = await getDocs(limitedQuery);

  for (const doc of booksSnapshot.docs) {
    const bookData = doc.data() as BookData;
    const bookNormalizedTitle = normalizeText(bookData.title || '');
    const bookNormalizedAuthor = normalizeText(bookData.author || '');

    if (bookNormalizedTitle === normalizedTitle && bookNormalizedAuthor === normalizedAuthor) {
      return {
        isDuplicate: true,
        matchType: 'title-author',
        existingBook: { id: doc.id, ...bookData },
      };
    }
  }

  return { isDuplicate: false, matchType: null, existingBook: null };
}
