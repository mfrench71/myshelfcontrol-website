// Book Card Component
// Displays a book in list view with cover, title, author, and metadata

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, CheckCircle, Library, Calendar } from 'lucide-react';
import type { Book, Genre, Series, FirestoreTimestamp } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Format a Firestore timestamp to a short date string
 * @param timestamp - Firestore timestamp, Date, or number
 * @returns Formatted date string (e.g., "15 Dec 2024")
 */
function formatShortDate(timestamp: FirestoreTimestamp | undefined): string | null {
  if (!timestamp) return null;

  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return null;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Maximum number of genre badges to show
const MAX_GENRE_BADGES = 3;

// Maximum series name length before truncation
const MAX_SERIES_NAME_LENGTH = 20;

type BookCardProps = {
  book: Book;
  genres?: Record<string, Genre>;
  series?: Record<string, Series>;
};

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
 * Status badge component (span, not link)
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
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${bgClass} ${textClass}`}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/**
 * Series badge component (span, not link - avoids nested anchor)
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
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700"
      title={series.name}
    >
      <Library className="w-3 h-3" aria-hidden="true" />
      <span>
        {displayName}
        {positionText}
      </span>
    </span>
  );
}

/**
 * Genre badge component (span, not link - avoids nested anchor)
 */
function GenreBadge({ genre }: { genre: Genre }) {
  const textColor = getContrastColor(genre.color);

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs"
      style={{ backgroundColor: genre.color, color: textColor }}
    >
      {genre.name}
    </span>
  );
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
 * Book card component - matches old site layout
 */
export function BookCard({ book, genres = {}, series = {} }: BookCardProps) {
  const status = getBookStatus(book);
  const bookSeries = book.seriesId ? series[book.seriesId] : undefined;
  const bookGenres = (book.genres || [])
    .map((id) => genres[id])
    .filter(Boolean)
    .slice(0, MAX_GENRE_BADGES);
  const hasMoreGenres = (book.genres || []).length > MAX_GENRE_BADGES;
  const dateAdded = formatShortDate(book.createdAt);

  // Status and series badges on same line
  const hasTopBadges = status === 'reading' || status === 'finished' || bookSeries;

  return (
    <Link
      href={`/books/${book.id}`}
      className="book-card flex gap-4 p-3 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all"
    >
      {/* Cover Image */}
      <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden shadow-cover">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt=""
            width={64}
            height={96}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white/80" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Book Details */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>

        {/* Author */}
        <p className="text-sm text-gray-500 truncate">
          {book.author || 'Unknown author'}
        </p>

        {/* Date Added */}
        {dateAdded && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            <span>Added {dateAdded}</span>
          </p>
        )}

        {/* Status + Series Badges */}
        {hasTopBadges && (
          <div className="flex flex-wrap gap-1 mt-1">
            {status === 'reading' && <StatusBadge status="reading" />}
            {status === 'finished' && <StatusBadge status="finished" />}
            {bookSeries && (
              <SeriesBadge series={bookSeries} position={book.seriesPosition} />
            )}
          </div>
        )}

        {/* Rating */}
        {book.rating != null && book.rating > 0 && (
          <div className="mt-1">
            <StarRating rating={book.rating} />
          </div>
        )}

        {/* Genre Badges */}
        {bookGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {bookGenres.map((genre) => (
              <GenreBadge key={genre.id} genre={genre} />
            ))}
            {hasMoreGenres && (
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                +{(book.genres || []).length - MAX_GENRE_BADGES}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Book card skeleton for loading state
 */
export function BookCardSkeleton() {
  return (
    <div className="flex gap-4 p-3 bg-white border border-gray-200 rounded-xl animate-pulse">
      {/* Cover skeleton */}
      <div className="flex-shrink-0 w-16 h-24 rounded-lg bg-gray-200" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
        <div className="h-3 bg-gray-200 rounded w-1/4 mt-2" />
      </div>
    </div>
  );
}
