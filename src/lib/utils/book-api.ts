/**
 * Book API Utilities
 * ISBN lookup and book search via Google Books and Open Library APIs
 */

import type { BookCovers } from '@/lib/types';

/** Book search result */
export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string;
  publisher: string;
  publishedDate: string;
  physicalFormat: string;
  pageCount: number | null;
  genres: string[];
  covers?: BookCovers;
  seriesName?: string;
  seriesPosition?: number | null;
  source?: string;
  isbn?: string;
}

/** ISBN lookup result (alias for backwards compatibility) */
export type ISBNLookupResult = Omit<BookSearchResult, 'id' | 'isbn'>;

/** Google Books API volume info */
interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    large?: string;
    medium?: string;
    small?: string;
    thumbnail?: string;
  };
  industryIdentifiers?: Array<{ identifier: string }>;
}

/** Google Books API item */
interface GoogleBooksItem {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

/** Google Books API response */
interface GoogleBooksResponse {
  items?: GoogleBooksItem[];
  totalItems?: number;
}

/** Open Library jscmd=data book response */
interface OpenLibraryDataBook {
  title?: string;
  authors?: Array<{ name: string }>;
  publishers?: Array<{ name: string }>;
  publish_date?: string;
  number_of_pages?: number;
  subjects?: Array<{ name?: string } | string>;
  cover?: {
    large?: string;
    medium?: string;
  };
}

/** Open Library edition response */
interface OpenLibraryEdition {
  physical_format?: string;
  number_of_pages?: number;
  series?: string | string[];
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: unknown) {
    clearTimeout(id);
    const err = error as Error;
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Normalize title (trim, proper capitalization)
 */
function normalizeTitle(title: string): string {
  if (!title) return '';
  return title.trim();
}

/**
 * Normalize author name
 */
function normalizeAuthor(author: string): string {
  if (!author) return '';
  return author.trim();
}

/**
 * Normalize publisher
 */
function normalizePublisher(publisher: string): string {
  if (!publisher) return '';
  return publisher.trim();
}

/**
 * Normalize published date (extract year or format date)
 */
function normalizePublishedDate(date: string | undefined): string {
  if (!date) return '';
  // Just return trimmed value for now
  return date.trim();
}

/**
 * Parse hierarchical genres from categories
 */
function parseGenres(categories: string[]): string[] {
  if (!categories || categories.length === 0) return [];

  const genres = new Set<string>();

  for (const cat of categories) {
    // Split by " / " for hierarchical categories (e.g., "Fiction / Fantasy")
    const parts = cat.split(' / ').map(p => p.trim());
    // Add the most specific (last) part
    if (parts.length > 0) {
      genres.add(parts[parts.length - 1]);
    }
  }

  return Array.from(genres);
}

/**
 * Parse series information from API response
 */
function parseSeriesFromAPI(series: string | string[]): { name: string; position: number | null } | null {
  if (!series) return null;

  const seriesString = Array.isArray(series) ? series[0] : series;
  if (!seriesString) return null;

  // Try to extract position from series name like "Harry Potter #3" or "Harry Potter (Book 3)"
  const positionMatch = seriesString.match(/[#(]?\s*(?:book\s*)?(\d+)\s*[)]?$/i);
  const position = positionMatch ? parseInt(positionMatch[1], 10) : null;

  // Clean up series name
  const name = seriesString
    .replace(/[#(]?\s*(?:book\s*)?\d+\s*[)]?$/i, '')
    .trim();

  return { name, position };
}

/**
 * Look up book data by ISBN from Google Books and Open Library APIs
 */
export async function lookupISBN(isbn: string | null | undefined): Promise<ISBNLookupResult | null> {
  if (!isbn) return null;

  let result: ISBNLookupResult | null = null;
  let googleBooksCover = '';
  let openLibraryCover = '';

  // Try Google Books first
  try {
    const response = await fetchWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = (await response.json()) as GoogleBooksResponse;

    if (data.items?.length) {
      const book = data.items[0].volumeInfo;
      // Prefer larger cover images
      const imageLinks = book.imageLinks || {};
      googleBooksCover = (
        imageLinks.large ||
        imageLinks.medium ||
        imageLinks.small ||
        imageLinks.thumbnail ||
        ''
      ).replace('http:', 'https:');

      result = {
        title: normalizeTitle(book.title || ''),
        author: normalizeAuthor(book.authors?.join(', ') || ''),
        coverImageUrl: googleBooksCover,
        publisher: normalizePublisher(book.publisher || ''),
        publishedDate: normalizePublishedDate(book.publishedDate),
        physicalFormat: '',
        pageCount: book.pageCount || null,
        genres: parseGenres(book.categories || []),
      };
    }
  } catch (err) {
    console.error('Google Books API error:', err);
  }

  // Try Open Library (as fallback or to supplement missing fields)
  try {
    const response = await fetchWithTimeout(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    const data = (await response.json()) as Record<string, OpenLibraryDataBook>;
    const book = data[`ISBN:${isbn}`];

    if (book) {
      // Parse subjects
      const subjectStrings = (book.subjects || []).map(s =>
        typeof s === 'string' ? s : s.name || ''
      );
      const olGenres = parseGenres(subjectStrings);

      // Prefer large cover, fall back to medium
      openLibraryCover = book.cover?.large || book.cover?.medium || '';

      if (result) {
        // Supplement missing fields from Open Library
        if (!result.publisher) result.publisher = normalizePublisher(book.publishers?.[0]?.name || '');
        if (!result.publishedDate) result.publishedDate = normalizePublishedDate(book.publish_date);
        if (!result.coverImageUrl) result.coverImageUrl = openLibraryCover;
        if (!result.pageCount && book.number_of_pages) result.pageCount = book.number_of_pages;
        // Merge genres
        if (olGenres.length > 0) {
          const existingGenres = new Set(result.genres.map(g => g.toLowerCase()));
          olGenres.forEach(g => {
            if (!existingGenres.has(g.toLowerCase())) {
              result!.genres.push(g);
            }
          });
        }
      } else {
        // Use Open Library as primary source
        result = {
          title: normalizeTitle(book.title || ''),
          author: normalizeAuthor(book.authors?.map(a => a.name).join(', ') || ''),
          coverImageUrl: openLibraryCover,
          publisher: normalizePublisher(book.publishers?.[0]?.name || ''),
          publishedDate: normalizePublishedDate(book.publish_date),
          physicalFormat: '',
          pageCount: book.number_of_pages || null,
          genres: olGenres,
        };
      }
    }
  } catch (err) {
    if (!result) {
      console.warn('Open Library API unavailable:', (err as Error).message);
    }
  }

  // Add covers object with all available sources
  if (result) {
    result.covers = {};
    if (googleBooksCover) result.covers.googleBooks = googleBooksCover;
    if (openLibraryCover) result.covers.openLibrary = openLibraryCover;
  }

  // Try Open Library edition endpoint for physical_format and series
  if (result && (!result.physicalFormat || !result.seriesName)) {
    try {
      const editionResponse = await fetchWithTimeout(`https://openlibrary.org/isbn/${isbn}.json`);
      if (editionResponse.ok) {
        const edition = (await editionResponse.json()) as OpenLibraryEdition;
        if (!result.physicalFormat && edition.physical_format) {
          // Normalize to title case
          result.physicalFormat = edition.physical_format
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        if (!result.pageCount && edition.number_of_pages) {
          result.pageCount = edition.number_of_pages;
        }
        // Extract series information
        if (edition.series) {
          const seriesInfo = parseSeriesFromAPI(edition.series);
          if (seriesInfo) {
            result.seriesName = seriesInfo.name;
            result.seriesPosition = seriesInfo.position;
          }
        }
      }
    } catch {
      // Edition data is supplementary, ignore errors
    }
  }

  return result;
}

/**
 * Search for books by title/author
 * Returns results from Google Books API with unique volume IDs
 */
export async function searchBooks(
  query: string,
  options: { startIndex?: number; maxResults?: number } = {}
): Promise<{ books: BookSearchResult[]; hasMore: boolean; totalItems: number }> {
  const { startIndex = 0, maxResults = 10 } = options;

  try {
    const response = await fetchWithTimeout(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}`
    );
    const data = (await response.json()) as GoogleBooksResponse;

    if (!data.items) {
      return { books: [], hasMore: false, totalItems: 0 };
    }

    const books: BookSearchResult[] = data.items.map(item => {
      const book = item.volumeInfo;
      const imageLinks = book.imageLinks || {};
      const coverUrl = (
        imageLinks.large ||
        imageLinks.medium ||
        imageLinks.small ||
        imageLinks.thumbnail ||
        ''
      ).replace('http:', 'https:');

      // Extract ISBN from industry identifiers
      const isbn = book.industryIdentifiers?.find(
        id => id.identifier.length === 10 || id.identifier.length === 13
      )?.identifier;

      return {
        id: item.id, // Google Books volume ID - guaranteed unique
        title: normalizeTitle(book.title || ''),
        author: normalizeAuthor(book.authors?.join(', ') || ''),
        coverImageUrl: coverUrl,
        publisher: normalizePublisher(book.publisher || ''),
        publishedDate: normalizePublishedDate(book.publishedDate),
        physicalFormat: '',
        pageCount: book.pageCount || null,
        genres: parseGenres(book.categories || []),
        isbn,
      };
    });

    const totalItems = data.totalItems || 0;
    const hasMore = startIndex + maxResults < totalItems;

    return { books, hasMore, totalItems };
  } catch (err) {
    console.error('Book search error:', err);
    return { books: [], hasMore: false, totalItems: 0 };
  }
}
