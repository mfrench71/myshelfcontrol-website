/**
 * Unit Tests for lib/repositories/series.ts
 * Tests for series repository functions with Firebase mocks
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
  Timestamp: {
    now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
  },
}));

import {
  getSeries,
  getSeriesById,
  createSeries,
  updateSeries,
  deleteSeries,
  createSeriesLookup,
} from '../series';

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

describe('series repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('seriesCollection');
    mockQuery.mockImplementation(() => 'query');
    mockDoc.mockReturnValue('docRef');
    mockOrderBy.mockReturnValue('orderBy');
  });

  describe('getSeries', () => {
    it('returns series sorted by name', async () => {
      const mockDocs = [
        createMockDoc('series-1', { name: 'Harry Potter', totalBooks: 7 }),
        createMockDoc('series-2', { name: 'Lord of the Rings', totalBooks: 3 }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const series = await getSeries('user-123');

      expect(mockOrderBy).toHaveBeenCalledWith('name', 'asc');
      expect(series).toHaveLength(2);
      expect(series[0].name).toBe('Harry Potter');
    });

    it('handles null totalBooks', async () => {
      const mockDocs = [
        createMockDoc('series-1', { name: 'Ongoing Series' }),
      ];
      mockGetDocs.mockResolvedValue(createMockSnapshot(mockDocs));

      const series = await getSeries('user-123');

      expect(series[0].totalBooks).toBeNull();
    });

    it('returns empty array for no series', async () => {
      mockGetDocs.mockResolvedValue(createMockSnapshot([]));

      const series = await getSeries('user-123');

      expect(series).toHaveLength(0);
    });
  });

  describe('getSeriesById', () => {
    it('returns series when found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'series-1',
        data: () => ({ name: 'Test Series', totalBooks: 5 }),
      });

      const series = await getSeriesById('user-123', 'series-1');

      expect(series).not.toBeNull();
      expect(series?.id).toBe('series-1');
      expect(series?.name).toBe('Test Series');
    });

    it('returns null when not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const series = await getSeriesById('user-123', 'nonexistent');

      expect(series).toBeNull();
    });
  });

  describe('createSeries', () => {
    it('creates series with name and totalBooks', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-series-id' });

      const id = await createSeries('user-123', 'New Series', 10);

      expect(id).toBe('new-series-id');
      expect(mockAddDoc).toHaveBeenCalledWith('seriesCollection', expect.objectContaining({
        name: 'New Series',
        totalBooks: 10,
        expectedBooks: [],
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      }));
    });

    it('creates series without totalBooks', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-series-id' });

      await createSeries('user-123', 'Ongoing Series');

      expect(mockAddDoc).toHaveBeenCalledWith('seriesCollection', expect.objectContaining({
        name: 'Ongoing Series',
        totalBooks: null,
      }));
    });

    it('handles zero totalBooks as null', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-series-id' });

      await createSeries('user-123', 'Series', 0);

      expect(mockAddDoc).toHaveBeenCalledWith('seriesCollection', expect.objectContaining({
        totalBooks: null,
      }));
    });
  });

  describe('updateSeries', () => {
    it('updates series with new data', async () => {
      await updateSeries('user-123', 'series-1', { name: 'Updated Name' });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        name: 'Updated Name',
        updatedAt: expect.anything(),
      }));
    });

    it('sanitizes totalBooks to positive number', async () => {
      await updateSeries('user-123', 'series-1', { totalBooks: 5 });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        totalBooks: 5,
      }));
    });

    it('sanitizes zero totalBooks to null', async () => {
      await updateSeries('user-123', 'series-1', { totalBooks: 0 });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        totalBooks: null,
      }));
    });

    it('sanitizes negative totalBooks to null', async () => {
      await updateSeries('user-123', 'series-1', { totalBooks: -5 });

      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        totalBooks: null,
      }));
    });
  });

  describe('deleteSeries', () => {
    it('deletes series and removes it from books', async () => {
      // Mock books that have this series
      const mockBookDocs = [
        { id: 'book-1', ref: 'bookRef1', data: () => ({ seriesId: 'series-1', seriesPosition: 1 }) },
        { id: 'book-2', ref: 'bookRef2', data: () => ({ seriesId: 'series-1', seriesPosition: 2 }) },
      ];
      mockGetDocs.mockResolvedValue({ docs: mockBookDocs });

      await deleteSeries('user-123', 'series-1');

      // Should query for books with this series
      expect(mockWhere).toHaveBeenCalledWith('seriesId', '==', 'series-1');
      // Should create a batch and commit
      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
      // Should update each book to remove the series
      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
      // Should delete the series
      expect(mockBatchDelete).toHaveBeenCalled();
    });

    it('deletes series when no books reference it', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await deleteSeries('user-123', 'series-1');

      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatchUpdate).not.toHaveBeenCalled();
      expect(mockBatchDelete).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });

  describe('createSeriesLookup', () => {
    it('creates lookup map by ID', () => {
      const seriesList = [
        { id: 'series-1', name: 'Series A' },
        { id: 'series-2', name: 'Series B' },
      ];

      const lookup = createSeriesLookup(seriesList as never);

      expect(lookup['series-1'].name).toBe('Series A');
      expect(lookup['series-2'].name).toBe('Series B');
    });

    it('returns empty object for empty array', () => {
      const lookup = createSeriesLookup([]);

      expect(Object.keys(lookup)).toHaveLength(0);
    });
  });
});
