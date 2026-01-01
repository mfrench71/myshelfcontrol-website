/**
 * Book Detail Page
 * Displays full book information with cover, metadata, and actions
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import { BottomSheet } from '@/components/ui/modal';
import Link from 'next/link';
import Image from 'next/image';
import { BookCover } from '@/components/ui/book-cover';
import {
  BookOpen,
  Book as BookIcon,
  Pencil,
  Trash2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Library,
  CheckCircle,
  Calendar,
  Images,
  Play,
  RotateCcw,
  Loader2,
  Star,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { getBook, softDeleteBook, getBooksBySeries, updateBook } from '@/lib/repositories/books';
import { getGenres, createGenreLookup } from '@/lib/repositories/genres';
import { getSeries, deleteSeries } from '@/lib/repositories/series';
import { Lightbox } from '@/components/lightbox';
import type { Book, Genre, Series, BookImage } from '@/lib/types';

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
        <Star
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Delete confirmation modal
 * Shows option to also delete empty series when this is the last book
 */
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  isLastBookInSeries,
  seriesName,
  deleteSeriesChecked,
  onDeleteSeriesChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  isLastBookInSeries: boolean;
  seriesName: string | null;
  deleteSeriesChecked: boolean;
  onDeleteSeriesChange: (checked: boolean) => void;
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Move to Bin"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Move to Bin?</h3>
        <p className="text-gray-500 mb-4">
          This book will be moved to the bin and automatically deleted after 30 days. You can restore it from Settings.
        </p>

        {/* Series deletion option - shown when last book in series */}
        {isLastBookInSeries && seriesName && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteSeriesChecked}
                onChange={(e) => onDeleteSeriesChange(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div>
                <span className="font-medium text-purple-900">Also delete the empty series</span>
                <p className="text-purple-700 text-sm mt-0.5">
                  &ldquo;{seriesName}&rdquo; will become empty
                </p>
              </div>
            </label>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Moving...' : 'Move to Bin'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [series, setSeries] = useState<Series | null>(null);
  const [seriesBooks, setSeriesBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSeriesChecked, setDeleteSeriesChecked] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Lock body scroll when modal/lightbox is open
  useBodyScrollLock(showDeleteModal || lightboxOpen);

  /**
   * Handle starting to read a book
   */
  const handleStartReading = async () => {
    if (!user || !book) return;

    setUpdatingStatus(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newReads = [...(book.reads || []), { startedAt: today.getTime(), finishedAt: null }];

      await updateBook(user.uid, book.id, { reads: newReads });
      setBook({ ...book, reads: newReads });
      showToast('Started reading!', { type: 'success' });
    } catch (err) {
      console.error('Failed to update reading status:', err);
      showToast('Failed to update status', { type: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  /**
   * Handle marking a book as finished
   */
  const handleMarkFinished = async () => {
    if (!user || !book || !book.reads || book.reads.length === 0) return;

    setUpdatingStatus(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newReads = [...book.reads];
      const lastRead = { ...newReads[newReads.length - 1], finishedAt: today.getTime() };
      newReads[newReads.length - 1] = lastRead;

      await updateBook(user.uid, book.id, { reads: newReads });
      setBook({ ...book, reads: newReads });
      showToast('Marked as finished!', { type: 'success' });
    } catch (err) {
      console.error('Failed to update reading status:', err);
      showToast('Failed to update status', { type: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  /**
   * Handle starting a re-read
   */
  const handleStartReread = async () => {
    if (!user || !book) return;

    setUpdatingStatus(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newReads = [...(book.reads || []), { startedAt: today.getTime(), finishedAt: null }];

      await updateBook(user.uid, book.id, { reads: newReads });
      setBook({ ...book, reads: newReads });
      showToast('Started re-read!', { type: 'success' });
    } catch (err) {
      console.error('Failed to start re-read:', err);
      showToast('Failed to start re-read', { type: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const genreLookup = createGenreLookup(genres);

  // Prepare images for lightbox (cover + uploaded images)
  const allImages = (() => {
    const imgs: { url: string; caption?: string }[] = [];

    // Add cover image first if available
    if (book?.coverImageUrl) {
      imgs.push({ url: book.coverImageUrl, caption: 'Cover' });
    }

    // Add uploaded images
    if (book?.images && book.images.length > 0) {
      book.images.forEach((img, i) => {
        imgs.push({
          url: img.url,
          caption: img.caption || `Image ${i + 1}`,
        });
      });
    }

    return imgs;
  })();

  /**
   * Open lightbox at specified index
   */
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

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
    if (!user || !bookId || !book) return;

    setDeleting(true);
    try {
      // Soft-delete the book
      await softDeleteBook(user.uid, bookId);

      // Also delete the series if checked and this was the last book
      let seriesDeletedOk = false;
      if (deleteSeriesChecked && book.seriesId && seriesBooks.length === 1) {
        try {
          await deleteSeries(user.uid, book.seriesId);
          seriesDeletedOk = true;
        } catch (seriesErr) {
          console.error('Failed to delete series:', seriesErr);
          // Continue anyway - book was deleted successfully
        }
      }

      // Show appropriate toast
      if (deleteSeriesChecked && book.seriesId && seriesBooks.length === 1) {
        if (seriesDeletedOk) {
          showToast('Book and series moved to bin', { type: 'success' });
        } else {
          showToast('Book moved to bin (series deletion failed)', { type: 'info' });
        }
      } else {
        showToast('Book moved to bin', { type: 'success' });
      }

      router.push('/books');
    } catch (err) {
      console.error('Failed to delete book:', err);
      showToast('Error moving book to bin', { type: 'error' });
      setDeleting(false);
    }
  };

  // Check if this is the last book in the series
  const isLastBookInSeries = !!(book?.seriesId && seriesBooks.length === 1);

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
              <li className="text-gray-900 font-medium truncate max-w-[150px] sm:max-w-[250px] md:max-w-[400px] lg:max-w-none">
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
          {/* Left Column: Cover and Images */}
          <div className="md:w-72 flex-shrink-0 mb-6 md:mb-0 space-y-4">
            {/* Main Cover */}
            <button
              type="button"
              onClick={() => allImages.length > 0 && openLightbox(0)}
              className={`aspect-[2/3] w-full bg-gray-100 rounded-lg overflow-hidden shadow-lg ${
                allImages.length > 0 ? 'cursor-zoom-in hover:shadow-xl transition-shadow' : ''
              }`}
              disabled={allImages.length === 0}
              aria-label={allImages.length > 0 ? 'View full-size image' : undefined}
            >
              <BookCover
                src={book.coverImageUrl}
                width={288}
                height={432}
                priority
                className="w-full h-full"
              />
            </button>

            {/* Additional Images Gallery */}
            {book.images && book.images.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Images className="w-4 h-4" aria-hidden="true" />
                  Gallery ({book.images.length} image{book.images.length !== 1 ? 's' : ''})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {book.images.map((img, index) => {
                    // Lightbox index is +1 because cover is at index 0
                    const lightboxIdx = book.coverImageUrl ? index + 1 : index;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => openLightbox(lightboxIdx)}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in hover:ring-2 hover:ring-primary transition-all group"
                        aria-label={`View image ${index + 1}`}
                      >
                        <Image
                          src={img.url}
                          alt=""
                          width={100}
                          height={100}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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

            {/* Reading Status with Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Badge */}
              {status === 'reading' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Currently Reading
                </span>
              )}
              {status === 'finished' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  Finished
                </span>
              )}

              {/* Quick Action Buttons */}
              {status === 'want-to-read' && (
                <button
                  onClick={handleStartReading}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  )}
                  Start Reading
                </button>
              )}
              {status === 'reading' && (
                <button
                  onClick={handleMarkFinished}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  )}
                  Mark as Finished
                </button>
              )}
              {status === 'finished' && (
                <button
                  onClick={handleStartReread}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  )}
                  Start Re-read
                </button>
              )}
            </div>

            {/* Genres */}
            {bookGenres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bookGenres.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/books?genre=${genre.id}`}
                    className="inline-block px-3 py-1 rounded-full text-sm genre-badge-link"
                    style={{
                      backgroundColor: genre.color,
                      color: getContrastColor(genre.color),
                    }}
                  >
                    {genre.name}
                  </Link>
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
                    {seriesBooks.slice(0, 5).map((seriesBook) => {
                      const isCurrent = seriesBook.id === bookId;
                      const displayText = seriesBook.seriesPosition
                        ? `#${seriesBook.seriesPosition} ${seriesBook.title}`
                        : seriesBook.title;

                      if (isCurrent) {
                        return (
                          <div
                            key={seriesBook.id}
                            className="flex items-center gap-2 text-sm py-1 text-primary font-medium"
                          >
                            <BookOpen className="w-4 h-4" aria-hidden="true" />
                            <span>{displayText}</span>
                            <span className="text-xs text-gray-400">(viewing)</span>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={seriesBook.id}
                          href={`/books/${seriesBook.id}`}
                          className="flex items-center gap-2 text-sm py-1 text-gray-700 hover:text-primary"
                        >
                          <BookIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                          <span>{displayText}</span>
                        </Link>
                      );
                    })}
                    <Link
                      href={`/books?series=${series.id}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                    >
                      View all in series
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
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
                {book.updatedAt && (
                  <div>
                    <dt className="text-gray-500">Modified</dt>
                    <dd className="font-medium text-gray-900">{formatDate(book.updatedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Reading History */}
            {book.reads && book.reads.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Reading History
                </h2>
                <div className="space-y-2">
                  {book.reads.map((read, index) => {
                    const startDate = read.startedAt ? formatDate(read.startedAt) : null;
                    const endDate = read.finishedAt ? formatDate(read.finishedAt) : null;
                    const status = endDate ? 'Finished' : 'In progress';

                    return (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                        <span>
                          {startDate}
                          {endDate ? ` – ${endDate}` : ` - ${status}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {book.notes && (
              <div>
                <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-base">
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  Notes
                </h2>
                <div className="text-sm text-gray-600 whitespace-pre-wrap">
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
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteSeriesChecked(false);
        }}
        onConfirm={handleDelete}
        loading={deleting}
        isLastBookInSeries={isLastBookInSeries}
        seriesName={series?.name || null}
        deleteSeriesChecked={deleteSeriesChecked}
        onDeleteSeriesChange={setDeleteSeriesChecked}
      />

      {/* Lightbox for viewing images */}
      <Lightbox
        images={allImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
