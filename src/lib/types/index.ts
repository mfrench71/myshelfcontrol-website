/**
 * Type Definitions for Book Assembly
 * These types mirror the Zod schemas and Firestore document structures
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Firebase Types
// ============================================================================

export type FirestoreTimestamp = Timestamp | Date | number;

// ============================================================================
// Book Types
// ============================================================================

export type PhysicalFormat =
  | ''
  | 'Paperback'
  | 'Hardcover'
  | 'Mass Market Paperback'
  | 'Trade Paperback'
  | 'Library Binding'
  | 'Spiral-bound'
  | 'Audio CD'
  | 'Ebook';

export type ReadingStatus = 'to-read' | 'reading' | 'completed' | 'dnf';

/** Reading entry - dates can be string (ISO), number (timestamp), Date, or null */
export type BookRead = {
  startedAt?: string | number | Date | null;
  finishedAt?: string | number | Date | null;
};

/** Cover image URLs from different sources */
export type BookCovers = {
  googleBooks?: string;
  openLibrary?: string;
  [key: string]: string | undefined;
};

export type BookImage = {
  id: string;
  url: string;
  storagePath: string;
  isPrimary: boolean;
  caption?: string;
  uploadedAt: number;
  sizeBytes?: number;
  width?: number;
  height?: number;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverImageUrl?: string;
  publisher?: string;
  publishedDate?: string;
  physicalFormat?: PhysicalFormat;
  pageCount?: number | null;
  rating?: number | null;
  genres?: string[];
  seriesId?: string | null;
  seriesPosition?: number | null;
  notes?: string;
  reads?: BookRead[];
  covers?: BookCovers;
  images?: BookImage[];
  deletedAt?: number | null;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

export type BookFormData = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>;
export type BookUpdateData = Partial<BookFormData>;

// ============================================================================
// Genre Types
// ============================================================================

export type Genre = {
  id: string;
  name: string;
  color: string;
  bookCount?: number;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

export type GenreFormData = Pick<Genre, 'name'> & { color?: string };
export type GenreLookup = Record<string, Genre>;

// ============================================================================
// Series Types
// ============================================================================

export type ExpectedBook = {
  title: string;
  isbn?: string | null;
  position?: number | null;
  source?: 'api' | 'manual';
};

export type Series = {
  id: string;
  name: string;
  description?: string | null;
  totalBooks?: number | null;
  bookCount?: number;
  expectedBooks?: ExpectedBook[];
  deletedAt?: number | null;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

export type SeriesFormData = Omit<Series, 'id' | 'createdAt' | 'updatedAt'>;
export type SeriesLookup = Record<string, Series>;

// ============================================================================
// Wishlist Types
// ============================================================================

export type WishlistPriority = 'high' | 'medium' | 'low' | null;

export type WishlistItem = {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  coverImageUrl?: string | null;
  covers?: BookCovers | null;
  publisher?: string | null;
  publishedDate?: string | null;
  pageCount?: number | null;
  priority?: WishlistPriority;
  notes?: string | null;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

// ============================================================================
// Filter & Sort Types
// ============================================================================

export type SortDirection = 'asc' | 'desc';

export type BookSortField =
  | 'title'
  | 'author'
  | 'rating'
  | 'createdAt'
  | 'updatedAt'
  | 'series'
  | 'pageCount'
  | 'publishedDate';

export type BookFilters = {
  search?: string;
  genreIds?: string[];
  seriesIds?: string[];
  minRating?: number;
  statuses?: ('reading' | 'finished' | 'want-to-read')[];
  author?: string;
};

export type BookSortOptions = {
  field: BookSortField;
  direction: SortDirection;
};

// ============================================================================
// API Response Types
// ============================================================================

export type GoogleBooksVolumeInfo = {
  title?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  pageCount?: number;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
};

export type GoogleBooksItem = {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
};

export type GoogleBooksResponse = {
  totalItems: number;
  items?: GoogleBooksItem[];
};

// ============================================================================
// Utility Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'info';

export type ToastOptions = {
  type?: ToastType;
  duration?: number;
};
