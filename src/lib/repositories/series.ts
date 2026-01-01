/**
 * Series Repository
 * Data access layer for series collection in Firestore
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
  orderBy,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Series } from '@/lib/types';

/**
 * Get the series collection reference for a user
 */
function getSeriesCollection(userId: string) {
  return collection(db, 'users', userId, 'series');
}

/**
 * Convert Firestore document to Series type
 */
function docToSeries(doc: QueryDocumentSnapshot<DocumentData>): Series {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    totalBooks: data.totalBooks ?? null,
    bookCount: data.bookCount || 0,
    expectedBooks: data.expectedBooks,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Get all series for a user
 */
export async function getSeries(userId: string): Promise<Series[]> {
  const seriesRef = getSeriesCollection(userId);
  const q = query(seriesRef, orderBy('name', 'asc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToSeries);
}

/**
 * Get a single series by ID
 */
export async function getSeriesById(userId: string, seriesId: string): Promise<Series | null> {
  const seriesRef = doc(db, 'users', userId, 'series', seriesId);
  const snapshot = await getDoc(seriesRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToSeries(snapshot as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Create a new series
 */
export async function createSeries(
  userId: string,
  name: string,
  totalBooks?: number
): Promise<string> {
  const seriesRef = getSeriesCollection(userId);

  const docRef = await addDoc(seriesRef, {
    name,
    totalBooks: totalBooks && totalBooks > 0 ? totalBooks : null,
    expectedBooks: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Update an existing series
 */
export async function updateSeries(
  userId: string,
  seriesId: string,
  updates: Partial<Pick<Series, 'name' | 'totalBooks' | 'bookCount'>>
): Promise<void> {
  const seriesRef = doc(db, 'users', userId, 'series', seriesId);

  // Sanitize totalBooks: ensure it's a positive number or null
  const sanitizedUpdates: Record<string, unknown> = { ...updates };
  if ('totalBooks' in updates) {
    const tb = updates.totalBooks;
    sanitizedUpdates.totalBooks = tb && tb > 0 ? tb : null;
  }

  await updateDoc(seriesRef, {
    ...sanitizedUpdates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a series
 */
export async function deleteSeries(userId: string, seriesId: string): Promise<void> {
  const seriesRef = doc(db, 'users', userId, 'series', seriesId);
  await deleteDoc(seriesRef);
}

/**
 * Create a lookup map of series by ID
 */
export function createSeriesLookup(seriesList: Series[]): Record<string, Series> {
  return seriesList.reduce(
    (acc, series) => {
      acc[series.id] = series;
      return acc;
    },
    {} as Record<string, Series>
  );
}
