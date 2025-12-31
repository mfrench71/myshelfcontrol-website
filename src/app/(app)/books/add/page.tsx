/**
 * Add Book Page
 * Search for books by ISBN/title/author and add to library
 */
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ScanLine,
  X,
  BookOpen,
  ArrowLeft,
  CheckCircle,
  Edit3,
  ChevronRight,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { addBook } from '@/lib/repositories/books';
import { GenrePicker, SeriesPicker, AuthorPicker, type SeriesSelection } from '@/components/pickers';
import type { PhysicalFormat } from '@/lib/types';

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

/**
 * Search Google Books API
 */
async function searchBooks(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
    );
    const data = await response.json();

    if (!data.items) return [];

    return data.items.map((item: { id: string; volumeInfo: Record<string, unknown> }) => {
      const info = item.volumeInfo;
      return {
        id: item.id,
        title: info.title as string || 'Unknown Title',
        author: ((info.authors as string[]) || ['Unknown Author']).join(', '),
        isbn: ((info.industryIdentifiers as Array<{ type: string; identifier: string }>) || [])
          .find((id) => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier,
        coverUrl: (info.imageLinks as { thumbnail?: string })?.thumbnail?.replace('http:', 'https:'),
        publisher: info.publisher as string,
        publishedDate: info.publishedDate as string,
        pageCount: info.pageCount as number,
        description: info.description as string,
        categories: info.categories as string[],
      };
    });
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

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
          className="p-1 hover:scale-110 transition-transform"
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSource, setDataSource] = useState<string | null>(null);

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

  // Search for books
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    const results = await searchBooks(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  // Handle search input keypress
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Select a search result
  const selectResult = (result: SearchResult) => {
    setTitle(result.title);
    setAuthor(result.author);
    setIsbn(result.isbn || '');
    setCoverUrl(result.coverUrl || '');
    setPublisher(result.publisher || '');
    setPublishedDate(result.publishedDate || '');
    setPageCount(result.pageCount?.toString() || '');
    setDataSource('Google Books');
    setShowForm(true);
    setSearchResults([]);
    // Extract genre suggestions from categories (Google Books uses "Fiction / Mystery" format)
    if (result.categories) {
      const suggestions = result.categories
        .flatMap((cat) => cat.split(/\s*[\/&]\s*/)) // Split by / or &
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.toLowerCase() !== 'fiction' && s.toLowerCase() !== 'nonfiction');
      setGenreSuggestions([...new Set(suggestions)]); // Remove duplicates
    }
  };

  // Add book manually
  const handleAddManually = () => {
    setDataSource(null);
    setShowForm(true);
  };

  // Go back to search
  const handleStartOver = () => {
    setShowForm(false);
    setTitle('');
    setAuthor('');
    setIsbn('');
    setCoverUrl('');
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
    setDataSource(null);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !title.trim()) return;

    setSubmitting(true);
    try {
      await addBook(user.uid, {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || undefined,
        coverImageUrl: coverUrl || undefined,
        publisher: publisher.trim() || undefined,
        publishedDate: publishedDate.trim() || undefined,
        physicalFormat: physicalFormat || undefined,
        pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
        rating: rating || undefined,
        notes: notes.trim() || undefined,
        genres: selectedGenres,
        seriesId: seriesSelection.seriesId || undefined,
        seriesPosition: seriesSelection.position || undefined,
        reads: [],
      });

      router.push('/books');
    } catch (error) {
      console.error('Failed to add book:', error);
      setSubmitting(false);
    }
  };

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
                  id="scan-btn"
                  type="button"
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  onClick={handleSearch}
                  disabled={searching}
                  className="flex-shrink-0 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors min-h-[48px] disabled:opacity-50"
                >
                  {searching ? '...' : 'Go'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Type an ISBN or search by title/author</p>
            </div>

            {/* Search Results */}
            <div
              id="search-results"
              className={`bg-white rounded-xl border border-gray-200 mb-4 ${
                searchResults.length === 0 ? 'hidden' : ''
              }`}
            >
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">{searchResults.length} results</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => selectResult(result)}
                    className="w-full p-3 flex gap-3 hover:bg-gray-50 text-left"
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
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            {/* Empty state for search results */}
            {searchResults.length === 0 && searchQuery && !searching && (
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
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back to search</span>
              </button>
              {dataSource && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
                  <span className="text-gray-600">Found via {dataSource}</span>
                </div>
              )}
            </div>

            {/* Book Form */}
            <form id="book-form" onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
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
                  required
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

              {/* Cover Picker placeholder */}
              <div id="cover-picker">
                <label className="block font-semibold text-gray-700 mb-1">Cover Image</label>
                {coverUrl ? (
                  <div className="flex gap-4">
                    <div className="w-24 h-36 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={coverUrl}
                        alt=""
                        width={96}
                        height={144}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-36 bg-gray-100 rounded flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-400" aria-hidden="true" />
                  </div>
                )}
              </div>

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
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Book'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
