/**
 * Books Repository
 * Data access layer for book collection in Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Book, BookFormData, BookUpdateData } from '@/lib/types';

/**
 * Get the books collection reference for a user
 */
function getBooksCollection(userId: string) {
  return collection(db, 'users', userId, 'books');
}

/**
 * Convert Firestore document to Book type
 */
function docToBook(doc: QueryDocumentSnapshot<DocumentData>): Book {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || '',
    author: data.author || '',
    isbn: data.isbn,
    coverImageUrl: data.coverImageUrl,
    publisher: data.publisher,
    publishedDate: data.publishedDate,
    physicalFormat: data.physicalFormat,
    pageCount: data.pageCount,
    rating: data.rating,
    genres: data.genres || [],
    seriesId: data.seriesId,
    seriesPosition: data.seriesPosition,
    notes: data.notes,
    reads: data.reads || [],
    covers: data.covers,
    images: data.images,
    deletedAt: data.deletedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Get all books for a user (excluding soft-deleted)
 */
export async function getBooks(userId: string): Promise<Book[]> {
  const booksRef = getBooksCollection(userId);
  const q = query(
    booksRef,
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToBook);
}

/**
 * Get a single book by ID
 */
export async function getBook(userId: string, bookId: string): Promise<Book | null> {
  const bookRef = doc(db, 'users', userId, 'books', bookId);
  const snapshot = await getDoc(bookRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToBook(snapshot as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Get books with a specific reading status
 */
export async function getBooksByStatus(
  userId: string,
  status: 'to-read' | 'reading' | 'completed'
): Promise<Book[]> {
  const books = await getBooks(userId);

  return books.filter((book) => {
    const reads = book.reads || [];
    const hasReads = reads.length > 0;
    const latestRead = hasReads ? reads[reads.length - 1] : null;

    switch (status) {
      case 'to-read':
        return !hasReads;
      case 'reading':
        return latestRead && latestRead.startedAt && !latestRead.finishedAt;
      case 'completed':
        return latestRead && latestRead.finishedAt;
      default:
        return false;
    }
  });
}

/**
 * Get recently added books
 */
export async function getRecentBooks(userId: string, count: number = 10): Promise<Book[]> {
  const booksRef = getBooksCollection(userId);
  const q = query(
    booksRef,
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToBook);
}

/**
 * Add a new book
 */
export async function addBook(userId: string, bookData: BookFormData): Promise<string> {
  const booksRef = getBooksCollection(userId);

  const docRef = await addDoc(booksRef, {
    ...bookData,
    deletedAt: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Update an existing book
 */
export async function updateBook(
  userId: string,
  bookId: string,
  updates: BookUpdateData
): Promise<void> {
  const bookRef = doc(db, 'users', userId, 'books', bookId);

  await updateDoc(bookRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Soft delete a book (move to bin)
 */
export async function softDeleteBook(userId: string, bookId: string): Promise<void> {
  const bookRef = doc(db, 'users', userId, 'books', bookId);

  await updateDoc(bookRef, {
    deletedAt: Date.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Permanently delete a book
 */
export async function deleteBook(userId: string, bookId: string): Promise<void> {
  const bookRef = doc(db, 'users', userId, 'books', bookId);
  await deleteDoc(bookRef);
}

/**
 * Restore a soft-deleted book
 */
export async function restoreBook(userId: string, bookId: string): Promise<void> {
  const bookRef = doc(db, 'users', userId, 'books', bookId);

  await updateDoc(bookRef, {
    deletedAt: null,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get books in the bin (soft-deleted)
 */
export async function getBinBooks(userId: string): Promise<Book[]> {
  const booksRef = getBooksCollection(userId);
  const q = query(
    booksRef,
    where('deletedAt', '!=', null),
    orderBy('deletedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToBook);
}

/**
 * Get books by series ID
 */
export async function getBooksBySeries(userId: string, seriesId: string): Promise<Book[]> {
  const booksRef = getBooksCollection(userId);
  const q = query(
    booksRef,
    where('seriesId', '==', seriesId),
    where('deletedAt', '==', null),
    orderBy('seriesPosition', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToBook);
}

/**
 * Get book count for a user
 */
export async function getBookCount(userId: string): Promise<number> {
  const booksRef = getBooksCollection(userId);
  const q = query(booksRef, where('deletedAt', '==', null));
  const snapshot = await getDocs(q);
  return snapshot.size;
}
