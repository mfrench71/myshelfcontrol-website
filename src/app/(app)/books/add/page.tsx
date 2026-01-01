/**
 * Add Book Page
 * Search for books by ISBN/title/author, scan barcodes, and add to library
 */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ScanLine,
  X,
  BookOpen,
  CheckCircle,
  Edit3,
  ChevronRight,
  Loader2,
  AlertCircle,
  Star,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { addBook } from '@/lib/repositories/books';
import { lookupISBN, searchBooks as searchBooksAPI } from '@/lib/utils/book-api';
import { isISBN, cleanISBN, checkForDuplicate } from '@/lib/utils/duplicate-checker';
import { ImageGallery, type GalleryImage } from '@/components/image-gallery';
import {
  GenrePicker,
  SeriesPicker,
  AuthorPicker,
  CoverPicker,
  type SeriesSelection,
  type CoverOptions,
  type CoverSource,
} from '@/components/pickers';
import type { PhysicalFormat, BookCovers } from '@/lib/types';

// Quagga types - use library types
import type { QuaggaJSResultObject } from '@ericblade/quagga2';

// Book search result from API
type SearchResult = {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  description?: string;
  categories?: string[];
};

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

const SEARCH_PAGE_SIZE = 10;

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
          className={`p-1 transition-colors ${
            star <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
          }`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-6 h-6 ${star <= value ? 'fill-yellow-400' : ''}`}
            aria-hidden="true"
          />
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default function AddBookPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<{ text: string; type: 'info' | 'error' } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [searchStartIndex, setSearchStartIndex] = useState(0);
  const [selectingResult, setSelectingResult] = useState<string | null>(null);

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(true);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const quaggaRef = useRef<typeof import('@ericblade/quagga2').default | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [physicalFormat, setPhysicalFormat] = useState<PhysicalFormat>('');
  const [pageCount, setPageCount] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);
  const [seriesSelection, setSeriesSelection] = useState<SeriesSelection>({
    seriesId: null,
    seriesName: '',
    position: null,
  });
  const [suggestedSeriesName, setSuggestedSeriesName] = useState<string | null>(null);
  const [suggestedSeriesPosition, setSuggestedSeriesPosition] = useState<number | null>(null);
  const [coverOptions, setCoverOptions] = useState<CoverOptions>({});
  const [startedAt, setStartedAt] = useState('');
  const [finishedAt, setFinishedAt] = useState('');
  const [images, setImages] = useState<GalleryImage[]>([]);

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [duplicateBypassed, setDuplicateBypassed] = useState(false);

  /**
   * Check if form has content that would be lost
   */
  const hasFormContent = useCallback(() => {
    return !!(
      title.trim() ||
      author.trim() ||
      coverUrl.trim() ||
      publisher.trim() ||
      publishedDate.trim() ||
      physicalFormat ||
      pageCount.trim() ||
      notes.trim() ||
      rating > 0 ||
      selectedGenres.length > 0 ||
      seriesSelection.seriesId ||
      images.length > 0
    );
  }, [title, author, coverUrl, publisher, publishedDate, physicalFormat, pageCount, notes, rating, selectedGenres, seriesSelection, images]);

  /**
   * Warn before leaving with unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasFormContent()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasFormContent]);

  /**
   * Handle ISBN lookup directly
   */
  const handleISBNLookup = useCallback(async (isbnInput: string, fromScan = false) => {
    const cleanedISBN = cleanISBN(isbnInput);
    setSearchMessage({ text: 'Looking up ISBN...', type: 'info' });

    try {
      const bookData = await lookupISBN(cleanedISBN);
      if (bookData) {
        setIsbn(cleanedISBN);
        setTitle(bookData.title || '');
        setAuthor(bookData.author || '');
        setPublisher(bookData.publisher || '');
        setPublishedDate(bookData.publishedDate || '');
        setPhysicalFormat((bookData.physicalFormat || '') as PhysicalFormat);
        setPageCount(bookData.pageCount?.toString() || '');
        setCoverUrl(bookData.coverImageUrl || '');

        // Set cover options from API
        if (bookData.covers) {
          setCoverOptions(bookData.covers);
        }

        // Set genre suggestions
        if (bookData.genres?.length) {
          setGenreSuggestions(bookData.genres);
        }

        // Set series suggestion
        if (bookData.seriesName) {
          setSuggestedSeriesName(bookData.seriesName);
          setSuggestedSeriesPosition(bookData.seriesPosition || null);
        }

        const source = fromScan ? 'Barcode Scan' : bookData.source === 'openLibrary' ? 'Open Library' : 'Google Books';
        setDataSource(source);
        setShowForm(true);
        setSearchResults([]);
        setSearchMessage(null);
        showToast('Book found!', { type: 'success' });
      } else {
        setSearchMessage({ text: 'Book not found. Try searching by title or add manually.', type: 'error' });
      }
    } catch (error) {
      console.error('ISBN lookup error:', error);
      setSearchMessage({ text: 'Error looking up ISBN. Please try again.', type: 'error' });
    }
  }, [showToast]);

  /**
   * Search for books
   */
  const handleSearch = useCallback(async (query: string, append = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchMessage(null);
      return;
    }

    // Check if it's an ISBN
    if (isISBN(query)) {
      setSearchResults([]);
      await handleISBNLookup(query);
      return;
    }

    if (query.length < 2) return;

    if (!append) {
      setSearching(true);
      setSearchStartIndex(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const startIndex = append ? searchStartIndex : 0;
      const result = await searchBooksAPI(query, { startIndex, maxResults: SEARCH_PAGE_SIZE });

      const mappedResults: SearchResult[] = result.books.map((book, idx) => ({
        id: `${startIndex}-${idx}`,
        title: book.title,
        author: book.author,
        isbn: undefined, // Will be fetched on selection
        coverUrl: book.coverImageUrl,
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        pageCount: book.pageCount || undefined,
        categories: book.genres,
      }));

      if (append) {
        setSearchResults((prev) => [...prev, ...mappedResults]);
      } else {
        setSearchResults(mappedResults);
      }

      setHasMoreResults(result.hasMore);
      setSearchStartIndex(startIndex + SEARCH_PAGE_SIZE);
      setSearchMessage(null);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchMessage({ text: 'Search failed. Please try again.', type: 'error' });
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  }, [searchStartIndex, handleISBNLookup]);

  /**
   * Infinite scroll observer for search results
   */
  useEffect(() => {
    if (!sentinelRef.current || !hasMoreResults) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMoreResults && searchQuery) {
          handleSearch(searchQuery, true);
        }
      },
      { root: resultsContainerRef.current, rootMargin: '50px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMoreResults, loadingMore, searchQuery, handleSearch]);

  /**
   * Debounced live search as user types
   */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchMessage(null);
      return;
    }

    // For ISBNs, show hint but don't auto-search (wait for explicit Go/Enter)
    if (isISBN(searchQuery)) {
      setSearchResults([]);
      setSearchMessage({ text: 'ISBN detected — press Go to look up', type: 'info' });
      return;
    }

    // Need at least 2 characters for title/author search
    if (searchQuery.length < 2) {
      return;
    }

    // Debounce search by 400ms
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  /**
   * Handle search input keypress
   */
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchQuery);
    }
  };

  /**
   * Select a search result
   */
  const selectResult = async (result: SearchResult) => {
    setSelectingResult(result.id);

    try {
      setTitle(result.title);
      setAuthor(result.author);
      setPublisher(result.publisher || '');
      setPublishedDate(result.publishedDate || '');
      setPageCount(result.pageCount?.toString() || '');
      setCoverUrl(result.coverUrl || '');

      // Extract genre suggestions from categories
      if (result.categories?.length) {
        const suggestions = result.categories
          .flatMap((cat) => cat.split(/\s*[\/&]\s*/))
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.toLowerCase() !== 'fiction' && s.toLowerCase() !== 'nonfiction');
        setGenreSuggestions([...new Set(suggestions)]);
      }

      // Set initial cover options
      let covers: BookCovers = {};
      if (result.coverUrl) {
        covers.googleBooks = result.coverUrl;
      }

      // Try to get more data from ISBN lookup if we don't have full data
      // We search using the title to find the ISBN
      try {
        const isbnSearch = await searchBooksAPI(`${result.title} ${result.author}`, { maxResults: 1 });
        if (isbnSearch.books.length > 0) {
          const firstBook = isbnSearch.books[0];
          // If the lookup returned covers, use them
          if (firstBook.covers) {
            covers = { ...covers, ...firstBook.covers };
          }
          // Get genre suggestions
          if (firstBook.genres?.length) {
            setGenreSuggestions((prev) => [...new Set([...prev, ...firstBook.genres!])]);
          }
          // Get series info
          if (firstBook.seriesName) {
            setSuggestedSeriesName(firstBook.seriesName);
            setSuggestedSeriesPosition(firstBook.seriesPosition || null);
          }
        }
      } catch {
        // Ignore lookup errors, use what we have
      }

      setCoverOptions(covers);
      setDataSource('Google Books');
      setShowForm(true);
      setSearchResults([]);
      showToast('Book selected!', { type: 'success' });
    } finally {
      setSelectingResult(null);
    }
  };

  /**
   * Handle cover selection from CoverPicker
   */
  const handleCoverSelect = (url: string, _source: CoverSource) => {
    setCoverUrl(url);
  };

  /**
   * Handle primary image change from gallery
   */
  const handlePrimaryImageChange = (url: string | null, userInitiated?: boolean) => {
    if (url && userInitiated) {
      setCoverUrl(url);
      setCoverOptions((prev) => ({ ...prev, userUpload: url }));
    }
  };

  /**
   * Add book manually
   */
  const handleAddManually = () => {
    setDataSource(null);
    setShowForm(true);
  };

  /**
   * Go back to search with confirmation if form has content
   */
  const handleStartOver = () => {
    if (hasFormContent()) {
      if (!confirm('You have unsaved changes. Are you sure you want to go back?')) {
        return;
      }
    }

    // Reset all form state
    setShowForm(false);
    setTitle('');
    setAuthor('');
    setIsbn('');
    setCoverUrl('');
    setCoverOptions({});
    setPublisher('');
    setPublishedDate('');
    setPhysicalFormat('' as PhysicalFormat);
    setPageCount('');
    setRating(0);
    setNotes('');
    setSelectedGenres([]);
    setGenreSuggestions([]);
    setSeriesSelection({ seriesId: null, seriesName: '', position: null });
    setSuggestedSeriesName(null);
    setSuggestedSeriesPosition(null);
    setStartedAt('');
    setFinishedAt('');
    setImages([]);
    setDataSource(null);
    setDuplicateWarning(null);
    setDuplicateBypassed(false);
  };

  /**
   * Clear search
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchMessage(null);
    setSearchStartIndex(0);
    setHasMoreResults(false);
    searchInputRef.current?.focus();
  };

  /**
   * Open barcode scanner
   */
  const openScanner = async () => {
    // Check for HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      showToast('Camera requires HTTPS. Use the deployed site.', { type: 'error' });
      return;
    }

    setScannerOpen(true);
    setScannerLoading(true);

    try {
      // Check camera permission first with timeout
      const cameraPromise = navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const timeoutPromise = new Promise<MediaStream>((_, reject) =>
        setTimeout(() => reject(new Error('Camera access timed out')), 10000)
      );
      const stream = await Promise.race([cameraPromise, timeoutPromise]);
      stream.getTracks().forEach((track) => track.stop());

      // Dynamically import Quagga
      const Quagga = (await import('@ericblade/quagga2')).default;
      quaggaRef.current = Quagga;

      // Initialize scanner
      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: scannerContainerRef.current!,
              constraints: { facingMode: 'environment' },
            },
            locator: { patchSize: 'medium', halfSample: true },
            numOfWorkers: 0,
            frequency: 10,
            decoder: {
              readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader'],
            },
            locate: true,
          },
          (err: unknown) => {
            if (err) {
              reject(err);
              return;
            }
            Quagga.start();
            setScannerLoading(false);
            resolve();
          }
        );

        Quagga.onDetected((result: QuaggaJSResultObject) => {
          if (!result?.codeResult?.code) return;

          const errors = (result.codeResult.decodedCodes || [])
            .map((x) => x.error)
            .filter((e): e is number => typeof e === 'number');
          const avgError = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : 1;

          // Reject scans with high error rate
          if (avgError >= 0.1) return;

          const code = result.codeResult.code;
          if (!code || !/^\d{10,13}$/.test(code)) return;

          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }

          showToast(`Scanned: ${code}`, { type: 'success' });
          closeScanner();
          handleISBNLookup(code, true);
        });
      });
    } catch (error) {
      console.error('Scanner error:', error);
      closeScanner();

      const errorMessages: Record<string, string> = {
        NotAllowedError: 'Camera permission denied. Please allow camera access.',
        NotFoundError: 'No camera found on this device.',
        NotReadableError: 'Camera is in use by another app.',
      };
      const err = error as Error & { name?: string };
      showToast(errorMessages[err.name || ''] || 'Scanner error. Please try again.', { type: 'error' });
    }
  };

  /**
   * Close barcode scanner
   */
  const closeScanner = () => {
    setScannerOpen(false);
    setScannerLoading(true);

    if (quaggaRef.current) {
      try {
        quaggaRef.current.stop();
        quaggaRef.current.offDetected();
      } catch {
        // Ignore stop errors
      }
    }

    // Force stop video streams
    if (scannerContainerRef.current) {
      const video = scannerContainerRef.current.querySelector('video');
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
      scannerContainerRef.current.innerHTML = '';
    }
  };

  /**
   * Handle escape key for scanner
   */
  useEffect(() => {
    if (!scannerOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeScanner();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [scannerOpen]);

  /**
   * Submit form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !title.trim()) return;

    setSubmitting(true);

    try {
      // Check for duplicates (unless bypassed)
      if (!duplicateBypassed) {
        const { isDuplicate, matchType, existingBook } = await checkForDuplicate(
          user.uid,
          isbn || null,
          title,
          author
        );

        if (isDuplicate) {
          setSubmitting(false);
          setDuplicateBypassed(true);

          const matchDesc =
            matchType === 'isbn'
              ? `A book with ISBN "${isbn}" already exists`
              : `"${existingBook?.title}" by ${existingBook?.author} already exists`;

          setDuplicateWarning(`${matchDesc}. Click "Add Anyway" to add duplicate.`);
          showToast(`${matchDesc}. Click "Add Anyway" to add duplicate.`, { type: 'error', duration: 5000 });
          return;
        }
      }

      // Build reads array if dates are set
      const reads =
        startedAt || finishedAt
          ? [{ startedAt: startedAt || null, finishedAt: finishedAt || null }]
          : [];

      await addBook(user.uid, {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || undefined,
        coverImageUrl: coverUrl || undefined,
        covers: Object.keys(coverOptions).length > 0 ? coverOptions : undefined,
        publisher: publisher.trim() || undefined,
        publishedDate: publishedDate.trim() || undefined,
        physicalFormat: physicalFormat || undefined,
        pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
        rating: rating || undefined,
        notes: notes.trim() || undefined,
        genres: selectedGenres,
        seriesId: seriesSelection.seriesId || undefined,
        seriesPosition: seriesSelection.position || undefined,
        reads,
        images: images.map((img) => ({
          id: img.id,
          url: img.url,
          storagePath: img.storagePath,
          isPrimary: img.isPrimary,
          uploadedAt: img.uploadedAt,
        })),
      });

      // Mark images as saved
      if (typeof window !== 'undefined') {
        const markSaved = (window as unknown as { __imageGalleryMarkSaved?: () => void }).__imageGalleryMarkSaved;
        if (markSaved) markSaved();
      }

      showToast('Book added!', { type: 'success' });
      router.push('/books');
    } catch (error) {
      console.error('Failed to add book:', error);
      showToast('Error adding book', { type: 'error' });
      setSubmitting(false);
    }
  };

  /**
   * Reset duplicate bypass when title/author changes
   */
  useEffect(() => {
    if (duplicateBypassed) {
      setDuplicateBypassed(false);
      setDuplicateWarning(null);
    }
  }, [title, author]);

  return (
    <>
      {/* Sub-navigation */}
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
              <li className="text-gray-900 font-medium">Add Book</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search Section */}
        {!showForm && (
          <div id="search-section">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Find Your Book</h2>

            {/* Search Input */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openScanner}
                  className="flex-shrink-0 p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                  aria-label="Scan barcode"
                >
                  <ScanLine className="w-5 h-5" aria-hidden="true" />
                </button>
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    id="book-search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Check if ISBN and show hint
                      if (isISBN(e.target.value)) {
                        setSearchMessage({ text: 'ISBN detected — press Go to look up', type: 'info' });
                      } else {
                        setSearchMessage(null);
                      }
                    }}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Search by ISBN, title, or author..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none min-h-[48px]"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch(searchQuery)}
                  disabled={searching}
                  className="flex-shrink-0 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Go'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Type an ISBN or search by title/author</p>

              {/* Search status message */}
              {searchMessage && (
                <p className={`text-sm mt-2 ${searchMessage.type === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                  {searchMessage.text}
                </p>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 mb-4">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">{searchResults.length} results</span>
                </div>
                <div
                  ref={resultsContainerRef}
                  className="divide-y divide-gray-100 max-h-80 overflow-y-auto"
                >
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => selectResult(result)}
                      disabled={selectingResult === result.id}
                      className="w-full p-3 flex gap-3 hover:bg-gray-50 text-left relative disabled:opacity-50"
                    >
                      <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {result.coverUrl ? (
                          <Image
                            src={result.coverUrl}
                            alt=""
                            width={48}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-gray-400" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-sm text-gray-500 truncate">{result.author}</p>
                        {result.publishedDate && (
                          <p className="text-xs text-gray-400">{result.publishedDate}</p>
                        )}
                      </div>
                      {selectingResult === result.id ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0 self-center" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                  {/* Sentinel for infinite scroll */}
                  {hasMoreResults && (
                    <div ref={sentinelRef} className="py-3 text-center text-xs text-gray-400">
                      {loadingMore ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                      ) : (
                        'Scroll for more...'
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty state for search results */}
            {searchResults.length === 0 && searchQuery && !searching && !searchMessage && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" aria-hidden="true" />
                <p>No results found</p>
                <p className="text-sm mt-1">Try a different search or add manually</p>
              </div>
            )}

            {/* Add Manually Link */}
            <div className="text-center">
              <button
                type="button"
                id="add-manually-btn"
                onClick={handleAddManually}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <Edit3 className="w-4 h-4" aria-hidden="true" />
                <span>Can&apos;t find it? Add manually</span>
              </button>
            </div>
          </div>
        )}

        {/* Book Form Section */}
        {showForm && (
          <div id="form-section">
            {/* Data Source Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handleStartOver}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>Start over</span>
              </button>
              {dataSource && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
                  <span className="text-gray-600">Found via {dataSource}</span>
                </div>
              )}
            </div>

            {/* Duplicate Warning */}
            {duplicateWarning && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{duplicateWarning}</p>
              </div>
            )}

            {/* Book Form */}
            <form id="book-form" onSubmit={handleSubmit} noValidate className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
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
                  selectedId={seriesSelection.seriesId}
                  position={seriesSelection.position}
                  onChange={setSeriesSelection}
                  suggestedName={suggestedSeriesName}
                  suggestedPosition={suggestedSeriesPosition}
                />
              )}

              {/* Cover Picker */}
              <CoverPicker
                covers={coverOptions}
                selectedUrl={coverUrl}
                onChange={handleCoverSelect}
              />

              {/* Image Gallery */}
              {user && (
                <ImageGallery
                  userId={user.uid}
                  bookId={null}
                  images={images}
                  onChange={setImages}
                  onPrimaryChange={handlePrimaryImageChange}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
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
                <label className="block font-semibold text-gray-700 mb-2">Rating</label>
                <RatingInput value={rating} onChange={setRating} />
              </div>

              {/* Reading Dates */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Reading Dates</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startedAt" className="block text-sm text-gray-600 mb-1">
                      Started
                    </label>
                    <input
                      type="date"
                      id="startedAt"
                      name="startedAt"
                      value={startedAt}
                      onChange={(e) => setStartedAt(e.target.value)}
                      max={finishedAt || undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="finishedAt" className="block text-sm text-gray-600 mb-1">
                      Finished
                    </label>
                    <input
                      type="date"
                      id="finishedAt"
                      name="finishedAt"
                      value={finishedAt}
                      onChange={(e) => setFinishedAt(e.target.value)}
                      min={startedAt || undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty for &quot;To Read&quot; status
                </p>
              </div>

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

              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  duplicateBypassed
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                {submitting ? 'Adding...' : duplicateBypassed ? 'Add Anyway' : 'Add Book'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <h2 className="text-white font-semibold text-lg">Scan Barcode</h2>
            <button
              type="button"
              onClick={closeScanner}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
              aria-label="Close scanner"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scanner container */}
          <div
            ref={scannerContainerRef}
            className="w-full h-full"
          />

          {/* Loading state */}
          {scannerLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
                <p>Starting camera...</p>
              </div>
            </div>
          )}

          {/* Viewfinder overlay */}
          {!scannerLoading && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-white/50 rounded-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-500 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <p className="absolute bottom-8 left-0 right-0 text-center text-white/80 text-sm">
            Point camera at a book barcode
          </p>
        </div>
      )}
    </>
  );
}
