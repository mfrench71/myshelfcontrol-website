/**
 * Book Detail Page
 * Displays full book information with cover, metadata, and actions
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Pencil,
  Trash2,
  AlertCircle,
  ChevronRight,
  Library,
  CheckCircle,
  Calendar,
  X,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBook, softDeleteBook, getBooksBySeries } from '@/lib/repositories/books';
import { getGenres, createGenreLookup } from '@/lib/repositories/genres';
import { getSeries } from '@/lib/repositories/series';
import type { Book, Genre, Series } from '@/lib/types';

/**
 * Format a timestamp for display
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

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get the reading status of a book
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
 * Calculate contrast colour for text on a background
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Star rating display
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Delete confirmation modal
 */
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Move to bin confirmation"
    >
      <div
        className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white md:rounded-xl rounded-t-2xl p-6 md:max-w-sm md:w-full animate-slide-up md:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for mobile */}
        <div className="flex justify-center mb-4 md:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <h3 className="text-lg font-semibold mb-2">Move to Bin?</h3>
        <p className="text-gray-500 mb-4">
          This book will be moved to the bin and automatically deleted after 30 days. You can restore it from Settings.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px] disabled:opacity-50"
          >
            {loading ? 'Moving...' : 'Move to Bin'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const { user, loading: authLoading } = useAuthContext();

  const [book, setBook] = useState<Book | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [series, setSeries] = useState<Series | null>(null);
  const [seriesBooks, setSeriesBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const genreLookup = createGenreLookup(genres);

  useEffect(() => {
    async function loadBook() {
      if (!user || !bookId) return;

      try {
        setLoading(true);
        setError(null);

        // Load book and genres in parallel
        const [bookData, userGenres, userSeries] = await Promise.all([
          getBook(user.uid, bookId),
          getGenres(user.uid),
          getSeries(user.uid),
        ]);

        if (!bookData) {
          setError('Book not found');
          setLoading(false);
          return;
        }

        setBook(bookData);
        setGenres(userGenres);

        // Load series info if book has a series
        if (bookData.seriesId) {
          const bookSeries = userSeries.find((s) => s.id === bookData.seriesId);
          if (bookSeries) {
            setSeries(bookSeries);
            // Load other books in the series
            const booksInSeries = await getBooksBySeries(user.uid, bookData.seriesId);
            setSeriesBooks(booksInSeries);
          }
        }
      } catch (err) {
        console.error('Failed to load book:', err);
        setError('Failed to load book. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadBook();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, bookId]);

  const handleDelete = async () => {
    if (!user || !bookId) return;

    setDeleting(true);
    try {
      await softDeleteBook(user.uid, bookId);
      router.push('/books');
    } catch (err) {
      console.error('Failed to delete book:', err);
      setDeleting(false);
    }
  };

  const status = book ? getBookStatus(book) : 'want-to-read';
  const bookGenres = book?.genres
    ?.map((id) => genreLookup[id])
    .filter(Boolean) || [];

  // Loading state
  if (authLoading || loading) {
    return (
      <div id="loading-state" className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
        </div>

        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Cover skeleton */}
          <div className="md:w-72 flex-shrink-0 mb-6 md:mb-0">
            <div className="aspect-[2/3] bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Details skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <Link href="/books" className="mt-2 text-sm text-red-700 underline hover:no-underline inline-block">
              Back to books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li>
                <Link href="/books" className="text-gray-500 hover:text-gray-700">
                  My Books
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 font-medium truncate max-w-[200px]">
                {book.title}
              </li>
            </ol>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link
              href={`/books/${bookId}/edit`}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center justify-center sm:justify-start gap-1 min-h-[44px] min-w-[44px]"
              aria-label="Edit book"
            >
              <Pencil className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm hidden sm:inline">Edit</span>
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600 flex items-center justify-center sm:justify-start gap-1 min-h-[44px] min-w-[44px]"
              aria-label="Delete book"
            >
              <Trash2 className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Book Content */}
      <div id="book-content" className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Left Column: Cover */}
          <div className="md:w-72 flex-shrink-0 mb-6 md:mb-0">
            <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              {book.coverImageUrl ? (
                <Image
                  src={book.coverImageUrl}
                  alt=""
                  width={288}
                  height={432}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                  <BookOpen className="w-16 h-16 text-white/60" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Book Details */}
          <div className="flex-1 space-y-6">
            {/* Title & Author */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{book.title}</h1>
              <Link
                href={`/books?author=${encodeURIComponent(book.author)}`}
                className="inline-flex items-center gap-1 text-lg text-primary mt-1 hover:underline"
              >
                <span>{book.author || 'Unknown author'}</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Rating */}
            {book.rating != null && book.rating > 0 && (
              <div>
                <StarRating rating={book.rating} />
              </div>
            )}

            {/* Reading Status */}
            {status !== 'want-to-read' && (
              <div>
                {status === 'reading' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    Currently Reading
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    Finished
                  </span>
                )}
              </div>
            )}

            {/* Genres */}
            {bookGenres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bookGenres.map((genre) => (
                  <span
                    key={genre.id}
                    className="inline-block px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: genre.color,
                      color: getContrastColor(genre.color),
                    }}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Series */}
            {series && (
              <div>
                <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-base">
                  <Library className="w-4 h-4" aria-hidden="true" />
                  {series.name}
                  {book.seriesPosition && ` #${book.seriesPosition}`}
                </h2>
                {seriesBooks.length > 1 && (
                  <div className="space-y-1">
                    {seriesBooks.slice(0, 5).map((seriesBook) => (
                      <Link
                        key={seriesBook.id}
                        href={`/books/${seriesBook.id}`}
                        className={`block text-sm py-1 px-2 rounded hover:bg-gray-100 ${
                          seriesBook.id === bookId ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600'
                        }`}
                      >
                        {seriesBook.seriesPosition && `#${seriesBook.seriesPosition} `}
                        {seriesBook.title}
                      </Link>
                    ))}
                    {seriesBooks.length > 5 && (
                      <Link
                        href={`/books?series=${series.id}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        View all {seriesBooks.length} in series
                        <ChevronRight className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {book.isbn && (
                  <div>
                    <dt className="text-gray-500">ISBN</dt>
                    <dd className="font-medium text-gray-900">{book.isbn}</dd>
                  </div>
                )}
                {book.pageCount != null && book.pageCount > 0 && (
                  <div>
                    <dt className="text-gray-500">Pages</dt>
                    <dd className="font-medium text-gray-900">{book.pageCount}</dd>
                  </div>
                )}
                {book.physicalFormat && (
                  <div>
                    <dt className="text-gray-500">Format</dt>
                    <dd className="font-medium text-gray-900 capitalize">{book.physicalFormat}</dd>
                  </div>
                )}
                {book.publisher && (
                  <div>
                    <dt className="text-gray-500">Publisher</dt>
                    <dd className="font-medium text-gray-900">{book.publisher}</dd>
                  </div>
                )}
                {book.publishedDate && (
                  <div>
                    <dt className="text-gray-500">Published</dt>
                    <dd className="font-medium text-gray-900">{book.publishedDate}</dd>
                  </div>
                )}
                {book.createdAt && (
                  <div>
                    <dt className="text-gray-500">Added</dt>
                    <dd className="font-medium text-gray-900">{formatDate(book.createdAt)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Reading History */}
            {book.reads && book.reads.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  Reading History
                </h2>
                <div className="space-y-2">
                  {book.reads.map((read, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {read.startedAt && (
                        <span>Started: {formatDate(read.startedAt)}</span>
                      )}
                      {read.finishedAt && (
                        <span className="ml-4">Finished: {formatDate(read.finishedAt)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {book.notes && (
              <div>
                <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-base">
                  Notes
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                  {book.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
