// Books Page - List and manage user's book collection
'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { BookOpen, Plus, AlertCircle, SlidersHorizontal, Loader2, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
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
  type BookCounts,
} from '@/components/books/filter-panel';
import { getBookStatus, filterBooks, sortBooks } from '@/lib/utils/book-filters';
import type { Book, Genre, Series, BookFilters } from '@/lib/types';

/** Sync settings stored in localStorage */
type SyncSettings = {
  autoRefreshEnabled: boolean;
  hiddenThreshold: number; // seconds before auto-refresh triggers
  cooldownPeriod: number; // minimum seconds between refreshes
};

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoRefreshEnabled: true,
  hiddenThreshold: 60,
  cooldownPeriod: 300,
};

const SYNC_SETTINGS_KEY = 'bookassembly_sync_settings';

/** Load sync settings from localStorage */
function loadSyncSettings(): SyncSettings {
  if (typeof window === 'undefined') return DEFAULT_SYNC_SETTINGS;
  try {
    const stored = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SYNC_SETTINGS;
}

/**
 * Parse sort option string into sortBy and direction
 */
function parseSortOption(option: SortOption): { sortBy: string; direction: 'asc' | 'desc' } {
  const [sortBy, direction] = option.split('-') as [string, 'asc' | 'desc'];
  return { sortBy, direction };
}

/**
 * Parse URL search params into BookFilters
 */
function parseFiltersFromURL(searchParams: URLSearchParams): { filters: BookFilters; sort: SortOption } {
  const filters: BookFilters = {};

  // Parse statuses (comma-separated)
  const statuses = searchParams.get('status');
  if (statuses) {
    filters.statuses = statuses.split(',').filter((s) =>
      ['reading', 'finished', 'want-to-read'].includes(s)
    ) as BookFilters['statuses'];
  }

  // Parse genres (comma-separated)
  const genreIds = searchParams.get('genre');
  if (genreIds) {
    filters.genreIds = genreIds.split(',');
  }

  // Parse series (comma-separated)
  const seriesIds = searchParams.get('series');
  if (seriesIds) {
    filters.seriesIds = seriesIds.split(',');
  }

  // Parse rating
  const rating = searchParams.get('rating');
  if (rating) {
    const minRating = parseInt(rating, 10);
    if (minRating >= 1 && minRating <= 5) {
      filters.minRating = minRating;
    }
  }

  // Parse author
  const author = searchParams.get('author');
  if (author) {
    filters.author = author;
  }

  // Parse sort
  const sortParam = searchParams.get('sort') as SortOption | null;
  const validSorts: SortOption[] = [
    'createdAt-desc', 'createdAt-asc', 'title-asc', 'title-desc',
    'author-asc', 'author-desc', 'rating-desc', 'rating-asc', 'seriesPosition-asc'
  ];
  const sort = sortParam && validSorts.includes(sortParam) ? sortParam : 'createdAt-desc';

  return { filters, sort };
}

/**
 * Build URL search params from filters
 */
function buildURLParams(filters: BookFilters, sort: SortOption): string {
  const params = new URLSearchParams();

  if (filters.statuses && filters.statuses.length > 0) {
    params.set('status', filters.statuses.join(','));
  }
  if (filters.genreIds && filters.genreIds.length > 0) {
    params.set('genre', filters.genreIds.join(','));
  }
  if (filters.seriesIds && filters.seriesIds.length > 0) {
    params.set('series', filters.seriesIds.join(','));
  }
  if (filters.minRating) {
    params.set('rating', String(filters.minRating));
  }
  if (filters.author) {
    params.set('author', filters.author);
  }
  if (sort !== 'createdAt-desc') {
    params.set('sort', sort);
  }

  return params.toString();
}

function BooksPageContent() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-refresh tracking refs
  const hiddenAtRef = useRef<number | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  // Parse initial filters from URL
  const initialState = useMemo(() => parseFiltersFromURL(searchParams), [searchParams]);

  // Filter and sort state
  const [filters, setFilters] = useState<BookFilters>(initialState.filters);
  const [sortValue, setSortValue] = useState<SortOption>(initialState.sort);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Sync URL when filters change (after initial load)
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    const params = buildURLParams(filters, sortValue);
    const newURL = params ? `/books?${params}` : '/books';

    // Use replaceState to avoid cluttering history
    window.history.replaceState(null, '', newURL);
  }, [filters, sortValue, isInitialized]);

  // Infinite scroll state
  const ITEMS_PER_PAGE = 20;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const PULL_THRESHOLD = 80;

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

  // Slice books for infinite scroll (only render visible items)
  const visibleBooks = useMemo(() => {
    return filteredAndSortedBooks.slice(0, visibleCount);
  }, [filteredAndSortedBooks, visibleCount]);

  const hasMoreBooks = visibleCount < filteredAndSortedBooks.length;

  /**
   * Load more books when sentinel comes into view
   */
  const loadMoreBooks = useCallback(() => {
    if (isLoadingMore || !hasMoreBooks) return;

    setIsLoadingMore(true);
    // Small delay to show loading spinner
    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreBooks]);

  // Reset visible count when filters or sort changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters, sortValue]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreBooks && !isLoadingMore) {
          loadMoreBooks();
        }
      },
      { rootMargin: '200px' } // Load more before reaching bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreBooks, isLoadingMore, loadMoreBooks]);

  /**
   * Refresh data from Firestore
   */
  const refreshData = useCallback(async () => {
    if (!user || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const [userBooks, userGenres, userSeries] = await Promise.all([
        getBooks(user.uid),
        getGenres(user.uid),
        getSeries(user.uid),
      ]);
      setBooks(userBooks);
      setGenres(userGenres);
      setSeries(userSeries);
      setVisibleCount(ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [user, isRefreshing]);

  /**
   * Touch handlers for pull-to-refresh
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable pull-to-refresh when at top of page
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY.current === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - pullStartY.current;

    // Only show pull indicator when pulling down
    if (distance > 0 && window.scrollY === 0) {
      // Apply resistance to pull
      const resistedDistance = Math.min(distance * 0.5, PULL_THRESHOLD * 1.5);
      setPullDistance(resistedDistance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullStartY.current === null) return;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      refreshData();
    } else {
      setPullDistance(0);
    }
    pullStartY.current = null;
  }, [pullDistance, isRefreshing, refreshData]);

  /**
   * Calculate faceted book counts for filter options
   * For each filter type, count from books filtered by OTHER filters (not that type)
   * This enables proper disabling of filter options that would yield 0 results
   */
  const bookCounts = useMemo((): BookCounts => {
    // Helper to filter books excluding a specific filter type
    const filterExcluding = (excludeType: 'statuses' | 'genreIds' | 'seriesIds' | 'minRating' | 'author') => {
      const partialFilters = { ...filters };
      delete partialFilters[excludeType];
      return filterBooks(books, partialFilters);
    };

    // Count statuses from books filtered by genre/series/author/rating (not status)
    const booksForStatus = filterExcluding('statuses');
    const statusCounts = { reading: 0, finished: 0 };
    booksForStatus.forEach((book) => {
      const status = getBookStatus(book);
      if (status === 'reading') statusCounts.reading++;
      else if (status === 'finished') statusCounts.finished++;
    });

    // Count genres from books filtered by status/series/author/rating (not genre)
    const booksForGenre = filterExcluding('genreIds');
    const genreCounts: Record<string, number> = {};
    booksForGenre.forEach((book) => {
      (book.genres || []).forEach((genreId) => {
        genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
      });
    });

    // Count series from books filtered by status/genre/author/rating (not series)
    const booksForSeries = filterExcluding('seriesIds');
    const seriesCounts: Record<string, number> = {};
    booksForSeries.forEach((book) => {
      if (book.seriesId) {
        seriesCounts[book.seriesId] = (seriesCounts[book.seriesId] || 0) + 1;
      }
    });

    // Count ratings from books filtered by status/genre/series/author (not rating)
    const booksForRating = filterExcluding('minRating');
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    booksForRating.forEach((book) => {
      if (book.rating && book.rating >= 1) {
        // Count for each minimum rating threshold this book would match
        for (let minRating = 1; minRating <= book.rating; minRating++) {
          ratingCounts[minRating]++;
        }
      }
    });

    // Count authors from books filtered by status/genre/series/rating (not author)
    const booksForAuthor = filterExcluding('author');
    const authorCounts: Record<string, number> = {};
    booksForAuthor.forEach((book) => {
      if (book.author) {
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
      }
    });

    return {
      genres: genreCounts,
      statuses: statusCounts,
      series: seriesCounts,
      ratings: ratingCounts,
      authors: authorCounts,
      total: books.length,
    };
  }, [books, filters]);

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

  // Visibility-based auto-refresh
  // Uses both visibilitychange (for tab switches) and focus (for app switches)
  useEffect(() => {
    if (!user) return;

    const checkAndRefresh = async () => {
      if (!hiddenAtRef.current) return;

      const settings = loadSyncSettings();
      if (!settings.autoRefreshEnabled) {
        hiddenAtRef.current = null;
        return;
      }

      const now = Date.now();
      const hiddenDuration = (now - hiddenAtRef.current) / 1000;
      const timeSinceLastRefresh = (now - lastRefreshRef.current) / 1000;

      if (hiddenDuration >= settings.hiddenThreshold && timeSinceLastRefresh >= settings.cooldownPeriod) {
        try {
          const [userBooks, userGenres, userSeries] = await Promise.all([
            getBooks(user.uid),
            getGenres(user.uid),
            getSeries(user.uid),
          ]);
          setBooks(userBooks);
          setGenres(userGenres);
          setSeries(userSeries);
          setVisibleCount(ITEMS_PER_PAGE);
          lastRefreshRef.current = Date.now();
          showToast('Library refreshed', { type: 'success' });
        } catch (err) {
          console.error('Failed to auto-refresh:', err);
        }
      }

      hiddenAtRef.current = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        checkAndRefresh();
      }
    };

    const handleFocus = () => {
      if (hiddenAtRef.current) {
        checkAndRefresh();
      }
    };

    const handleBlur = () => {
      if (!hiddenAtRef.current) {
        hiddenAtRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, showToast]);

  /**
   * Scroll to top of book list when filters change
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

    // Scroll to top when filter changes
    scrollToTop();
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortValue(newSort);
    scrollToTop();
  };

  const handleReset = () => {
    setFilters({});
    setSortValue('createdAt-desc');
    scrollToTop();
  };

  /**
   * Map filter key to chip colour type
   */
  const getChipType = (key: keyof BookFilters): 'status' | 'genre' | 'series' | 'rating' | 'author' | undefined => {
    switch (key) {
      case 'statuses': return 'status';
      case 'genreIds': return 'genre';
      case 'seriesIds': return 'series';
      case 'minRating': return 'rating';
      case 'author': return 'author';
      default: return undefined;
    }
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
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-10 animate-pulse md:hidden" />
        </div>

        {/* Mobile sort skeleton */}
        <div className="flex gap-2 mb-4 md:hidden">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Books</h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-red-700 dark:text-red-300 font-medium">Error loading books</p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="max-w-6xl mx-auto px-4 pt-6 pb-24"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
          style={{ height: isRefreshing ? PULL_THRESHOLD : pullDistance }}
        >
          <div
            className={`flex items-center gap-2 text-sm text-gray-500 ${
              pullDistance >= PULL_THRESHOLD || isRefreshing ? 'text-primary' : ''
            }`}
          >
            <Loader2
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: isRefreshing
                  ? 'none'
                  : `rotate(${Math.min(pullDistance / PULL_THRESHOLD, 1) * 360}deg)`,
              }}
            />
            <span>
              {isRefreshing
                ? 'Refreshing...'
                : pullDistance >= PULL_THRESHOLD
                  ? 'Release to refresh'
                  : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Mobile Sort & Filter Bar */}
      {books.length > 0 && (
        <div className="flex gap-2 mb-4 md:hidden">
          <button
            id="filter-btn"
            onClick={() => setShowFilterSheet(true)}
            className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
            {hasActiveFilters && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-medium">
                {activeFilterLabels.length}
              </span>
            )}
          </button>
          <MobileSortDropdown value={sortValue} onChange={handleSortChange} hasSeriesFilter={!!(filters.seriesIds && filters.seriesIds.length > 0)} />
        </div>
      )}

      {/* Mobile Active Filter Chips */}
      {hasActiveFilters && activeFilterLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 md:hidden">
          {activeFilterLabels.map(({ label, key, value }, index) => (
            <ActiveFilterChip
              key={`${key}-${value || index}`}
              label={label}
              type={getChipType(key)}
              onRemove={() => removeFilter(key, value)}
            />
          ))}
          {/* Clear All button */}
          {activeFilterLabels.length > 1 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-colors min-h-[36px]"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Page heading (visually hidden, for SEO/accessibility) */}
      <h1 className="sr-only">My Books</h1>

      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Books</h2>
        {books.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hasActiveFilters
              ? `${filteredAndSortedBooks.length} of ${books.length}`
              : `${books.length} ${books.length === 1 ? 'book' : 'books'}`}
          </p>
        )}
      </div>

      {/* Two-Column Layout */}
      <div className="flex gap-4 md:gap-6">
        {/* Desktop Sidebar */}
        {books.length > 0 && (
          <aside className="hidden md:block w-72 flex-shrink-0">
            <FilterSidebar
                genres={genres}
                series={series}
                authors={authors}
                filters={filters}
                sortValue={sortValue}
                bookCounts={bookCounts}
                onFiltersChange={handleFiltersChange}
                onSortChange={handleSortChange}
                onReset={handleReset}
              />
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Books</h2>
            {books.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasActiveFilters
                  ? `Showing ${filteredAndSortedBooks.length} of ${books.length} ${books.length === 1 ? 'book' : 'books'}`
                  : `${books.length} ${books.length === 1 ? 'book' : 'books'}`}
              </p>
            )}
          </div>

          {/* Desktop Active Filter Chips */}
          {hasActiveFilters && activeFilterLabels.length > 0 && (
            <div className="hidden md:flex flex-wrap gap-2 mb-4">
              {activeFilterLabels.map(({ label, key, value }, index) => (
                <ActiveFilterChip
                  key={`${key}-${value || index}`}
                  label={label}
                  type={getChipType(key)}
                  onRemove={() => removeFilter(key, value)}
                />
              ))}
              {/* Clear All button */}
              {activeFilterLabels.length > 1 && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-colors min-h-[36px]"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
          {/* Empty State */}
          {books.length === 0 ? (
            <div id="empty-state" className="text-center py-12 empty-state-animate">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto" aria-hidden="true" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">No books yet</h2>
              <p className="text-gray-500 dark:text-gray-300 mt-1">
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
            <div className="text-center py-12 empty-state-animate">
              <SearchX className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto" aria-hidden="true" />
              <p className="text-gray-500 dark:text-gray-300 mt-3">No books match your filters</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Try adjusting your filters or{' '}
                <button
                  onClick={handleReset}
                  className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  clear all filters
                </button>
              </p>
            </div>
          ) : (
            /* Books List */
            <div id="book-list" className="space-y-4">
              {visibleBooks.map((book, index) => (
                <div key={book.id} className="card-animate">
                  <BookCard
                    book={book}
                    genres={genreLookup}
                    series={seriesLookup}
                    priority={index < 6}
                  />
                </div>
              ))}

              {/* Infinite scroll sentinel and loading indicator */}
              {hasMoreBooks && (
                <div
                  ref={sentinelRef}
                  className="flex items-center justify-center py-8"
                >
                  {isLoadingMore && (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" aria-label="Loading more books" />
                  )}
                </div>
              )}
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
        bookCounts={bookCounts}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />

      {/* Floating Action Button */}
      <Link
        href="/books/add"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center z-30 fab-press"
        aria-label="Add book"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * Books Page with Suspense wrapper for useSearchParams
 */
export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </div>
          <div className="flex gap-6">
            <div className="hidden md:block w-72 flex-shrink-0">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-96 animate-pulse" />
            </div>
            <div className="flex-1 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-24 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <BooksPageContent />
    </Suspense>
  );
}
