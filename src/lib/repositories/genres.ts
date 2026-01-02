/**
 * Genres Repository
 * Data access layer for genre collection in Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  writeBatch,
  arrayRemove,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Genre } from '@/lib/types';

/**
 * Get the genres collection reference for a user
 */
function getGenresCollection(userId: string) {
  return collection(db, 'users', userId, 'genres');
}

/**
 * Convert Firestore document to Genre type
 */
function docToGenre(doc: QueryDocumentSnapshot<DocumentData>): Genre {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    color: data.color || '#6b7280',
    bookCount: data.bookCount || 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Get all genres for a user
 */
export async function getGenres(userId: string): Promise<Genre[]> {
  const genresRef = getGenresCollection(userId);
  const q = query(genresRef, orderBy('name', 'asc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToGenre);
}

/**
 * Get a single genre by ID
 */
export async function getGenre(userId: string, genreId: string): Promise<Genre | null> {
  const genreRef = doc(db, 'users', userId, 'genres', genreId);
  const snapshot = await getDoc(genreRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToGenre(snapshot as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Create a new genre
 */
export async function createGenre(
  userId: string,
  name: string,
  color: string
): Promise<string> {
  const genresRef = getGenresCollection(userId);

  const docRef = await addDoc(genresRef, {
    name,
    color,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Update an existing genre
 */
export async function updateGenre(
  userId: string,
  genreId: string,
  updates: Partial<Pick<Genre, 'name' | 'color' | 'bookCount'>>
): Promise<void> {
  const genreRef = doc(db, 'users', userId, 'genres', genreId);

  await updateDoc(genreRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a genre and remove it from all books that reference it
 */
export async function deleteGenre(userId: string, genreId: string): Promise<void> {
  const batch = writeBatch(db);

  // Find all books that have this genre
  const booksRef = collection(db, 'users', userId, 'books');
  const booksQuery = query(booksRef, where('genres', 'array-contains', genreId));
  const booksSnapshot = await getDocs(booksQuery);

  // Remove the genre from each book
  booksSnapshot.docs.forEach((bookDoc) => {
    batch.update(bookDoc.ref, {
      genres: arrayRemove(genreId),
      updatedAt: Timestamp.now(),
    });
  });

  // Delete the genre
  const genreRef = doc(db, 'users', userId, 'genres', genreId);
  batch.delete(genreRef);

  await batch.commit();
}

/**
 * Create a lookup map of genres by ID
 */
export function createGenreLookup(genres: Genre[]): Record<string, Genre> {
  return genres.reduce(
    (acc, genre) => {
      acc[genre.id] = genre;
      return acc;
    },
    {} as Record<string, Genre>
  );
}
