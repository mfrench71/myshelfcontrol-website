/**
 * Recycle Bin Page
 * View, restore, and permanently delete books
 * Matches old site's bin functionality with confirmation modals
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, AlertCircle, Clock } from 'lucide-react';
import { BookCover } from '@/components/ui/book-cover';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBinBooks, restoreBook, deleteBook } from '@/lib/repositories/books';
import { useToast } from '@/components/ui/toast';
import { ConfirmModal } from '@/components/ui/modal';
import type { Book } from '@/lib/types';

export default function BinPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmptyBinModal, setShowEmptyBinModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);

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

  // Calculate days until auto-delete
  const getDaysRemaining = (deletedAt: number | null | undefined): number => {
    if (!deletedAt) return 30;
    const now = Date.now();
    const deleteDate = deletedAt + 30 * 24 * 60 * 60 * 1000; // 30 days
    const remaining = Math.ceil((deleteDate - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  };

  // Open restore modal
  const openRestoreModal = useCallback((book: Book) => {
    setSelectedBook(book);
    setShowRestoreModal(true);
  }, []);

  // Open delete modal
  const openDeleteModal = useCallback((book: Book) => {
    setSelectedBook(book);
    setShowDeleteModal(true);
  }, []);

  // Handle restore
  const handleRestore = useCallback(async () => {
    if (!user || !selectedBook) return;

    setIsRestoring(true);
    try {
      await restoreBook(user.uid, selectedBook.id);
      setBooks((prev) => prev.filter((b) => b.id !== selectedBook.id));
      setShowRestoreModal(false);
      setSelectedBook(null);
      // Notify settings layout to update bin count
      window.dispatchEvent(new CustomEvent('bin-updated'));
      showToast('Book restored to library', { type: 'success' });
    } catch (err) {
      console.error('Failed to restore book:', err);
      showToast('Failed to restore book', { type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  }, [user, selectedBook, showToast]);

  // Handle permanent delete
  const handlePermanentDelete = useCallback(async () => {
    if (!user || !selectedBook) return;

    setIsDeleting(true);
    try {
      await deleteBook(user.uid, selectedBook.id);
      setBooks((prev) => prev.filter((b) => b.id !== selectedBook.id));
      setShowDeleteModal(false);
      setSelectedBook(null);
      // Notify settings layout to update bin count
      window.dispatchEvent(new CustomEvent('bin-updated'));
      showToast('Book permanently deleted', { type: 'success' });
    } catch (err) {
      console.error('Failed to permanently delete book:', err);
      showToast('Failed to delete book', { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  }, [user, selectedBook, showToast]);

  // Handle empty bin
  const handleEmptyBin = useCallback(async () => {
    if (!user || books.length === 0) return;

    setIsEmptying(true);
    try {
      // Delete all books in parallel
      await Promise.all(books.map((book) => deleteBook(user.uid, book.id)));
      const count = books.length;
      setBooks([]);
      setShowEmptyBinModal(false);
      // Notify settings layout to update bin count
      window.dispatchEvent(new CustomEvent('bin-updated'));
      showToast(`${count} book${count > 1 ? 's' : ''} permanently deleted`, { type: 'success' });
    } catch (err) {
      console.error('Failed to empty bin:', err);
      showToast('Failed to empty bin', { type: 'error' });
    } finally {
      setIsEmptying(false);
    }
  }, [user, books, showToast]);

  if (authLoading || loading) {
    return (
      <div id="loading-state" className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="bin-content" className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bin</h1>
          <div className="flex items-center gap-3">
            {books.length > 0 && (
              <>
                <p className="text-sm text-gray-500">
                  {books.length} book{books.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setShowEmptyBinModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>Empty Bin</span>
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {books.length === 0 ? (
          <div id="empty-state" className="text-center py-12">
            <Trash2 className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
            <p className="text-gray-500 mt-3">Bin is empty</p>
            <p className="text-gray-400 text-sm mt-1">
              Deleted books will appear here for 30 days before being permanently removed.
            </p>
          </div>
        ) : (
          <div id="bin-list" className="space-y-4">
            {books.map((book, index) => {
              const daysRemaining = getDaysRemaining(book.deletedAt);
              const isUrgent = daysRemaining <= 7;
              const badgeClass = isUrgent
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600';

              return (
                <div
                  key={book.id}
                  className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200"
                >
                  {/* Cover */}
                  <BookCover
                    src={book.coverImageUrl}
                    alt={book.title}
                    width={64}
                    height={96}
                    className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-cover"
                    priority={index < 6}
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{book.author || 'Unknown author'}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${badgeClass} mt-2`}>
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => openRestoreModal(book)}
                      className="p-2 hover:bg-green-50 rounded text-gray-400 hover:text-green-600 min-w-[44px] min-h-[44px] inline-flex items-center justify-center transition-colors"
                      aria-label={`Restore ${book.title}`}
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(book)}
                      className="p-2 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 min-w-[44px] min-h-[44px] inline-flex items-center justify-center transition-colors"
                      aria-label={`Permanently delete ${book.title}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setSelectedBook(null);
        }}
        onConfirm={handleRestore}
        title="Restore Book?"
        message="This book will be restored to your library."
        confirmText="Restore"
        isLoading={isRestoring}
        variant="primary"
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBook(null);
        }}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete?"
        message="This action cannot be undone. The book will be permanently deleted."
        confirmText="Delete Forever"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Empty Bin Confirmation Modal */}
      <ConfirmModal
        isOpen={showEmptyBinModal}
        onClose={() => setShowEmptyBinModal(false)}
        onConfirm={handleEmptyBin}
        title="Empty Bin?"
        message={`All ${books.length} book${books.length > 1 ? 's' : ''} will be permanently deleted. This cannot be undone.`}
        confirmText="Empty Bin"
        isLoading={isEmptying}
        variant="danger"
      />
    </>
  );
}
