/**
 * Home Page - Dashboard with widgets
 * Displays reading stats, currently reading, recently added, and more
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Plus,
  ChevronRight,
  Star,
  CheckCircle,
  Library,
  TrendingUp,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBooks } from '@/lib/repositories/books';
import { getGenres } from '@/lib/repositories/genres';
import { getSeries, createSeriesLookup } from '@/lib/repositories/series';
import type { Book, Genre, Series } from '@/lib/types';

/**
 * Get reading status from book's reads array
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
 * Format timestamp to readable date
 */
function formatDate(timestamp: unknown): string {
  if (!timestamp) return '';
  let date: Date;
  if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    date = (timestamp as { toDate: () => Date }).toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '';
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Book card for widget display
 */
function WidgetBookCard({ book, showRating = false }: { book: Book; showRating?: boolean }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-primary hover:shadow-sm transition-all"
    >
      <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt=""
            width={40}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
            <BookOpen className="w-4 h-4 text-white/60" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{book.title}</p>
        <p className="text-xs text-gray-500 truncate">{book.author}</p>
        {showRating && book.rating != null && book.rating > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= book.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Widget skeleton for loading state
 */
function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
      <div className="space-y-3">
        <div className="h-16 bg-gray-100 rounded" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

/**
 * Welcome Widget - Library stats
 */
function WelcomeWidget({
  totalBooks,
  currentlyReading,
  finishedThisYear,
}: {
  totalBooks: number;
  currentlyReading: number;
  finishedThisYear: number;
}) {
  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Your Library</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-3xl font-bold">{totalBooks}</p>
          <p className="text-sm text-white/80">Books</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{currentlyReading}</p>
          <p className="text-sm text-white/80">Reading</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{finishedThisYear}</p>
          <p className="text-sm text-white/80">This Year</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Currently Reading Widget
 */
function CurrentlyReadingWidget({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" aria-hidden="true" />
            Currently Reading
          </h3>
        </div>
        <div className="text-center py-6">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto" aria-hidden="true" />
          <p className="text-sm text-gray-500 mt-2">No books in progress</p>
          <Link
            href="/books/add"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
          >
            <Plus className="w-4 h-4" />
            Add a book
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" aria-hidden="true" />
          Currently Reading
        </h3>
        <span className="text-xs text-gray-500">{books.length} book{books.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {books.slice(0, 3).map((book) => (
          <WidgetBookCard key={book.id} book={book} />
        ))}
      </div>
      {books.length > 3 && (
        <Link
          href="/books?status=reading"
          className="flex items-center justify-center gap-1 mt-3 text-sm text-primary hover:underline"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/**
 * Recently Added Widget
 */
function RecentlyAddedWidget({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-green-500" aria-hidden="true" />
          Recently Added
        </h3>
      </div>
      <div className="space-y-2">
        {books.slice(0, 3).map((book) => (
          <WidgetBookCard key={book.id} book={book} />
        ))}
      </div>
      {books.length > 3 && (
        <Link
          href="/books?sort=createdAt-desc"
          className="flex items-center justify-center gap-1 mt-3 text-sm text-primary hover:underline"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/**
 * Top Rated Widget
 */
function TopRatedWidget({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" aria-hidden="true" />
          Top Rated
        </h3>
      </div>
      <div className="space-y-2">
        {books.slice(0, 3).map((book) => (
          <WidgetBookCard key={book.id} book={book} showRating />
        ))}
      </div>
      {books.length > 3 && (
        <Link
          href="/books?sort=rating-desc"
          className="flex items-center justify-center gap-1 mt-3 text-sm text-primary hover:underline"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/**
 * Recently Finished Widget
 */
function RecentlyFinishedWidget({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
          Recently Finished
        </h3>
      </div>
      <div className="space-y-2">
        {books.slice(0, 3).map((book) => (
          <WidgetBookCard key={book.id} book={book} showRating />
        ))}
      </div>
      {books.length > 3 && (
        <Link
          href="/books?status=finished"
          className="flex items-center justify-center gap-1 mt-3 text-sm text-primary hover:underline"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/**
 * Series Progress Widget
 */
function SeriesProgressWidget({
  series,
  booksBySeries,
}: {
  series: Series[];
  booksBySeries: Record<string, Book[]>;
}) {
  // Get series with at least one book
  const activeSeries = series.filter((s) => booksBySeries[s.id]?.length > 0);

  if (activeSeries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Library className="w-4 h-4 text-purple-500" aria-hidden="true" />
          Series Progress
        </h3>
      </div>
      <div className="space-y-3">
        {activeSeries.slice(0, 4).map((s) => {
          const booksInSeries = booksBySeries[s.id] || [];
          const totalBooks = s.totalBooks || booksInSeries.length;
          const percentage = totalBooks > 0 ? Math.round((booksInSeries.length / totalBooks) * 100) : 0;
          return (
            <Link
              key={s.id}
              href={`/books?series=${s.id}`}
              className="block p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">{s.name}</span>
                <span className="text-xs text-gray-500">
                  {booksInSeries.length}/{totalBooks}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuthContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);
        const [userBooks, userSeries] = await Promise.all([
          getBooks(user.uid),
          getSeries(user.uid),
        ]);
        setBooks(userBooks);
        setSeries(userSeries);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
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

  // Computed data for widgets
  const {
    currentlyReading,
    recentlyAdded,
    topRated,
    recentlyFinished,
    finishedThisYear,
    booksBySeries,
  } = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const currentlyReading: Book[] = [];
    const finished: Book[] = [];
    let finishedThisYearCount = 0;

    books.forEach((book) => {
      const status = getBookStatus(book);
      if (status === 'reading') {
        currentlyReading.push(book);
      } else if (status === 'finished') {
        finished.push(book);
        // Check if finished this year
        const latestRead = book.reads?.[book.reads.length - 1];
        if (latestRead?.finishedAt) {
          const finishTime =
            typeof latestRead.finishedAt === 'number'
              ? latestRead.finishedAt
              : new Date(latestRead.finishedAt as string).getTime();
          if (finishTime >= startOfYear) {
            finishedThisYearCount++;
          }
        }
      }
    });

    // Recently added (by createdAt)
    const recentlyAdded = [...books]
      .sort((a, b) => {
        const aTime = a.createdAt
          ? typeof a.createdAt === 'number'
            ? a.createdAt
            : 'toMillis' in a.createdAt
              ? a.createdAt.toMillis()
              : 0
          : 0;
        const bTime = b.createdAt
          ? typeof b.createdAt === 'number'
            ? b.createdAt
            : 'toMillis' in b.createdAt
              ? b.createdAt.toMillis()
              : 0
          : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    // Top rated (4+ stars)
    const topRated = books
      .filter((b) => b.rating != null && b.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // Recently finished (by finishedAt)
    const recentlyFinished = finished
      .sort((a, b) => {
        const aRead = a.reads?.[a.reads.length - 1];
        const bRead = b.reads?.[b.reads.length - 1];
        const aTime =
          aRead?.finishedAt
            ? typeof aRead.finishedAt === 'number'
              ? aRead.finishedAt
              : new Date(aRead.finishedAt as string).getTime()
            : 0;
        const bTime =
          bRead?.finishedAt
            ? typeof bRead.finishedAt === 'number'
              ? bRead.finishedAt
              : new Date(bRead.finishedAt as string).getTime()
            : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    // Books by series
    const booksBySeries: Record<string, Book[]> = {};
    books.forEach((book) => {
      if (book.seriesId) {
        if (!booksBySeries[book.seriesId]) {
          booksBySeries[book.seriesId] = [];
        }
        booksBySeries[book.seriesId].push(book);
      }
    });

    return {
      currentlyReading,
      recentlyAdded,
      topRated,
      recentlyFinished,
      finishedThisYear: finishedThisYearCount,
      booksBySeries,
    };
  }, [books]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div id="loading-state" className="max-w-4xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse" />
          </div>
          <WidgetSkeleton />
          <WidgetSkeleton />
          <WidgetSkeleton />
          <WidgetSkeleton />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome to MyShelfControl</h1>
          <p className="text-gray-500 mt-2">
            Track your reading journey and organise your book collection.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard" className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/books/add"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px]"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline">Add Book</span>
        </Link>
      </div>

      {/* Widgets Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Welcome Widget - Full Width */}
        <div className="md:col-span-2">
          <WelcomeWidget
            totalBooks={books.length}
            currentlyReading={currentlyReading.length}
            finishedThisYear={finishedThisYear}
          />
        </div>

        {/* Currently Reading */}
        <CurrentlyReadingWidget books={currentlyReading} />

        {/* Recently Added */}
        <RecentlyAddedWidget books={recentlyAdded} />

        {/* Top Rated */}
        <TopRatedWidget books={topRated} />

        {/* Recently Finished */}
        <RecentlyFinishedWidget books={recentlyFinished} />

        {/* Series Progress - Full Width */}
        {series.length > 0 && (
          <div className="md:col-span-2">
            <SeriesProgressWidget series={series} booksBySeries={booksBySeries} />
          </div>
        )}
      </div>

      {/* Empty State */}
      {books.length === 0 && (
        <div className="text-center py-12 mt-6">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-medium text-gray-900 mt-4">Start Your Collection</h2>
          <p className="text-gray-500 mt-1">
            Add your first book to see your reading stats here.
          </p>
          <Link
            href="/books/add"
            className="inline-flex items-center gap-2 px-6 py-3 mt-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Add Your First Book
          </Link>
        </div>
      )}
    </div>
  );
}
