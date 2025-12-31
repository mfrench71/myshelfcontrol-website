// Books Page - List and manage user's book collection
'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBooks } from '@/lib/repositories/books';
import { BookCard, BookCardSkeleton } from '@/components/books/book-card';
import type { Book } from '@/lib/types';

export default function BooksPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBooks() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const userBooks = await getBooks(user.uid);
        setBooks(userBooks);
      } catch (err) {
        console.error('Failed to load books:', err);
        setError('Failed to load your books. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadBooks();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 page-content">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-28 animate-pulse" />
        </div>

        {/* Books skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 page-content">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Error loading books</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 page-content">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
        <Link
          href="/books/add"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors btn-press min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Book</span>
        </Link>
      </div>

      {/* Book count */}
      {books.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          {books.length} {books.length === 1 ? 'book' : 'books'} in your library
        </p>
      )}

      {/* Empty State */}
      {books.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <h2 className="empty-state-title">No books yet</h2>
          <p className="empty-state-description">
            Start building your library by adding your first book.
          </p>
          <div className="empty-state-action">
            <Link
              href="/books/add"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors btn-press"
            >
              <Plus className="w-5 h-5" />
              Add Your First Book
            </Link>
          </div>
        </div>
      ) : (
        /* Books List */
        <div className="space-y-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
