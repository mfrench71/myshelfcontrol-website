/**
 * Unit Tests for lib/repositories/genres.ts
 * Tests for genre repository functions with Firebase mocks
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
const mockWhere = vi.fn();
const mockBatchUpdate = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn();
const mockWriteBatch = vi.fn(() => ({
  update: mockBatchUpdate,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));
const mockArrayRemove = vi.fn((value) => ({ __arrayRemove: value }));

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
  where: (...args: unknown[]) => mockWhere(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  arrayRemove: (...args: unknown[]) => mockArrayRemove(...args),
  Timestamp: {
    now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
  },
}));

import {
  getGenres,
  getGenre,
  createGenre,
  updateGenre,
  deleteGenre,
  createGenreLookup,
} from '../genres';

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

describe('genres repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('genresCollection');
    mockQuery.mockImplementation(() => 'query');
    mockDoc.mockReturnValue('docRef');
    mockOrderBy.mockReturnValue('orderBy');
  });

  describe('getGenres', () => {
    it('returns genres sorted by name', async () => {
      const mockDocs = [
        createMockDoc('genre-1', { name: 'Action', color: '#ff0000' }),
        createMockDoc('genre-2', { name: 'Comedy', color: '#00ff00' }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const genres = await getGenres('user-123');

      expect(mockOrderBy).toHaveBeenCalledWith('name', 'asc');
      expect(genres).toHaveLength(2);
      expect(genres[0].name).toBe('Action');
      expect(genres[1].name).toBe('Comedy');
    });

    it('provides default color if missing', async () => {
      const mockDocs = [
        createMockDoc('genre-1', { name: 'Mystery' }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const genres = await getGenres('user-123');

      expect(genres[0].color).toBe('#6b7280'); // Default gray
    });

    it('returns empty array for no genres', async () => {
      mockGetDocs.mockResolvedValue(createMockSnapshot([]));

      const genres = await getGenres('user-123');

      expect(genres).toHaveLength(0);
    });
  });

  describe('getGenre', () => {
    it('returns genre when found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'genre-1',
        data: () => ({ name: 'Fiction', color: '#0000ff' }),
      });

      const genre = await getGenre('user-123', 'genre-1');

      expect(genre).not.toBeNull();
      expect(genre?.id).toBe('genre-1');
      expect(genre?.name).toBe('Fiction');
    });

    it('returns null when not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const genre = await getGenre('user-123', 'nonexistent');

      expect(genre).toBeNull();
    });
  });

  describe('createGenre', () => {
    it('creates genre with name and color', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-genre-id' });

      const id = await createGenre('user-123', 'Thriller', '#ff5500');

      expect(id).toBe('new-genre-id');
      expect(mockAddDoc).toHaveBeenCalledWith('genresCollection', expect.objectContaining({
        name: 'Thriller',
        color: '#ff5500',
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      }));
    });
  });

  describe('updateGenre', () => {
    it('updates genre with new data', async () => {
      await updateGenre('user-123', 'genre-1', { name: 'Updated Name' });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        name: 'Updated Name',
        updatedAt: expect.anything(),
      }));
    });

    it('can update color', async () => {
      await updateGenre('user-123', 'genre-1', { color: '#abcdef' });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        color: '#abcdef',
      }));
    });

    it('can update bookCount', async () => {
      await updateGenre('user-123', 'genre-1', { bookCount: 5 });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        bookCount: 5,
      }));
    });
  });

  describe('deleteGenre', () => {
    it('deletes genre and removes it from books', async () => {
      // Mock books that have this genre
      const mockBookDocs = [
        { id: 'book-1', ref: 'bookRef1', data: () => ({ genres: ['genre-1', 'genre-2'] }) },
        { id: 'book-2', ref: 'bookRef2', data: () => ({ genres: ['genre-1'] }) },
      ];
      mockGetDocs.mockResolvedValue({ docs: mockBookDocs });

      await deleteGenre('user-123', 'genre-1');

      // Should query for books with this genre
      expect(mockWhere).toHaveBeenCalledWith('genres', 'array-contains', 'genre-1');
      // Should create a batch and commit
      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
      // Should update each book to remove the genre
      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
      // Should delete the genre
      expect(mockBatchDelete).toHaveBeenCalled();
    });

    it('deletes genre when no books reference it', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await deleteGenre('user-123', 'genre-1');

      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatchUpdate).not.toHaveBeenCalled();
      expect(mockBatchDelete).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });

  describe('createGenreLookup', () => {
    it('creates lookup map by ID', () => {
      const genres = [
        { id: 'genre-1', name: 'Fiction', color: '#ff0000' },
        { id: 'genre-2', name: 'Non-Fiction', color: '#00ff00' },
      ];

      const lookup = createGenreLookup(genres);

      expect(lookup['genre-1']).toEqual(genres[0]);
      expect(lookup['genre-2']).toEqual(genres[1]);
    });

    it('returns empty object for empty array', () => {
      const lookup = createGenreLookup([]);

      expect(Object.keys(lookup)).toHaveLength(0);
    });
  });
});
