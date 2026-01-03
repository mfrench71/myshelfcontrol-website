/**
 * Edit Book Page
 * Edit an existing book's details with all pickers and image gallery
 */
'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { getBook, updateBook } from '@/lib/repositories/books';
import { GenrePicker, SeriesPicker, AuthorPicker, CoverPicker } from '@/components/pickers';
import { ImageGallery, type GalleryImage } from '@/components/image-gallery';
import { lookupISBN } from '@/lib/utils/book-api';
import { RatingInput } from '@/components/books/rating-input';
import { FORMAT_OPTIONS } from '@/lib/utils/book-filters';
import type { CoverOptions } from '@/components/pickers';
import type { Book, PhysicalFormat, BookCovers } from '@/lib/types';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditBookPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();

  // Page state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);

  // Form state - basic fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverOptions, setCoverOptions] = useState<CoverOptions>({});
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [physicalFormat, setPhysicalFormat] = useState<PhysicalFormat>('');
  const [pageCount, setPageCount] = useState('');
  const [rating, setRating] = useState(0);

  // Picker state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [seriesPosition, setSeriesPosition] = useState<number | null>(null);

  // Image gallery state
  const [images, setImages] = useState<GalleryImage[]>([]);

  // Original values for dirty checking
  const [originalValues, setOriginalValues] = useState<string>('');

  // Check if form has unsaved changes
  const formValues = useMemo(
    () =>
      JSON.stringify({
        title,
        author,
        isbn,
        coverUrl,
        publisher,
        publishedDate,
        physicalFormat,
        pageCount,
        rating,
        selectedGenres,
        seriesId,
        seriesPosition,
        images: images.map(i => i.id),
      }),
    [title, author, isbn, coverUrl, publisher, publishedDate, physicalFormat, pageCount, rating, selectedGenres, seriesId, seriesPosition, images]
  );

  const isDirty = originalValues !== '' && originalValues !== formValues;

  // Fetch covers and genre suggestions from API
  const fetchBookMetadata = useCallback(async (bookIsbn: string) => {
    if (!bookIsbn) return;

    try {
      const result = await lookupISBN(bookIsbn);
      if (result) {
        // Set cover options if we got covers from API
        if (result.covers && Object.keys(result.covers).length > 0) {
          setCoverOptions(prev => ({
            ...prev,
            ...result.covers,
          }));
        }
        // Set genre suggestions
        if (result.genres && result.genres.length > 0) {
          setGenreSuggestions(result.genres);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch book metadata:', err);
    }
  }, []);

  // Load book data
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const bookData = await getBook(user.uid, id);

        if (!bookData) {
          setError('Book not found');
          setLoading(false);
          return;
        }

        setBook(bookData);

        // Populate form fields
        setTitle(bookData.title);
        setAuthor(bookData.author);
        setIsbn(bookData.isbn || '');
        setCoverUrl(bookData.coverImageUrl || '');
        setCoverOptions(bookData.covers || {});
        setPublisher(bookData.publisher || '');
        setPublishedDate(bookData.publishedDate || '');
        setPhysicalFormat((bookData.physicalFormat || '') as PhysicalFormat);
        setPageCount(bookData.pageCount?.toString() || '');
        setRating(bookData.rating || 0);
        setSelectedGenres(bookData.genres || []);
        setSeriesId(bookData.seriesId || null);
        setSeriesPosition(bookData.seriesPosition || null);
        setImages(bookData.images || []);

        // Store original values for dirty checking
        setOriginalValues(
          JSON.stringify({
            title: bookData.title,
            author: bookData.author,
            isbn: bookData.isbn || '',
            coverUrl: bookData.coverImageUrl || '',
            publisher: bookData.publisher || '',
            publishedDate: bookData.publishedDate || '',
            physicalFormat: bookData.physicalFormat || '',
            pageCount: bookData.pageCount?.toString() || '',
            rating: bookData.rating || 0,
            selectedGenres: bookData.genres || [],
            seriesId: bookData.seriesId || null,
            seriesPosition: bookData.seriesPosition || null,
            images: (bookData.images || []).map((i: GalleryImage) => i.id),
          })
        );

        // Fetch additional metadata from APIs if book has ISBN
        if (bookData.isbn) {
          fetchBookMetadata(bookData.isbn);
        }
      } catch (err) {
        console.error('Failed to load book:', err);
        setError('Failed to load book. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, id, fetchBookMetadata]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle series selection change
  const handleSeriesChange = useCallback(
    (selection: { seriesId: string | null; seriesName: string; position: number | null }) => {
      setSeriesId(selection.seriesId);
      setSeriesPosition(selection.position);
    },
    []
  );

  // Handle cover selection change
  const handleCoverChange = useCallback((url: string) => {
    setCoverUrl(url);
  }, []);

  // Handle image gallery primary change
  const handleImagePrimaryChange = useCallback((url: string | null, userInitiated?: boolean) => {
    if (url && userInitiated) {
      // Update cover options with user upload
      setCoverOptions(prev => ({
        ...prev,
        userUpload: url,
      }));
      setCoverUrl(url);
    }
  }, []);

  // Handle refresh data button
  const handleRefreshData = useCallback(async () => {
    if (!isbn && !title) return;

    setRefreshing(true);

    try {
      const changedFields: string[] = [];

      if (isbn) {
        const result = await lookupISBN(isbn);
        if (result) {
          // Fill empty fields with API data
          if (!title && result.title) {
            setTitle(result.title);
            changedFields.push('title');
          }
          if (!author && result.author) {
            setAuthor(result.author);
            changedFields.push('author');
          }
          if (!publisher && result.publisher) {
            setPublisher(result.publisher);
            changedFields.push('publisher');
          }
          if (!publishedDate && result.publishedDate) {
            setPublishedDate(result.publishedDate);
            changedFields.push('published date');
          }
          if (!physicalFormat && result.physicalFormat) {
            setPhysicalFormat(result.physicalFormat as PhysicalFormat);
            changedFields.push('format');
          }
          if (!pageCount && result.pageCount) {
            setPageCount(result.pageCount.toString());
            changedFields.push('pages');
          }

          // Update cover options
          if (result.covers && Object.keys(result.covers).length > 0) {
            setCoverOptions(prev => ({
              ...prev,
              ...result.covers,
            }));
            if (!coverUrl) {
              const firstCover = result.covers.googleBooks || result.covers.openLibrary;
              if (firstCover) {
                setCoverUrl(firstCover);
                changedFields.push('cover');
              }
            }
          }

          // Update genre suggestions
          if (result.genres && result.genres.length > 0) {
            setGenreSuggestions(result.genres);
          }
        }
      }

      if (changedFields.length > 0) {
        showToast(`Updated: ${changedFields.join(', ')}`, { type: 'success' });
      } else {
        showToast('No new data found', { type: 'info' });
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
      showToast('Error fetching book data', { type: 'error' });
    } finally {
      setRefreshing(false);
    }
  }, [isbn, title, author, publisher, publishedDate, physicalFormat, pageCount, coverUrl, showToast]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !title.trim()) return;

    setSaving(true);
    try {
      await updateBook(user.uid, id, {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || undefined,
        coverImageUrl: coverUrl || undefined,
        covers: Object.keys(coverOptions).length > 0 ? (coverOptions as BookCovers) : undefined,
        publisher: publisher.trim() || undefined,
        publishedDate: publishedDate.trim() || undefined,
        physicalFormat: physicalFormat || undefined,
        pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
        rating: rating || undefined,
        genres: selectedGenres,
        seriesId: seriesId || undefined,
        seriesPosition: seriesPosition || undefined,
        images: images,
      });

      // Mark gallery images as saved
      const markSaved = (window as unknown as { __imageGalleryMarkSaved?: () => void }).__imageGalleryMarkSaved;
      if (markSaved) markSaved();

      showToast('Changes saved!', { type: 'success' });
      router.push(`/books/${id}`);
    } catch (err) {
      console.error('Failed to save book:', err);
      showToast('Error saving changes', { type: 'error' });
      setError('Failed to save changes. Please try again.');
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <>
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-36 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error && !book) {
    return (
      <>
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 min-h-[52px]">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center text-sm">
                <li>
                  <Link href="/books" className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">
                    Books
                  </Link>
                </li>
                <li className="mx-2 text-gray-400 dark:text-gray-400">/</li>
                <li className="text-gray-900 dark:text-gray-100 font-medium">Edit Book</li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-red-700 dark:text-red-400 font-medium">Error</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
              <Link
                href="/books"
                className="mt-2 text-sm text-red-700 dark:text-red-400 underline hover:no-underline inline-block"
              >
                Back to books
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li>
                <Link href="/books" className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">
                  Books
                </Link>
              </li>
              <li className="mx-2 text-gray-400 dark:text-gray-400">/</li>
              <li>
                <Link
                  href={`/books/${id}`}
                  className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 max-w-[100px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-none truncate inline-block align-middle"
                >
                  {title || 'Book'}
                </Link>
              </li>
              <li className="mx-2 text-gray-400 dark:text-gray-400">/</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium">Edit</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={refreshing || (!isbn && !title)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] disabled:opacity-50"
              aria-label="Refresh data from API"
            >
              {refreshing ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="w-5 h-5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Edit Form */}
        <form
          id="edit-form"
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4"
          noValidate
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* Author Picker */}
          {user && (
            <AuthorPicker
              userId={user.uid}
              value={author}
              onChange={setAuthor}
              required
            />
          )}

          {/* Genre Picker */}
          {user && (
            <GenrePicker
              userId={user.uid}
              selected={selectedGenres}
              onChange={setSelectedGenres}
              suggestions={genreSuggestions}
            />
          )}

          {/* Series Picker */}
          {user && (
            <SeriesPicker
              userId={user.uid}
              selectedId={seriesId}
              position={seriesPosition}
              onChange={handleSeriesChange}
            />
          )}

          {/* Cover Picker */}
          <CoverPicker
            covers={coverOptions}
            selectedUrl={coverUrl}
            onChange={handleCoverChange}
          />

          {/* Image Gallery */}
          {user && (
            <ImageGallery
              userId={user.uid}
              bookId={id}
              images={images}
              onChange={setImages}
              onPrimaryChange={handleImagePrimaryChange}
            />
          )}

          {/* Publisher and Year Published */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="publisher" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Publisher
              </label>
              <input
                type="text"
                id="publisher"
                name="publisher"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label htmlFor="publishedDate" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Year Published
              </label>
              <input
                type="number"
                id="publishedDate"
                name="publishedDate"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                placeholder="e.g., 2024"
                inputMode="numeric"
                min="1000"
                max="2100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Format and Page Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="physicalFormat" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Format
              </label>
              <select
                id="physicalFormat"
                name="physicalFormat"
                value={physicalFormat}
                onChange={(e) => setPhysicalFormat(e.target.value as PhysicalFormat)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pageCount" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Pages
              </label>
              <input
                type="number"
                id="pageCount"
                name="pageCount"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                placeholder="e.g., 320"
                inputMode="numeric"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Rating</label>
            <RatingInput value={rating} onChange={setRating} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Link
              href={`/books/${id}`}
              className="flex-1 py-3 px-4 text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !title.trim() || !isDirty}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
