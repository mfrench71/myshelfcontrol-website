/**
 * Maintenance Settings Page
 * Library health analysis and data cleanup tools
 * Matches old site's maintenance functionality
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  RefreshCw,
  Calculator,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Loader2,
  Pencil,
  ImageIcon,
  Tags,
  Hash,
  Building,
  Calendar,
  Barcode,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { getBooks } from '@/lib/repositories/books';
import { getGenres, updateGenre } from '@/lib/repositories/genres';
import {
  analyzeLibraryHealth,
  getCompletenessRating,
  getBooksWithIssues,
  type HealthReport,
} from '@/lib/utils/library-health';
import type { Book } from '@/lib/types';

/** Icon mapping for issue types */
const ISSUE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  tags: Tags,
  hash: Hash,
  'book-open': BookOpen,
  building: Building,
  calendar: Calendar,
  barcode: Barcode,
};

export default function MaintenanceSettingsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();

  // Library Health state
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [booksWithIssues, setBooksWithIssues] = useState<
    Array<{ book: Book; missing: Array<{ label: string; icon: string }> }>
  >([]);

  // Genre Recount state
  const [recountLoading, setRecountLoading] = useState(false);
  const [recountResults, setRecountResults] = useState<string | null>(null);

  // Load library health on mount
  const loadLibraryHealth = useCallback(async () => {
    if (!user) return;

    setHealthLoading(true);
    try {
      const books = await getBooks(user.uid);
      const report = analyzeLibraryHealth(books);
      setHealthReport(report);
      setBooksWithIssues(getBooksWithIssues(report));
    } catch (err) {
      console.error('Failed to analyse library health:', err);
      showToast('Failed to analyse library', { type: 'error' });
    } finally {
      setHealthLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadLibraryHealth();
    }
  }, [user, authLoading, loadLibraryHealth]);

  // Handle genre recount
  const handleRecountGenres = useCallback(async () => {
    if (!user || recountLoading) return;

    setRecountLoading(true);
    setRecountResults(null);

    try {
      // Get all books and genres
      const [books, genres] = await Promise.all([getBooks(user.uid), getGenres(user.uid)]);

      // Count books per genre
      const genreCounts: Record<string, number> = {};
      for (const book of books) {
        if (book.genres && Array.isArray(book.genres)) {
          for (const genreId of book.genres) {
            genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
          }
        }
      }

      // Update genres with incorrect counts
      let updated = 0;
      for (const genre of genres) {
        const correctCount = genreCounts[genre.id] || 0;
        if (genre.bookCount !== correctCount) {
          await updateGenre(user.uid, genre.id, { bookCount: correctCount });
          updated++;
        }
      }

      if (updated === 0) {
        setRecountResults('All genre counts are correct.');
        showToast('Counts verified!', { type: 'success' });
      } else {
        setRecountResults(
          `Updated ${updated} genre${updated !== 1 ? 's' : ''} after scanning ${books.length} books.`
        );
        showToast('Counts updated!', { type: 'success' });
      }
    } catch (err) {
      console.error('Failed to recount genres:', err);
      setRecountResults('An error occurred while recounting. Please try again.');
      showToast('Recount failed', { type: 'error' });
    } finally {
      setRecountLoading(false);
    }
  }, [user, recountLoading, showToast]);

  // Get unique books with issues count
  const uniqueBooksWithIssues = booksWithIssues.length;

  // Get progress bar colour
  const rating = healthReport ? getCompletenessRating(healthReport.completenessScore) : null;
  const progressBarColour =
    rating?.colour === 'green'
      ? 'bg-green-500'
      : rating?.colour === 'amber'
        ? 'bg-amber-500'
        : 'bg-red-500';

  if (authLoading) {
    return (
      <>
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li className="flex items-center min-w-0">
                <Link href="/" className="text-gray-500 hover:text-primary hover:underline">
                  Home
                </Link>
              </li>
              <li className="flex items-center min-w-0">
                <ChevronRight
                  className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <Link href="/settings" className="text-gray-500 hover:text-primary hover:underline">
                  Settings
                </Link>
              </li>
              <li className="flex items-center min-w-0">
                <ChevronRight
                  className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-gray-900 font-medium" aria-current="page">
                  Maintenance
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Maintenance</h1>

        {/* Library Health */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Library Health</h3>
          <p className="text-gray-600 text-sm mb-4">
            Analyse your library for missing data and fix issues from book APIs.
          </p>

          {/* Loading State */}
          {healthLoading ? (
            <div className="space-y-3">
              <div className="skeleton h-6 w-48 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ) : healthReport ? (
            <div>
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Library Completeness</span>
                  <span className="text-sm font-medium">{healthReport.completenessScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${progressBarColour}`}
                    style={{ width: `${healthReport.completenessScore}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">{rating?.label}</p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">{healthReport.totalBooks}</span> books
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">{uniqueBooksWithIssues}</span> books with missing
                  information
                </div>
              </div>

              {/* Complete State */}
              {uniqueBooksWithIssues === 0 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle
                    className="w-8 h-8 text-green-500 mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-green-700 font-medium">Your library is 100% complete!</p>
                  <p className="text-green-600 text-sm">
                    All books have cover images, genres, and metadata.
                  </p>
                </div>
              ) : (
                <>
                  {/* Issues List */}
                  <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                    {booksWithIssues.map(({ book, missing }) => (
                      <div
                        key={book.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200"
                      >
                        <div className="w-8 h-12 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                          {book.coverImageUrl ? (
                            <Image
                              src={book.coverImageUrl}
                              alt=""
                              width={32}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <BookOpen className="w-4 h-4" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {book.title || 'Untitled'}
                          </div>
                          <div className="text-xs text-gray-500">by {book.author || 'Unknown'}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {missing.map((m, i) => {
                              const IconComponent = ISSUE_ICONS[m.icon] || BookOpen;
                              return (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded"
                                >
                                  <IconComponent className="w-3 h-3" aria-hidden="true" />
                                  {m.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <Link
                          href={`/books/${book.id}/edit`}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Edit book"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Refresh Button */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={loadLibraryHealth}
                      disabled={healthLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
                    >
                      {healthLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                      )}
                      <span>Refresh</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Recalculate Genre Counts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Recalculate Genre Counts</h3>
          <p className="text-gray-600 text-sm mb-4">
            If genre book counts appear incorrect, this will scan all books and recalculate the
            count for each genre.
          </p>

          {recountResults && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">{recountResults}</p>
            </div>
          )}

          <button
            onClick={handleRecountGenres}
            disabled={recountLoading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
          >
            {recountLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Counting...</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" aria-hidden="true" />
                <span>Recalculate Counts</span>
              </>
            )}
          </button>
        </div>

        {/* Orphaned Images - Placeholder for now */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Orphaned Images</h3>
          <p className="text-gray-600 text-sm mb-4">
            Find and delete images in storage that are not linked to any book. This can happen if
            you upload images but don&apos;t save the book.
          </p>

          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>Scan for Orphaned Images</span>
          </button>
          <p className="text-xs text-gray-400 mt-2">Coming soon - requires Firebase Storage setup</p>
        </div>
      </div>
    </>
  );
}
