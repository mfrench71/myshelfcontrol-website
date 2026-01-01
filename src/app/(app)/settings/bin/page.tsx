/**
 * Recycle Bin Page
 * View, restore, and permanently delete books
 * Matches old site's bin functionality with confirmation modals
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, BookOpen, RotateCcw, AlertCircle, Clock, Loader2, ChevronRight } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBinBooks, restoreBook, deleteBook } from '@/lib/repositories/books';
import { useToast } from '@/components/ui/toast';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import type { Book } from '@/lib/types';

/**
 * Confirmation Modal Component
 */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmingText,
  isConfirming,
  variant = 'danger',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmingText: string;
  isConfirming: boolean;
  variant?: 'danger' | 'success';
}) {
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-green-600 hover:bg-green-700 text-white';

  return (
    <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}>
      {/* Mobile: Bottom sheet */}
      <div
        className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${variant === 'danger' ? 'text-red-600' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className="text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={`flex-1 py-2 px-4 rounded-lg min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2 ${confirmButtonClass}`}
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {confirmingText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      {/* Desktop: Centered modal */}
      <div
        className="hidden md:flex items-center justify-center h-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h3 className={`text-lg font-semibold mb-2 ${variant === 'danger' ? 'text-red-600' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className="text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isConfirming}
              className={`flex-1 py-2 px-4 rounded-lg min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2 ${confirmButtonClass}`}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {confirmingText}
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li className="flex items-center min-w-0">
                <Link href="/" className="text-gray-500 hover:text-primary hover:underline">
                  Home
                </Link>
              </li>
              <li className="flex items-center min-w-0">
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" aria-hidden="true" />
                <Link href="/settings" className="text-gray-500 hover:text-primary hover:underline">
                  Settings
                </Link>
              </li>
              <li className="flex items-center min-w-0">
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-900 font-medium" aria-current="page">
                  Bin
                </span>
              </li>
            </ol>
          </nav>
          {books.length > 0 && (
            <button
              onClick={() => setShowEmptyBinModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Empty Bin</span>
            </button>
          )}
        </div>
      </div>

      <div id="bin-content" className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bin</h1>
          {books.length > 0 && (
            <p className="text-sm text-gray-500">
              {books.length} book{books.length !== 1 ? 's' : ''}
            </p>
          )}
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
            {books.map((book) => {
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
                  <div className="w-16 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {book.coverImageUrl ? (
                      <Image
                        src={book.coverImageUrl}
                        alt=""
                        width={64}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-300" aria-hidden="true" />
                      </div>
                    )}
                  </div>

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
        confirmingText="Restoring..."
        isConfirming={isRestoring}
        variant="success"
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
        confirmingText="Deleting..."
        isConfirming={isDeleting}
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
        confirmingText="Emptying..."
        isConfirming={isEmptying}
        variant="danger"
      />
    </>
  );
}
