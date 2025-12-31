// Books Page - List and manage user's book collection
'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, AlertCircle, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBooks } from '@/lib/repositories/books';
import { getGenres, createGenreLookup } from '@/lib/repositories/genres';
import { getSeries, createSeriesLookup } from '@/lib/repositories/series';
import { BookCard, BookCardSkeleton } from '@/components/books/book-card';
import {
  FilterSidebar,
  FilterSidebarSkeleton,
  MobileSortDropdown,
  FilterBottomSheet,
  ActiveFilterChip,
  type SortOption,
} from '@/components/books/filter-panel';
import type { Book, Genre, Series, BookFilters } from '@/lib/types';

/**
 * Parse sort option string into sortBy and direction
 */
function parseSortOption(option: SortOption): { sortBy: string; direction: 'asc' | 'desc' } {
  const [sortBy, direction] = option.split('-') as [string, 'asc' | 'desc'];
  return { sortBy, direction };
}

/**
 * Get the reading status of a book based on its reads array
 */
function getBookStatus(book: Book): 'want-to-read' | 'reading' | 'finished' {
  const reads = book.reads || [];
  if (reads.length === 0) return 'want-to-read';

  const latestRead = reads[reads.length - 1];
  if (latestRead.finishedAt) return 'finished';
  if (latestRead.startedAt) return 'reading';

  return 'want-to-read';
}

/**
 * Filter books based on active filters (multi-select for status, genre, series)
 */
function filterBooks(books: Book[], filters: BookFilters): Book[] {
  return books.filter((book) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = book.title.toLowerCase().includes(searchLower);
      const matchesAuthor = book.author.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesAuthor) return false;
    }

    // Status filter (multi-select: book must match ANY selected status)
    if (filters.statuses && filters.statuses.length > 0) {
      const bookStatus = getBookStatus(book);
      if (!filters.statuses.includes(bookStatus)) return false;
    }

    // Genre filter (multi-select: book must have ANY selected genre)
    if (filters.genreIds && filters.genreIds.length > 0) {
      const bookGenres = book.genres || [];
      const hasMatchingGenre = filters.genreIds.some((genreId) => bookGenres.includes(genreId));
      if (!hasMatchingGenre) return false;
    }

    // Series filter (multi-select: book must be in ANY selected series)
    if (filters.seriesIds && filters.seriesIds.length > 0) {
      if (!book.seriesId || !filters.seriesIds.includes(book.seriesId)) return false;
    }

    // Rating filter
    if (filters.minRating) {
      if (!book.rating || book.rating < filters.minRating) return false;
    }

    // Author filter
    if (filters.author) {
      if (book.author.toLowerCase() !== filters.author.toLowerCase()) return false;
    }

    return true;
  });
}

/**
 * Sort books based on sort options
 */
