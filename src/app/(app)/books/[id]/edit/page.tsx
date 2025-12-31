/**
 * Edit Book Page
 * Edit an existing book's details with all pickers, image gallery, and reading dates
 */
'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  RefreshCw,
  RotateCcw,
  ChevronRight,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { getBook, updateBook } from '@/lib/repositories/books';
import { GenrePicker, SeriesPicker, AuthorPicker, CoverPicker } from '@/components/pickers';
import { ImageGallery, type GalleryImage } from '@/components/image-gallery';
import { lookupISBN } from '@/lib/utils/book-api';
import type { CoverOptions } from '@/components/pickers';
import type { Book, PhysicalFormat, BookRead, BookCovers } from '@/lib/types';

// Format options
const FORMAT_OPTIONS = [
  { value: '', label: 'Select format...' },
  { value: 'Paperback', label: 'Paperback' },
  { value: 'Hardcover', label: 'Hardcover' },
  { value: 'Mass Market Paperback', label: 'Mass Market Paperback' },
  { value: 'Trade Paperback', label: 'Trade Paperback' },
  { value: 'Library Binding', label: 'Library Binding' },
  { value: 'Spiral-bound', label: 'Spiral-bound' },
  { value: 'Audio CD', label: 'Audio CD' },
  { value: 'Ebook', label: 'Ebook' },
];

/**
 * Star rating input component
 */
