/**
 * Unit Tests for lib/utils/book-api.ts
 * Tests for book API utilities (ISBN lookup, book search)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lookupISBN, searchBooks } from '../book-api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('book-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('lookupISBN', () => {
    it('returns null for null ISBN', async () => {
      const result = await lookupISBN(null);
      expect(result).toBe(null);
    });

    it('returns null for undefined ISBN', async () => {
      const result = await lookupISBN(undefined);
      expect(result).toBe(null);
    });

    it('returns null for empty ISBN', async () => {
      const result = await lookupISBN('');
      expect(result).toBe(null);
    });

    describe('Google Books API', () => {
      it('fetches from Google Books API', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ items: [] }),
        });

        await lookupISBN('9780123456789');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('googleapis.com/books/v1/volumes?q=isbn:9780123456789'),
          expect.any(Object)
        );
      });

      it('parses Google Books response correctly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  volumeInfo: {
                    title: 'Test Book',
                    authors: ['Author One', 'Author Two'],
                    publisher: 'Test Publisher',
                    publishedDate: '2024',
                    pageCount: 300,
                    categories: ['Fiction / Fantasy'],
                    imageLinks: {
                      thumbnail: 'http://example.com/cover.jpg',
                    },
                  },
                },
              ],
            }),
        });

        // Mock Open Library returning empty
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });
        mockFetch.mockResolvedValueOnce({
          ok: false,
        });

        const result = await lookupISBN('9780123456789');

        expect(result).not.toBe(null);
        expect(result?.title).toBe('Test Book');
        expect(result?.author).toBe('Author One, Author Two');
        expect(result?.publisher).toBe('Test Publisher');
        expect(result?.publishedDate).toBe('2024');
        expect(result?.pageCount).toBe(300);
        expect(result?.genres).toContain('Fantasy');
        expect(result?.coverImageUrl).toContain('https://');
      });

      it('converts http to https for cover URLs', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  volumeInfo: {
                    title: 'Test',
                    imageLinks: {
                      thumbnail: 'http://example.com/cover.jpg',
                    },
                  },
                },
              ],
            }),
        });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        });

        const result = await lookupISBN('9780123456789');

        expect(result?.coverImageUrl).toMatch(/^https:/);
      });
    });

    describe('Open Library API', () => {
      it('supplements missing fields from Open Library', async () => {
        // Google Books returns partial data
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  volumeInfo: {
                    title: 'Test Book',
                    authors: ['Author'],
                  },
                },
              ],
            }),
        });

        // Open Library returns additional data
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              'ISBN:9780123456789': {
                publishers: [{ name: 'OL Publisher' }],
                publish_date: '2024',
                number_of_pages: 250,
              },
            }),
        });

        // Edition endpoint
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              physical_format: 'hardcover',
            }),
        });

        const result = await lookupISBN('9780123456789');

        expect(result?.publisher).toBe('OL Publisher');
        expect(result?.pageCount).toBe(250);
        expect(result?.physicalFormat).toBe('Hardcover');
      });

      it('uses Open Library as primary when Google Books fails', async () => {
        // Google Books fails
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ items: [] }),
        });

        // Open Library returns data
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              'ISBN:9780123456789': {
                title: 'Open Library Book',
                authors: [{ name: 'OL Author' }],
                publishers: [{ name: 'OL Publisher' }],
                publish_date: '2023',
                number_of_pages: 200,
                cover: {
                  large: 'https://covers.openlibrary.org/cover.jpg',
                },
              },
            }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
        });

        const result = await lookupISBN('9780123456789');

        expect(result?.title).toBe('Open Library Book');
        expect(result?.author).toBe('OL Author');
        expect(result?.coverImageUrl).toContain('openlibrary.org');
      });
    });

    describe('series parsing', () => {
      it('extracts series name and position from edition', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  volumeInfo: {
                    title: 'Test Book',
                    authors: ['Author'],
                  },
                },
              ],
            }),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              series: 'Harry Potter #3',
            }),
        });

        const result = await lookupISBN('9780123456789');

        expect(result?.seriesName).toBe('Harry Potter');
        expect(result?.seriesPosition).toBe(3);
      });

      it('handles series without position', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [{ volumeInfo: { title: 'Test' } }],
            }),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              series: 'Discworld',
            }),
        });

        const result = await lookupISBN('9780123456789');

        expect(result?.seriesName).toBe('Discworld');
        expect(result?.seriesPosition).toBe(null);
      });
    });

    describe('error handling', () => {
      it('handles network errors gracefully', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const result = await lookupISBN('9780123456789');

        expect(result).toBe(null);
      });

      it('handles timeout errors', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        mockFetch.mockRejectedValue(abortError);

        const result = await lookupISBN('9780123456789');

        expect(result).toBe(null);
      });
    });

    describe('covers object', () => {
      it('includes both Google Books and Open Library covers', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  volumeInfo: {
                    title: 'Test',
                    imageLinks: { thumbnail: 'http://google.com/cover.jpg' },
                  },
                },
              ],
            }),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              'ISBN:9780123456789': {
                cover: { large: 'https://openlibrary.org/cover.jpg' },
              },
            }),
        });
        mockFetch.mockResolvedValueOnce({ ok: false });

        const result = await lookupISBN('9780123456789');

        expect(result?.covers?.googleBooks).toContain('google.com');
        expect(result?.covers?.openLibrary).toContain('openlibrary.org');
      });
    });
  });

  describe('searchBooks', () => {
    it('searches Google Books API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], totalItems: 0 }),
      });

      await searchBooks('harry potter');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com/books/v1/volumes?q=harry%20potter'),
        expect.any(Object)
      );
    });

    it('returns empty array when no results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: undefined, totalItems: 0 }),
      });

      const result = await searchBooks('nonexistent book');

      expect(result.books).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.totalItems).toBe(0);
    });

    it('parses search results correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                volumeInfo: {
                  title: 'Book One',
                  authors: ['Author A'],
                  publisher: 'Publisher A',
                  publishedDate: '2020',
                  pageCount: 200,
                  categories: ['Fiction'],
                  imageLinks: { thumbnail: 'http://example.com/1.jpg' },
                },
              },
              {
                volumeInfo: {
                  title: 'Book Two',
                  authors: ['Author B'],
                },
              },
            ],
            totalItems: 100,
          }),
      });

      const result = await searchBooks('test');

      expect(result.books).toHaveLength(2);
      expect(result.books[0].title).toBe('Book One');
      expect(result.books[0].author).toBe('Author A');
      expect(result.books[1].title).toBe('Book Two');
      expect(result.totalItems).toBe(100);
    });

    it('handles pagination with startIndex', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], totalItems: 50 }),
      });

      await searchBooks('test', { startIndex: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('startIndex=20'),
        expect.any(Object)
      );
    });

    it('handles custom maxResults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], totalItems: 50 }),
      });

      await searchBooks('test', { maxResults: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('maxResults=20'),
        expect.any(Object)
      );
    });

    it('indicates hasMore when more results available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: Array(10).fill({ volumeInfo: { title: 'Book' } }),
            totalItems: 100,
          }),
      });

      const result = await searchBooks('test', { startIndex: 0, maxResults: 10 });

      expect(result.hasMore).toBe(true);
    });

    it('indicates no more results at end', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: Array(5).fill({ volumeInfo: { title: 'Book' } }),
            totalItems: 15,
          }),
      });

      const result = await searchBooks('test', { startIndex: 10, maxResults: 10 });

      expect(result.hasMore).toBe(false);
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await searchBooks('test');

      expect(result.books).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.totalItems).toBe(0);
    });
  });
});
