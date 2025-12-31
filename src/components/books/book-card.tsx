// Book Card Component
// Displays a book in list/grid view with cover, title, author, and metadata

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, CheckCircle } from 'lucide-react';
import type { Book, Genre, Series } from '@/lib/types';

// Maximum number of genre badges to show
const MAX_GENRE_BADGES = 3;

// Maximum series name length before truncation
const MAX_SERIES_NAME_LENGTH = 20;

type BookCardProps = {
  book: Book;
  genres?: Record<string, Genre>;
  series?: Record<string, Series>;
  searchQuery?: string;
};

/**
 * Get the reading status of a book based on its reads array
 */
function getBookStatus(book: Book): 'want-to-read' | 'reading' | 'finished' | null {
  const reads = book.reads || [];
  if (reads.length === 0) return 'want-to-read';

  const latestRead = reads[reads.length - 1];
  if (latestRead.finishedAt) return 'finished';
  if (latestRead.startedAt) return 'reading';

  return 'want-to-read';
}

/**
 * Render star rating
 */
function StarRating({ rating }: { rating: number | null | undefined }) {
  if (rating === null || rating === undefined) return null;

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: 'reading' | 'finished' }) {
  const config = {
    reading: {
      icon: BookOpen,
      label: 'Reading',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-700',
    },
    finished: {
      icon: CheckCircle,
      label: 'Finished',
      bgClass: 'bg-green-100',
      textClass: 'text-green-700',
    },
  };

  const { icon: Icon, label, bgClass, textClass } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${bgClass} ${textClass}`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
}

/**
 * Series badge component
 */
function SeriesBadge({
  series,
  position,
}: {
  series: Series;
  position?: number | null;
}) {
  let displayName = series.name;
  if (displayName.length > MAX_SERIES_NAME_LENGTH) {
    displayName = displayName.substring(0, MAX_SERIES_NAME_LENGTH - 1) + '…';
  }

  const positionText = position ? ` #${position}` : '';

  return (
    <Link
      href={`/books?series=${series.id}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
      title={series.name}
    >
      <span>{displayName}{positionText}</span>
    </Link>
  );
}

/**
 * Genre badge component
 */
function GenreBadge({ genre }: { genre: Genre }) {
  // Calculate contrasting text colour
  const textColor = getContrastColor(genre.color);

  return (
    <Link
      href={`/books?genre=${genre.id}`}
      className="inline-block px-2 py-0.5 rounded text-xs transition-opacity hover:opacity-80"
      style={{ backgroundColor: genre.color, color: textColor }}
    >
      {genre.name}
    </Link>
  );
}

/**
 * Calculate contrast colour for text on a background
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Book card component
 */
export function BookCard({ book, genres = {}, series = {}, searchQuery }: BookCardProps) {
  const status = getBookStatus(book);
  const bookSeries = book.seriesId ? series[book.seriesId] : undefined;
  const bookGenres = (book.genres || [])
    .map((id) => genres[id])
    .filter(Boolean)
    .slice(0, MAX_GENRE_BADGES);
  const hasMoreGenres = (book.genres || []).length > MAX_GENRE_BADGES;

  return (
    <Link
      href={`/books/${book.id}`}
      className="book-card group flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all"
    >
      {/* Cover Image */}
      <div className="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={`Cover of ${book.title}`}
            width={80}
            height={112}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <BookOpen className="w-8 h-8 text-white/60" />
        )}
      </div>

      {/* Book Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-sm text-gray-600 mt-0.5 truncate">{book.author}</p>

        {/* Rating */}
        {book.rating && (
          <div className="mt-1">
            <StarRating rating={book.rating} />
          </div>
        )}

        {/* Badges */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {/* Status Badge */}
          {status === 'reading' && <StatusBadge status="reading" />}
          {status === 'finished' && <StatusBadge status="finished" />}

          {/* Series Badge */}
          {bookSeries && (
            <SeriesBadge series={bookSeries} position={book.seriesPosition} />
          )}

          {/* Genre Badges */}
          {bookGenres.map((genre) => (
            <GenreBadge key={genre.id} genre={genre} />
          ))}
          {hasMoreGenres && (
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
              +{(book.genres || []).length - MAX_GENRE_BADGES}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Book card skeleton for loading state
 */
export function BookCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl animate-pulse">
      {/* Cover skeleton */}
      <div className="flex-shrink-0 w-20 h-28 rounded-lg bg-gray-200" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mt-2" />
        <div className="flex gap-1.5 mt-3">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