function sortBooks(
  books: Book[],
  sortBy: string,
  direction: 'asc' | 'desc'
): Book[] {
  const sorted = [...books].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'author':
        comparison = a.author.localeCompare(b.author);
        break;
      case 'rating':
        // Books without rating go to the end
        if (!a.rating && !b.rating) comparison = 0;
        else if (!a.rating) comparison = 1;
        else if (!b.rating) comparison = -1;
        else comparison = a.rating - b.rating;
        break;
      case 'seriesPosition':
        // Books without position go to the end
        const aPos = a.seriesPosition ?? Number.MAX_SAFE_INTEGER;
        const bPos = b.seriesPosition ?? Number.MAX_SAFE_INTEGER;
        comparison = aPos - bPos;
        break;
      case 'createdAt':
        const aTime = a.createdAt
          ? typeof a.createdAt === 'number'
            ? a.createdAt
            : 'toMillis' in a.createdAt
              ? a.createdAt.toMillis()
              : new Date(a.createdAt).getTime()
          : 0;
        const bTime = b.createdAt
          ? typeof b.createdAt === 'number'
            ? b.createdAt
            : 'toMillis' in b.createdAt
              ? b.createdAt.toMillis()
              : new Date(b.createdAt).getTime()
          : 0;
        comparison = aTime - bTime;
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export default function BooksPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [filters, setFilters] = useState<BookFilters>({});
  const [sortValue, setSortValue] = useState<SortOption>('createdAt-desc');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Create lookup maps for genres and series
  const genreLookup = useMemo(() => createGenreLookup(genres), [genres]);
  const seriesLookup = useMemo(() => createSeriesLookup(series), [series]);

  // Extract unique authors from books, sorted alphabetically
  const authors = useMemo(() => {
    const authorSet = new Set<string>();
    books.forEach((book) => {
      if (book.author) {
        authorSet.add(book.author);
      }
    });
    return Array.from(authorSet).sort((a, b) => a.localeCompare(b));
  }, [books]);

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    const { sortBy, direction } = parseSortOption(sortValue);
    const filtered = filterBooks(books, filters);
    return sortBooks(filtered, sortBy, direction);
  }, [books, filters, sortValue]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Load books, genres, and series in parallel
        const [userBooks, userGenres, userSeries] = await Promise.all([
          getBooks(user.uid),
          getGenres(user.uid),
          getSeries(user.uid),
        ]);

        setBooks(userBooks);
        setGenres(userGenres);
        setSeries(userSeries);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load your books. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleFiltersChange = (newFilters: BookFilters) => {
    setFilters(newFilters);

    // Auto-switch to series order when selecting a series filter (any series)
    const hadSeries = filters.seriesIds && filters.seriesIds.length > 0;
    const hasSeries = newFilters.seriesIds && newFilters.seriesIds.length > 0;
    if (hasSeries && !hadSeries) {
      setSortValue('seriesPosition-asc');
    }
    // Switch away from series order when clearing series filter
    else if (!hasSeries && sortValue === 'seriesPosition-asc') {
      setSortValue('createdAt-desc');
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortValue(newSort);
  };

  const handleReset = () => {
    setFilters({});
    setSortValue('createdAt-desc');
  };

  // Get active filter labels for chips (with value for multi-select removal)
  const getActiveFilterLabels = (): { label: string; key: keyof BookFilters; value?: string }[] => {
    const labels: { label: string; key: keyof BookFilters; value?: string }[] = [];

    // Status filters
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach((status) => {
        const label = status === 'reading' ? 'Reading' : status === 'finished' ? 'Finished' : 'To Read';
        labels.push({ label, key: 'statuses', value: status });
      });
    }

    // Genre filters
    if (filters.genreIds && filters.genreIds.length > 0) {
      filters.genreIds.forEach((genreId) => {
        const genre = genres.find((g) => g.id === genreId);
        if (genre) labels.push({ label: genre.name, key: 'genreIds', value: genreId });
      });
    }

    // Series filters
    if (filters.seriesIds && filters.seriesIds.length > 0) {
      filters.seriesIds.forEach((seriesId) => {
        const s = series.find((s) => s.id === seriesId);
        if (s) labels.push({ label: s.name, key: 'seriesIds', value: seriesId });
      });
    }

    if (filters.minRating) {
      labels.push({ label: `${filters.minRating}+ Stars`, key: 'minRating' });
    }
    if (filters.author) {
      labels.push({ label: filters.author, key: 'author' });
    }

    return labels;
  };

  const removeFilter = (key: keyof BookFilters, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      // Handle array filters (remove specific value)
      if (key === 'statuses' && value && prev.statuses) {
        newFilters.statuses = prev.statuses.filter((s) => s !== value);
        if (newFilters.statuses.length === 0) delete newFilters.statuses;
      } else if (key === 'genreIds' && value && prev.genreIds) {
        newFilters.genreIds = prev.genreIds.filter((g) => g !== value);
        if (newFilters.genreIds.length === 0) delete newFilters.genreIds;
      } else if (key === 'seriesIds' && value && prev.seriesIds) {
        newFilters.seriesIds = prev.seriesIds.filter((s) => s !== value);
        if (newFilters.seriesIds.length === 0) delete newFilters.seriesIds;
      } else {
        delete newFilters[key];
      }

      return newFilters;
    });
  };

  const hasActiveFilters =
    (filters.statuses && filters.statuses.length > 0) ||
    (filters.genreIds && filters.genreIds.length > 0) ||
    (filters.seriesIds && filters.seriesIds.length > 0) ||
    filters.minRating ||
    filters.author;
  const activeFilterLabels = getActiveFilterLabels();

  // Show loading state
  if (authLoading || loading) {
    return (
      <div id="loading" className="max-w-6xl mx-auto px-4 py-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-10 animate-pulse md:hidden" />
        </div>

        {/* Mobile sort skeleton */}
        <div className="flex gap-2 mb-4 md:hidden">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Desktop sidebar skeleton */}
          <aside className="hidden md:block w-72 flex-shrink-0">
            <FilterSidebarSkeleton />
          </aside>

          {/* Books skeleton */}
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-red-700 font-medium">Error loading books</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
        {/* Desktop Add button - hidden on mobile, FAB is used there */}
        <Link
          href="/books/add"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px]"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Add Book</span>
        </Link>
      </div>

      {/* Mobile Sort & Filter Bar */}
      {books.length > 0 && (
        <div className="flex gap-2 mb-4 md:hidden">
          <MobileSortDropdown value={sortValue} onChange={handleSortChange} hasSeriesFilter={!!(filters.seriesIds && filters.seriesIds.length > 0)} />
          <button
            id="filter-btn"
            onClick={() => setShowFilterSheet(true)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-colors min-w-[44px] min-h-[44px] ${
              hasActiveFilters
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            {hasActiveFilters && (
              <span className="text-sm font-medium">{activeFilterLabels.length}</span>
            )}
          </button>
        </div>
      )}

      {/* Active Filter Chips (Mobile) */}
      {hasActiveFilters && activeFilterLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 md:hidden">
          {activeFilterLabels.map(({ label, key, value }, index) => (
            <ActiveFilterChip
              key={`${key}-${value || index}`}
              label={label}
              onRemove={() => removeFilter(key, value)}
            />
          ))}
        </div>
      )}

      {/* Book count */}
      {books.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          {hasActiveFilters ? (
            <>
              Showing {filteredAndSortedBooks.length} of {books.length}{' '}
              {books.length === 1 ? 'book' : 'books'}
            </>
          ) : (
            <>
              {books.length} {books.length === 1 ? 'book' : 'books'} in your library
            </>
          )}
        </p>
      )}

      {/* Two-Column Layout */}
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        {books.length > 0 && (
          <aside className="hidden md:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                genres={genres}
                series={series}
                authors={authors}
                filters={filters}
                sortValue={sortValue}
                onFiltersChange={handleFiltersChange}
                onSortChange={handleSortChange}
                onReset={handleReset}
              />
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Empty State */}
          {books.length === 0 ? (
            <div id="empty-state" className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
              <h2 className="text-lg font-medium text-gray-900 mt-4">No books yet</h2>
              <p className="text-gray-500 mt-1">
                Start building your library by adding your first book.
              </p>
              <Link
                href="/books/add"
                className="inline-flex items-center gap-2 px-6 py-3 mt-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px]"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                Add Your First Book
              </Link>
            </div>
          ) : filteredAndSortedBooks.length === 0 ? (
            /* No results after filtering */
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
              <p className="text-gray-500 mt-3">No books match your filters</p>
              <button
                onClick={handleReset}
                className="mt-4 text-primary hover:text-primary-dark underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* Books List */
            <div id="book-list" className="space-y-4">
              {filteredAndSortedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  genres={genreLookup}
                  series={seriesLookup}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        genres={genres}
        series={series}
        authors={authors}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />

      {/* Floating Action Button (Mobile) */}
      <Link
        href="/books/add"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center transition-colors md:hidden z-30"
        aria-label="Add book"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </Link>
    </div>
  );
}
