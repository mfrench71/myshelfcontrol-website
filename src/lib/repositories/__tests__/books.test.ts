/**
 * Unit Tests for lib/repositories/books.ts
 * Tests for book repository functions with Firebase mocks
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
const mockWhere = vi.fn();
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
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  Timestamp: {
    now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
  },
}));

import {
  getBooks,
  getBook,
  getBooksByStatus,
  getRecentBooks,
  addBook,
  updateBook,
  softDeleteBook,
  deleteBook,
  restoreBook,
  getBinBooks,
  getBooksBySeries,
  getBookCount,
} from '../books';

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

describe('books repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('booksCollection');
    mockQuery.mockImplementation(() => 'query');
    mockDoc.mockReturnValue('docRef');
    mockOrderBy.mockReturnValue('orderBy');
    mockWhere.mockReturnValue('where');
    mockLimit.mockReturnValue('limit');
  });

  describe('getBooks', () => {
    it('returns books sorted by createdAt', async () => {
      const mockDocs = [
        createMockDoc('book-1', { title: 'Book 1', author: 'Author 1', createdAt: 2 }),
        createMockDoc('book-2', { title: 'Book 2', author: 'Author 2', createdAt: 1 }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const books = await getBooks('user-123');

      expect(mockCollection).toHaveBeenCalled();
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(books).toHaveLength(2);
      expect(books[0].id).toBe('book-1');
      expect(books[0].title).toBe('Book 1');
    });

    it('filters out soft-deleted books', async () => {
      const mockDocs = [
        createMockDoc('book-1', { title: 'Book 1', author: 'Author 1', deletedAt: null }),
        createMockDoc('book-2', { title: 'Book 2', author: 'Author 2', deletedAt: Date.now() }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const books = await getBooks('user-123');

      expect(books).toHaveLength(1);
      expect(books[0].id).toBe('book-1');
    });

    it('returns empty array for no books', async () => {
      mockGetDocs.mockResolvedValue(createMockSnapshot([]));

      const books = await getBooks('user-123');

      expect(books).toHaveLength(0);
    });
  });

  describe('getBook', () => {
    it('returns book when found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'book-1',
        data: () => ({ title: 'Test Book', author: 'Test Author' }),
      });

      const book = await getBook('user-123', 'book-1');

      expect(book).not.toBeNull();
      expect(book?.id).toBe('book-1');
      expect(book?.title).toBe('Test Book');
    });

    it('returns null when not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const book = await getBook('user-123', 'nonexistent');

      expect(book).toBeNull();
    });
  });

  describe('getBooksByStatus', () => {
    beforeEach(() => {
      mockGetDocs.mockResolvedValue(
        createMockSnapshot([
          createMockDoc('book-1', { title: 'To Read', author: 'Author', reads: [] }),
          createMockDoc('book-2', {
            title: 'Reading',
            author: 'Author',
            reads: [{ startedAt: '2024-01-01' }],
          }),
          createMockDoc('book-3', {
            title: 'Completed',
            author: 'Author',
            reads: [{ startedAt: '2024-01-01', finishedAt: '2024-02-01' }],
          }),
        ])
      );
    });

    it('returns to-read books', async () => {
      const books = await getBooksByStatus('user-123', 'to-read');

      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('To Read');
    });

    it('returns reading books', async () => {
      const books = await getBooksByStatus('user-123', 'reading');

      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('Reading');
    });

    it('returns completed books', async () => {
      const books = await getBooksByStatus('user-123', 'completed');

      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('Completed');
    });
  });

  describe('getRecentBooks', () => {
    it('returns limited number of books', async () => {
      const mockDocs = Array.from({ length: 10 }, (_, i) =>
        createMockDoc(`book-${i}`, { title: `Book ${i}`, author: 'Author' })
      );
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const books = await getRecentBooks('user-123', 5);

      expect(mockLimit).toHaveBeenCalledWith(10); // count * 2
      expect(books).toHaveLength(5);
    });

    it('filters out soft-deleted books before limiting', async () => {
      const mockDocs = [
        createMockDoc('book-1', { title: 'Book 1', author: 'Author' }),
        createMockDoc('book-2', { title: 'Book 2', author: 'Author', deletedAt: Date.now() }),
        createMockDoc('book-3', { title: 'Book 3', author: 'Author' }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const books = await getRecentBooks('user-123', 5);

      expect(books).toHaveLength(2);
    });
  });

  describe('addBook', () => {
    it('adds book with timestamps', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-book-id' });

      const bookData = { title: 'New Book', author: 'New Author' };
      const id = await addBook('user-123', bookData);

      expect(id).toBe('new-book-id');
      expect(mockAddDoc).toHaveBeenCalledWith('booksCollection', expect.objectContaining({
        title: 'New Book',
        author: 'New Author',
        deletedAt: null,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      }));
    });
  });

  describe('updateBook', () => {
    it('updates book with new data', async () => {
      await updateBook('user-123', 'book-1', { title: 'Updated Title' });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        title: 'Updated Title',
        updatedAt: expect.anything(),
      }));
    });

    it('filters out undefined values', async () => {
      await updateBook('user-123', 'book-1', {
        title: 'Updated Title',
        isbn: undefined,
        notes: 'Some notes',
      });

      const call = mockUpdateDoc.mock.calls[0][1];
      expect(call.title).toBe('Updated Title');
      expect(call.notes).toBe('Some notes');
      expect(call).not.toHaveProperty('isbn');
    });
  });

  describe('softDeleteBook', () => {
    it('sets deletedAt timestamp', async () => {
      await softDeleteBook('user-123', 'book-1');

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        deletedAt: expect.any(Number),
        updatedAt: expect.anything(),
      }));
    });
  });

  describe('deleteBook', () => {
    it('permanently deletes book', async () => {
      await deleteBook('user-123', 'book-1');

      expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  describe('restoreBook', () => {
    it('clears deletedAt field', async () => {
      await restoreBook('user-123', 'book-1');

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        deletedAt: null,
        updatedAt: expect.anything(),
      }));
    });
  });

  describe('getBinBooks', () => {
    it('returns soft-deleted books', async () => {
      const mockDocs = [
        createMockDoc('book-1', { title: 'Deleted 1', author: 'Author', deletedAt: Date.now() }),
        createMockDoc('book-2', { title: 'Deleted 2', author: 'Author', deletedAt: Date.now() - 1000 }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const books = await getBinBooks('user-123');

      expect(mockWhere).toHaveBeenCalledWith('deletedAt', '!=', null);
      expect(mockOrderBy).toHaveBeenCalledWith('deletedAt', 'desc');
      expect(books).toHaveLength(2);
    });
  });

  describe('getBooksBySeries', () => {
    it('returns books in series ordered by position', async () => {
      const mockDocs = [
        createMockDoc('book-1', { title: 'Book 1', author: 'Author', seriesPosition: 1 }),
        createMockDoc('book-2', { title: 'Book 2', author: 'Author', seriesPosition: 2 }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const books = await getBooksBySeries('user-123', 'series-1');

      expect(mockWhere).toHaveBeenCalledWith('seriesId', '==', 'series-1');
      expect(mockOrderBy).toHaveBeenCalledWith('seriesPosition', 'asc');
      expect(books).toHaveLength(2);
    });

    it('filters out soft-deleted books', async () => {
      const mockDocs = [
        createMockDoc('book-1', { title: 'Book 1', author: 'Author', seriesPosition: 1 }),
        createMockDoc('book-2', {
          title: 'Book 2',
          author: 'Author',
          seriesPosition: 2,
          deletedAt: Date.now(),
        }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const books = await getBooksBySeries('user-123', 'series-1');

      expect(books).toHaveLength(1);
    });
  });

  describe('getBookCount', () => {
    it('returns count of non-deleted books', async () => {
      const mockDocs = [
        createMockDoc('book-1', { title: 'Book 1', author: 'Author' }),
        createMockDoc('book-2', { title: 'Book 2', author: 'Author' }),
        createMockDoc('book-3', { title: 'Book 3', author: 'Author', deletedAt: Date.now() }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const count = await getBookCount('user-123');

      expect(count).toBe(2);
    });

    it('returns 0 for empty library', async () => {
      mockGetDocs.mockResolvedValue(createMockSnapshot([]));

      const count = await getBookCount('user-123');

      expect(count).toBe(0);
    });
  });
});
