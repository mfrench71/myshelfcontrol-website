/**
 * Wishlist Repository
 * Data access layer for wishlist collection in Firestore
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
  limit,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { WishlistItem, WishlistPriority } from '@/lib/types';

/**
 * Get the wishlist collection reference for a user
 */
function getWishlistCollection(userId: string) {
  return collection(db, 'users', userId, 'wishlist');
}

/**
 * Convert Firestore document to WishlistItem type
 */
function docToWishlistItem(doc: QueryDocumentSnapshot<DocumentData>): WishlistItem {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || '',
    author: data.author || '',
    isbn: data.isbn || null,
    coverImageUrl: data.coverImageUrl || null,
    covers: data.covers || null,
    publisher: data.publisher || null,
    publishedDate: data.publishedDate || null,
    pageCount: data.pageCount || null,
    priority: data.priority || null,
    notes: data.notes || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Get all wishlist items for a user
 * Sorted by priority (high first), then by createdAt
 */
export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const wishlistRef = getWishlistCollection(userId);
  const q = query(wishlistRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(docToWishlistItem);

  // Sort by priority: high > medium > low > null
  const priorityOrder: Record<WishlistPriority & string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return items.sort((a, b) => {
    const aPriority = a.priority ? priorityOrder[a.priority] : 3;
    const bPriority = b.priority ? priorityOrder[b.priority] : 3;
    return aPriority - bPriority;
  });
}

/**
 * Get recent wishlist items
 */
export async function getRecentWishlist(userId: string, count: number = 5): Promise<WishlistItem[]> {
  const wishlistRef = getWishlistCollection(userId);
  const q = query(wishlistRef, orderBy('createdAt', 'desc'), limit(count));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToWishlistItem);
}

/**
 * Get a single wishlist item by ID
 */
export async function getWishlistItem(userId: string, itemId: string): Promise<WishlistItem | null> {
  const itemRef = doc(db, 'users', userId, 'wishlist', itemId);
  const snapshot = await getDoc(itemRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToWishlistItem(snapshot as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Add a new wishlist item
 */
export async function addWishlistItem(
  userId: string,
  itemData: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const wishlistRef = getWishlistCollection(userId);

  const docRef = await addDoc(wishlistRef, {
    ...itemData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Update an existing wishlist item
 */
export async function updateWishlistItem(
  userId: string,
  itemId: string,
  updates: Partial<Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const itemRef = doc(db, 'users', userId, 'wishlist', itemId);

  await updateDoc(itemRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a wishlist item
 */
export async function deleteWishlistItem(userId: string, itemId: string): Promise<void> {
  const itemRef = doc(db, 'users', userId, 'wishlist', itemId);
  await deleteDoc(itemRef);
}

/**
 * Get wishlist count for a user
 */
export async function getWishlistCount(userId: string): Promise<number> {
  const wishlistRef = getWishlistCollection(userId);
  const snapshot = await getDocs(wishlistRef);
  return snapshot.size;
}
