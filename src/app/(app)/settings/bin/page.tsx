/**
 * Recycle Bin Page
 * View and restore deleted books
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, BookOpen, RotateCcw, AlertCircle } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBinBooks, restoreBook, deleteBook } from '@/lib/repositories/books';
import type { Book } from '@/lib/types';

export default function BinPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDeletedBooks() {
      if (!user) return;

      try {
        setLoading(true);
        const deletedBooks = await getBinBooks(user.uid);
        setBooks(deletedBooks);
      } catch (err) {
        console.error('Failed to load deleted books:', err);
        setError('Failed to load bin. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadDeletedBooks();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleRestore = async (bookId: string) => {
    if (!user) return;

    try {
      await restoreBook(user.uid, bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error('Failed to restore book:', err);
    }
  };

  const handlePermanentDelete = async (bookId: string) => {
    if (!user) return;

    try {
      await deleteBook(user.uid, bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error('Failed to permanently delete book:', err);
    }
  };

  // Calculate days until auto-delete
  const getDaysRemaining = (deletedAt: number | null | undefined): number => {
    if (!deletedAt) return 30;
    const now = Date.now();
    const deleteDate = deletedAt + 30 * 24 * 60 * 60 * 1000; // 30 days
    const remaining = Math.ceil((deleteDate - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  };

  if (authLoading || loading) {
    return (
      <>
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
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
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li>
                <Link href="/settings" className="text-gray-500 hover:text-gray-700">
                  Settings
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Recycle Bin</li>
            </ol>
          </nav>
        </div>
      </div>

      <div id="bin-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recycle Bin</h1>
        <p className="text-gray-500 mb-6">
          Deleted books are kept for 30 days before permanent deletion.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {books.length === 0 ? (
          <div id="empty-state" className="text-center py-12">
            <Trash2 className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
            <p className="text-gray-500 mt-3">Your bin is empty</p>
            <p className="text-gray-400 text-sm mt-1">
              Deleted books will appear here for 30 days.
            </p>
          </div>
        ) : (
          <div id="bin-list" className="space-y-4">
            {books.map((book) => {
              const daysRemaining = getDaysRemaining(book.deletedAt);
              return (
                <div
                  key={book.id}
                  className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200"
                >
                  {/* Cover */}
                  <div className="w-12 h-18 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {book.coverImageUrl ? (
                      <Image
                        src={book.coverImageUrl}
                        alt=""
                        width={48}
                        height={72}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{book.author}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {daysRemaining > 0
                        ? `Deletes in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
                        : 'Deleting soon'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleRestore(book.id)}
                      className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Restore book"
                      title="Restore"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(book.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Delete permanently"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
