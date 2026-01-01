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
import { ref, listAll, deleteObject, getMetadata, StorageReference, FullMetadata } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
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

  // Orphaned Images state
  const [orphanScanning, setOrphanScanning] = useState(false);
  const [orphanDeleting, setOrphanDeleting] = useState(false);
  const [orphanedFiles, setOrphanedFiles] = useState<Array<{ ref: StorageReference; metadata: FullMetadata }>>([]);
  const [orphanResults, setOrphanResults] = useState<'none' | 'found' | 'deleted' | null>(null);
  const [orphanTotalSize, setOrphanTotalSize] = useState(0);
  const [orphanDeletedCount, setOrphanDeletedCount] = useState(0);

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

  /**
   * Format bytes to human-readable size
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * Recursively list all files in a storage folder
   */
  const listAllFilesRecursively = async (
    folderRef: StorageReference
  ): Promise<Array<{ ref: StorageReference; metadata: FullMetadata }>> => {
    const files: Array<{ ref: StorageReference; metadata: FullMetadata }> = [];

    try {
      const result = await listAll(folderRef);

      // Get metadata for all files in this folder
      for (const itemRef of result.items) {
        try {
          const metadata = await getMetadata(itemRef);
          files.push({ ref: itemRef, metadata });
        } catch (err) {
          console.warn('Could not get metadata for:', itemRef.fullPath, err);
        }
      }

      // Recursively list files in subfolders
      for (const prefixRef of result.prefixes) {
        const subFiles = await listAllFilesRecursively(prefixRef);
        files.push(...subFiles);
      }
    } catch {
      // Folder might not exist, which is fine
      console.log('Could not list folder:', folderRef.fullPath);
    }

    return files;
  };

  /**
   * Scan for orphaned images in Firebase Storage
   */
  const handleScanOrphans = useCallback(async () => {
    if (!user || orphanScanning) return;

    setOrphanScanning(true);
    setOrphanResults(null);
    setOrphanedFiles([]);

    try {
      // Get all books to collect referenced image paths
      const books = await getBooks(user.uid);

      // Collect all image storage paths from books
      const referencedPaths = new Set<string>();
      for (const book of books) {
        if (book.images && Array.isArray(book.images)) {
          for (const img of book.images) {
            if (img.storagePath) {
              referencedPaths.add(img.storagePath);
            }
          }
        }
      }

      // List all files in user's storage folder
      const userStorageRef = ref(storage, `users/${user.uid}`);
      const allFiles = await listAllFilesRecursively(userStorageRef);

      // Find orphaned files (in storage but not referenced by any book)
      const orphaned = allFiles.filter(file => !referencedPaths.has(file.ref.fullPath));

      // Calculate total size
      const totalSize = orphaned.reduce((sum, file) => sum + (file.metadata.size || 0), 0);

      setOrphanedFiles(orphaned);
      setOrphanTotalSize(totalSize);

      if (orphaned.length > 0) {
        setOrphanResults('found');
      } else {
        setOrphanResults('none');
        showToast('No orphaned images found', { type: 'success' });
      }
    } catch (err) {
      console.error('Error scanning for orphaned images:', err);
      showToast('Failed to scan for orphaned images', { type: 'error' });
    } finally {
      setOrphanScanning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orphanScanning, showToast]);

  /**
   * Delete all orphaned images
   */
  const handleDeleteOrphans = useCallback(async () => {
    if (!orphanedFiles.length || orphanDeleting) return;

    setOrphanDeleting(true);
    let deletedCount = 0;

    try {
      for (const file of orphanedFiles) {
        try {
          await deleteObject(file.ref);
          deletedCount++;
        } catch (err) {
          console.error('Failed to delete:', file.ref.fullPath, err);
        }
      }

      setOrphanDeletedCount(deletedCount);
      setOrphanResults('deleted');
      setOrphanedFiles([]);
      showToast(`Deleted ${deletedCount} orphaned image${deletedCount !== 1 ? 's' : ''}`, { type: 'success' });
    } catch (err) {
      console.error('Error deleting orphaned images:', err);
      showToast('Failed to delete some images', { type: 'error' });
    } finally {
      setOrphanDeleting(false);
    }
  }, [orphanedFiles, orphanDeleting, showToast]);

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
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
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

        {/* Orphaned Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Orphaned Images</h3>
          <p className="text-gray-600 text-sm mb-4">
            Find and delete images in storage that are not linked to any book. This can happen if
            you upload images but don&apos;t save the book.
          </p>

          {/* Scan Results */}
          {(orphanScanning || orphanResults) && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {orphanScanning && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" aria-hidden="true" />
                  <span className="text-sm text-gray-600">Scanning for orphaned images...</span>
                </div>
              )}

              {orphanResults === 'found' && (
                <div>
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                    <span className="font-medium">{orphanedFiles.length} orphaned images found</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Total size: {formatBytes(orphanTotalSize)}</p>
                  <button
                    onClick={handleDeleteOrphans}
                    disabled={orphanDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
                  >
                    {orphanDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span>Delete Orphaned Images</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {orphanResults === 'none' && (
                <p className="text-sm text-gray-700">No orphaned images found.</p>
              )}

              {orphanResults === 'deleted' && (
                <p className="text-sm text-gray-700">{orphanDeletedCount} orphaned images deleted.</p>
              )}
            </div>
          )}

          <button
            onClick={handleScanOrphans}
            disabled={orphanScanning}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
          >
            {orphanScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" aria-hidden="true" />
                <span>Scan for Orphaned Images</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
