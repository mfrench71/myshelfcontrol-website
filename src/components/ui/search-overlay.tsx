/**
 * Search Overlay Component
 * Full-screen search with live filtering
 */
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  X,
  ArrowLeft,
  BookOpen,
  Book as BookIcon,
  Clock,
  Loader2,
  Star,
  Library,
  CheckCircle,
} from 'lucide-react';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBooks } from '@/lib/repositories/books';
import { getSeries } from '@/lib/repositories/series';
import type { Book, Series } from '@/lib/types';

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Normalise text for search matching
 */
function normaliseText(text: string | undefined | null): string {
  if (!text) return '';
  return text.toLowerCase().trim();
}

/**
 * Get recent searches from localStorage
 */
function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a search to recent searches
 */
function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;
  if (query.length < 2) return;

  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((s) => s !== query);
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear all recent searches
 */
function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Highlight matching text in a string
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;

  const normalised = normaliseText(text);
  const normalisedQuery = normaliseText(query);
  const index = normalised.indexOf(normalisedQuery);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{match}</mark>
      {after}
    </>
  );
}

/**
 * Get book reading status from reads array
 */
function getBookStatus(book: Book): 'reading' | 'finished' | 'want-to-read' {
  if (!book.reads || book.reads.length === 0) return 'want-to-read';
  const lastRead = book.reads[book.reads.length - 1];
  if (lastRead.finishedAt) return 'finished';
  if (lastRead.startedAt) return 'reading';
  return 'want-to-read';
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { user } = useAuthContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Lock body scroll when open
  useBodyScrollLock(isOpen);

  // Load books and series when overlay opens
  useEffect(() => {
    if (!isOpen || !user) return;

    async function loadData() {
      setLoading(true);
      try {
        const [userBooks, userSeries] = await Promise.all([
          getBooks(user!.uid),
          getSeries(user!.uid),
        ]);
        setBooks(userBooks);
        setSeries(userSeries);
      } catch (err) {
        console.error('Failed to load search data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    setRecentSearches(getRecentSearches());
  }, [isOpen, user]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle close
  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Create series lookup
  const seriesLookup = useMemo(() => {
    const lookup: Record<string, Series> = {};
    series.forEach((s) => {
      lookup[s.id] = s;
    });
    return lookup;
  }, [series]);

  // Filter books based on query
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];

    const q = normaliseText(query);

    return books.filter((book) => {
      // Search title
      if (normaliseText(book.title).includes(q)) return true;
      // Search author
      if (normaliseText(book.author).includes(q)) return true;
      // Search publisher
      if (normaliseText(book.publisher).includes(q)) return true;
      // Search notes
      if (normaliseText(book.notes).includes(q)) return true;
      // Search ISBN
      if (book.isbn && book.isbn.includes(query)) return true;
      // Search series name
      if (book.seriesId) {
        const s = seriesLookup[book.seriesId];
        if (s && normaliseText(s.name).includes(q)) return true;
      }
      return false;
    });
  }, [books, query, seriesLookup]);

  // Handle selecting a search result
  const handleSelectResult = () => {
    if (query.length >= 2) {
      saveRecentSearch(query);
    }
    handleClose();
  };

  // Handle selecting a recent search
  const handleSelectRecent = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Search Header */}
      <div className="border-b border-gray-200 p-4 animate-fade-in flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="p-2.5 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label="Close search"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Search Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : query.length < 2 ? (
          /* Initial State or Recent Searches */
          recentSearches.length > 0 ? (
            <div className="p-4 max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Recent searches</h3>
                <button
                  onClick={() => {
                    clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectRecent(search)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left transition-colors"
                  >
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 truncate">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Empty initial state */
            <div className="p-4 max-w-6xl mx-auto w-full">
              <div className="py-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
                <p className="text-gray-500 mt-3">Search your library</p>
                <p className="text-gray-400 text-sm mt-1">
                  Find books by title, author, ISBN, series, notes or publisher
                </p>
              </div>
            </div>
          )
        ) : results.length === 0 ? (
          /* No Results */
          <div className="p-4 max-w-6xl mx-auto w-full">
            <div className="py-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
              <p className="text-gray-500 mt-3">No books found for &quot;{query}&quot;</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
            </div>
          </div>
        ) : (
          /* Search Results */
          <div className="p-4 space-y-3 max-w-6xl mx-auto w-full">
            <div className="space-y-3">
              {results.map((book, index) => {
                const seriesData = book.seriesId ? seriesLookup[book.seriesId] : null;
                const status = getBookStatus(book);
                return (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    onClick={handleSelectResult}
                    className="flex gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md active:scale-[0.99] transition-all animate-fade-in"
                    style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
                  >
                    <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {book.coverImageUrl ? (
                        <Image
                          src={book.coverImageUrl}
                          alt=""
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <BookIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {highlightMatch(book.title || 'Untitled', query)}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {highlightMatch(book.author || 'Unknown author', query)}
                      </p>
                      {/* Status and Series badges */}
                      {(status !== 'want-to-read' || seriesData) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {status === 'reading' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                              <BookOpen className="w-3 h-3" aria-hidden="true" />
                              <span>Reading</span>
                            </span>
                          )}
                          {status === 'finished' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" aria-hidden="true" />
                              <span>Finished</span>
                            </span>
                          )}
                          {seriesData && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                              <Library className="w-3 h-3" aria-hidden="true" />
                              <span>
                                {seriesData.name.length > 20
                                  ? seriesData.name.substring(0, 19) + '…'
                                  : seriesData.name}
                                {book.seriesPosition && ` #${book.seriesPosition}`}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                      {book.rating != null && book.rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= book.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
