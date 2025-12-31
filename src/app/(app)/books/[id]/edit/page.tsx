/**
 * Edit Book Page
 * Edit an existing book's details
 */
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBook, updateBook } from '@/lib/repositories/books';
import { getGenres } from '@/lib/repositories/genres';
import { getSeries } from '@/lib/repositories/series';
import type { Book, Genre, Series, PhysicalFormat } from '@/lib/types';

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

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditBookPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  // Page state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);

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
        setPublisher(bookData.publisher || '');
        setPublishedDate(bookData.publishedDate || '');
        setPhysicalFormat((bookData.physicalFormat || '') as PhysicalFormat);
        setPageCount(bookData.pageCount?.toString() || '');
        setRating(bookData.rating || 0);
        setNotes(bookData.notes || '');
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
  }, [user, authLoading, id]);

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
        publisher: publisher.trim() || undefined,
        publishedDate: publishedDate.trim() || undefined,
        physicalFormat: physicalFormat || undefined,
        pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
        rating: rating || undefined,
        notes: notes.trim() || undefined,
      });

      router.push(`/books/${id}`);
    } catch (err) {
      console.error('Failed to save book:', err);
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
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
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
  if (error) {
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
                <Link href={`/books/${id}`} className="text-gray-500 hover:text-gray-700 max-w-[150px] truncate inline-block align-middle">
                  {title || 'Book'}
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Edit</li>
            </ol>
          </nav>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
            aria-label="Refresh data from API"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Edit Form */}
        <form id="edit-form" onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          {/* Cover Image Preview */}
          <div id="cover-picker" className="flex gap-4 items-start">
            <div className="w-24 h-36 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt=""
                  width={96}
                  height={144}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block font-semibold text-gray-700 mb-1">Cover Image</label>
              <p className="text-sm text-gray-500">Cover picker coming soon</p>
            </div>
          </div>

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

          <div>
            <label htmlFor="author" className="block font-semibold text-gray-700 mb-1">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* Genre Picker placeholder */}
          <div id="genre-picker">
            <label className="block font-semibold text-gray-700 mb-1">Genres</label>
            <p className="text-sm text-gray-500">Genre picker coming soon</p>
          </div>

          {/* Series Picker placeholder */}
          <div id="series-picker">
            <label className="block font-semibold text-gray-700 mb-1">Series</label>
            <p className="text-sm text-gray-500">Series picker coming soon</p>
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
              disabled={saving || !title.trim()}
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