function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div id="rating-input" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          className="p-1 hover:scale-110 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <svg
            className={`w-8 h-8 ${star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 text-sm text-gray-500 hover:text-gray-700 min-h-[44px] px-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/**
 * Get book reading status from reads array
 */
function getBookStatus(book: { reads?: BookRead[] }): 'want-to-read' | 'reading' | 'finished' {
  const reads = book.reads || [];
  if (reads.length === 0) return 'want-to-read';
  const latestRead = reads[reads.length - 1];
  if (latestRead.finishedAt) return 'finished';
  if (latestRead.startedAt) return 'reading';
  return 'want-to-read';
}

/**
 * Format date for input field
 */
function formatDateForInput(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
function formatDate(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
  const [notes, setNotes] = useState('');

  // Picker state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [seriesPosition, setSeriesPosition] = useState<number | null>(null);

  // Image gallery state
  const [images, setImages] = useState<GalleryImage[]>([]);

  // Reading dates state
  const [reads, setReads] = useState<BookRead[]>([]);
  const [readingDateError, setReadingDateError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Original values for dirty checking
  const [originalValues, setOriginalValues] = useState<string>('');

  // Get current read entry
  const currentRead = reads.length > 0 ? reads[reads.length - 1] : null;
  const previousReads = reads.slice(0, -1);

  // Calculate reading status
  const readingStatus = useMemo(() => getBookStatus({ reads }), [reads]);

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
        notes,
        selectedGenres,
        seriesId,
        seriesPosition,
        reads,
        images: images.map(i => i.id),
      }),
    [title, author, isbn, coverUrl, publisher, publishedDate, physicalFormat, pageCount, rating, notes, selectedGenres, seriesId, seriesPosition, reads, images]
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
        setNotes(bookData.notes || '');
        setSelectedGenres(bookData.genres || []);
        setSeriesId(bookData.seriesId || null);
        setSeriesPosition(bookData.seriesPosition || null);
        setImages(bookData.images || []);
        setReads(bookData.reads || []);

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
            notes: bookData.notes || '',
            selectedGenres: bookData.genres || [],
            seriesId: bookData.seriesId || null,
            seriesPosition: bookData.seriesPosition || null,
            reads: bookData.reads || [],
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

  // Handle started date change
  const handleStartedDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReadingDateError(null);

    setReads((prev) => {
      const newReads = [...prev];
      if (newReads.length === 0) {
        if (value) {
          newReads.push({ startedAt: new Date(value).getTime(), finishedAt: null });
        }
      } else {
        const lastRead = { ...newReads[newReads.length - 1] };
        lastRead.startedAt = value ? new Date(value).getTime() : null;

        // Validate: finished can't be before started
        const finishedTime = typeof lastRead.finishedAt === 'number' ? lastRead.finishedAt : null;
        const startedTime = typeof lastRead.startedAt === 'number' ? lastRead.startedAt : null;
        if (finishedTime && startedTime && finishedTime < startedTime) {
          setReadingDateError('Finished date cannot be before started date');
        }

        newReads[newReads.length - 1] = lastRead;
      }
      return newReads;
    });
  }, []);

  // Handle finished date change
  const handleFinishedDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReadingDateError(null);

    setReads((prev) => {
      const newReads = [...prev];
      if (newReads.length === 0) {
        // Can't set finished without started
        if (value) {
          setReadingDateError('Please set a start date first');
        }
        return prev;
      }

      const lastRead = { ...newReads[newReads.length - 1] };

      // Validate: need started date first
      if (value && !lastRead.startedAt) {
        setReadingDateError('Please set a start date first');
        return prev;
      }

      lastRead.finishedAt = value ? new Date(value).getTime() : null;

      // Validate: finished can't be before started
      const finishedTime = typeof lastRead.finishedAt === 'number' ? lastRead.finishedAt : null;
      const startedTime = typeof lastRead.startedAt === 'number' ? lastRead.startedAt : null;
      if (finishedTime && startedTime && finishedTime < startedTime) {
        setReadingDateError('Finished date cannot be before started date');
      }

      newReads[newReads.length - 1] = lastRead;
      return newReads;
    });
  }, []);

  // Handle re-read button
  const handleStartReread = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setReads((prev) => [...prev, { startedAt: today.getTime(), finishedAt: null }]);
  }, []);

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

    // Validate reading dates
    if (readingDateError) {
      return;
    }

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
        notes: notes.trim() || undefined,
        genres: selectedGenres,
        seriesId: seriesId || undefined,
        seriesPosition: seriesPosition || undefined,
        images: images,
        reads: reads.length > 0 ? reads : undefined,
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
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-36 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
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
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 min-h-[52px]">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center text-sm">
                <li>
                  <Link href="/books" className="text-gray-500 hover:text-gray-700">
                    Books
                  </Link>
                </li>
                <li className="mx-2 text-gray-400">/</li>
                <li className="text-gray-900 font-medium">Edit Book</li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Link
                href="/books"
                className="mt-2 text-sm text-red-700 underline hover:no-underline inline-block"
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
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li>
                <Link href="/books" className="text-gray-500 hover:text-gray-700">
                  Books
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li>
                <Link
                  href={`/books/${id}`}
                  className="text-gray-500 hover:text-gray-700 max-w-[150px] truncate inline-block align-middle"
                >
                  {title || 'Book'}
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Edit</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={refreshing || (!isbn && !title)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] disabled:opacity-50"
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
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Edit Form */}
        <form
          id="edit-form"
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-4 space-y-4"
          noValidate
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="block font-semibold text-gray-700 mb-1">
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

          {/* ISBN */}
          <div>
            <label htmlFor="isbn" className="block font-semibold text-gray-700 mb-1">
              ISBN
            </label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g., 9780123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

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

          {/* Publisher and Published Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="publisher" className="block font-semibold text-gray-700 mb-1">
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
              <label htmlFor="publishedDate" className="block font-semibold text-gray-700 mb-1">
                Published Date
              </label>
              <input
                type="text"
                id="publishedDate"
                name="publishedDate"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Format and Page Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="physicalFormat" className="block font-semibold text-gray-700 mb-1">
                Format
              </label>
              <select
                id="physicalFormat"
                name="physicalFormat"
                value={physicalFormat}
                onChange={(e) => setPhysicalFormat(e.target.value as PhysicalFormat)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pageCount" className="block font-semibold text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Rating</label>
            <RatingInput value={rating} onChange={setRating} />
          </div>

          {/* Reading Dates */}
          <div>
            <span className="block font-semibold text-gray-700 mb-2">Reading Dates</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="started-date" className="block text-sm text-gray-500 mb-1">
                  Started
                </label>
                <input
                  type="date"
                  id="started-date"
                  value={currentRead ? formatDateForInput(currentRead.startedAt) : ''}
                  onChange={handleStartedDateChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                    readingDateError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="finished-date" className="block text-sm text-gray-500 mb-1">
                  Finished
                </label>
                <input
                  type="date"
                  id="finished-date"
                  value={currentRead ? formatDateForInput(currentRead.finishedAt) : ''}
                  onChange={handleFinishedDateChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                    readingDateError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Reading date error */}
            {readingDateError && (
              <p className="text-sm text-red-600 mt-1">{readingDateError}</p>
            )}

            {/* Re-read button and status badge */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleStartReread}
                disabled={!currentRead?.finishedAt}
                className="px-3 py-2 min-h-[44px] rounded-lg border border-gray-300 text-sm flex items-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Start Re-read</span>
              </button>

              {/* Status badge */}
              {readingStatus === 'reading' && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                  Reading
                </span>
              )}
              {readingStatus === 'finished' && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                  Finished
                </span>
              )}
            </div>

            {/* Read History */}
            {previousReads.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                  <span>
                    Read History ({previousReads.length} previous read
                    {previousReads.length !== 1 ? 's' : ''})
                  </span>
                </button>

                {showHistory && (
                  <div className="mt-2 pl-5 border-l-2 border-gray-200 space-y-1 text-sm text-gray-500">
                    {previousReads
                      .slice()
                      .reverse()
                      .map((read, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          <span>
                            {formatDate(read.startedAt) || 'Unknown'} -{' '}
                            {formatDate(read.finishedAt) || 'In progress'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block font-semibold text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Link
              href={`/books/${id}`}
              className="flex-1 py-3 px-4 text-center text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors"
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
