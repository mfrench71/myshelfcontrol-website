/**
 * Unit Tests for lib/repositories/wishlist.ts
 * Tests for wishlist repository functions with Firebase mocks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/lib/firebase/client', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  Timestamp: {
    now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
  },
}));

import {
  getWishlist,
  getRecentWishlist,
  getWishlistItem,
  addWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  getWishlistCount,
} from '../wishlist';

// Helper to create mock Firestore snapshot
function createMockSnapshot(docs: Array<{ id: string; data: () => Record<string, unknown> }>) {
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
  };
}

// Helper to create mock document
function createMockDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
    exists: () => true,
  };
}

describe('wishlist repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('wishlistCollection');
    mockQuery.mockImplementation(() => 'query');
    mockDoc.mockReturnValue('docRef');
    mockOrderBy.mockReturnValue('orderBy');
    mockLimit.mockReturnValue('limit');
  });

  describe('getWishlist', () => {
    it('returns items sorted by priority then createdAt', async () => {
      const mockDocs = [
        createMockDoc('item-1', { title: 'Low Priority', author: 'Author', priority: 'low' }),
        createMockDoc('item-2', { title: 'High Priority', author: 'Author', priority: 'high' }),
        createMockDoc('item-3', { title: 'Medium Priority', author: 'Author', priority: 'medium' }),
        createMockDoc('item-4', { title: 'No Priority', author: 'Author', priority: null }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const items = await getWishlist('user-123');

      expect(items).toHaveLength(4);
      expect(items[0].title).toBe('High Priority');
      expect(items[1].title).toBe('Medium Priority');
      expect(items[2].title).toBe('Low Priority');
      expect(items[3].title).toBe('No Priority');
    });

    it('returns empty array for no items', async () => {
      mockGetDocs.mockResolvedValue(createMockSnapshot([]));

      const items = await getWishlist('user-123');

      expect(items).toHaveLength(0);
    });

    it('provides default null values for optional fields', async () => {
      const mockDocs = [
        createMockDoc('item-1', { title: 'Book', author: 'Author' }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const items = await getWishlist('user-123');

      expect(items[0].isbn).toBeNull();
      expect(items[0].coverImageUrl).toBeNull();
      expect(items[0].priority).toBeNull();
      expect(items[0].notes).toBeNull();
    });
  });

  describe('getRecentWishlist', () => {
    it('returns limited number of items', async () => {
      const mockDocs = [
        createMockDoc('item-1', { title: 'Book 1', author: 'Author' }),
        createMockDoc('item-2', { title: 'Book 2', author: 'Author' }),
        createMockDoc('item-3', { title: 'Book 3', author: 'Author' }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const items = await getRecentWishlist('user-123', 3);

      expect(mockLimit).toHaveBeenCalledWith(3);
      expect(items).toHaveLength(3);
    });

    it('uses default limit of 5', async () => {
      mockGetDocs.mockResolvedValue(createMockSnapshot([]));

      await getRecentWishlist('user-123');

      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });

  describe('getWishlistItem', () => {
    it('returns item when found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'item-1',
        data: () => ({ title: 'Test Book', author: 'Test Author' }),
      });

      const item = await getWishlistItem('user-123', 'item-1');

      expect(item).not.toBeNull();
      expect(item?.id).toBe('item-1');
      expect(item?.title).toBe('Test Book');
    });

    it('returns null when not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const item = await getWishlistItem('user-123', 'nonexistent');

      expect(item).toBeNull();
    });
  });

  describe('addWishlistItem', () => {
    it('adds item with timestamps', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-item-id' });

      const itemData = {
        title: 'New Book',
        author: 'New Author',
        priority: 'high' as const,
      };
      const id = await addWishlistItem('user-123', itemData);

      expect(id).toBe('new-item-id');
      expect(mockAddDoc).toHaveBeenCalledWith('wishlistCollection', expect.objectContaining({
        title: 'New Book',
        author: 'New Author',
        priority: 'high',
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      }));
    });
  });

  describe('updateWishlistItem', () => {
    it('updates item with new data', async () => {
      await updateWishlistItem('user-123', 'item-1', { title: 'Updated Title' });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        title: 'Updated Title',
        updatedAt: expect.anything(),
      }));
    });

    it('can update priority', async () => {
      await updateWishlistItem('user-123', 'item-1', { priority: 'low' });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        priority: 'low',
      }));
    });

    it('can update notes', async () => {
      await updateWishlistItem('user-123', 'item-1', { notes: 'Some notes' });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        notes: 'Some notes',
      }));
    });
  });

  describe('deleteWishlistItem', () => {
    it('deletes item', async () => {
      await deleteWishlistItem('user-123', 'item-1');

      expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  describe('getWishlistCount', () => {
    it('returns count of items', async () => {
      const mockDocs = [
        createMockDoc('item-1', { title: 'Book 1', author: 'Author' }),
        createMockDoc('item-2', { title: 'Book 2', author: 'Author' }),
        createMockDoc('item-3', { title: 'Book 3', author: 'Author' }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const count = await getWishlistCount('user-123');

      expect(count).toBe(3);
    });

    it('returns 0 for empty wishlist', async () => {
      mockGetDocs.mockResolvedValue(createMockSnapshot([]));

      const count = await getWishlistCount('user-123');

      expect(count).toBe(0);
    });
  });
});
