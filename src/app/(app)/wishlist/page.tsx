/**
 * Wishlist Page - Manage books you want to buy
 * Matches old site's UI/UX patterns
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart,
  Loader2,
  ShoppingBag,
  Pencil,
  Trash2,
  MessageSquare,
  Search,
  Calendar,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { BookCover } from '@/components/ui/book-cover';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getWishlist, deleteWishlistItem, updateWishlistItem } from '@/lib/repositories/wishlist';
import { addBook } from '@/lib/repositories/books';
import { useToast } from '@/components/ui/toast';
import { BottomSheet } from '@/components/ui/modal';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import type { WishlistItem, WishlistPriority } from '@/lib/types';

type SortOption = 'createdAt-desc' | 'createdAt-asc' | 'priority-high' | 'title-asc' | 'author-asc';

const PRIORITY_COLOURS: Record<string, string> = {
  high: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  medium: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  low: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/**
 * Get author surname for sorting
 */
function getAuthorSurname(author: string | undefined): string {
  if (!author) return '';
  const parts = author.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Format timestamp as short date (e.g., "2 Jan 2025")
 */
function formatShortDate(timestamp: Timestamp | Date | number | undefined): string | null {
  if (!timestamp) return null;

  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return null;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Sort wishlist items
 */
function sortItems(items: WishlistItem[], sortKey: SortOption): WishlistItem[] {
  const sorted = [...items];

  switch (sortKey) {
    case 'createdAt-desc':
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : 'toMillis' in a.createdAt ? a.createdAt.toMillis() : 0) : 0;
        const bTime = b.createdAt ? (typeof b.createdAt === 'number' ? b.createdAt : 'toMillis' in b.createdAt ? b.createdAt.toMillis() : 0) : 0;
        return bTime - aTime;
      });
    case 'createdAt-asc':
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : 'toMillis' in a.createdAt ? a.createdAt.toMillis() : 0) : 0;
        const bTime = b.createdAt ? (typeof b.createdAt === 'number' ? b.createdAt : 'toMillis' in b.createdAt ? b.createdAt.toMillis() : 0) : 0;
        return aTime - bTime;
      });
    case 'priority-high': {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return sorted.sort((a, b) => {
        const aOrder = a.priority ? priorityOrder[a.priority] ?? 3 : 3;
        const bOrder = b.priority ? priorityOrder[b.priority] ?? 3 : 3;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aTime = a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : 'toMillis' in a.createdAt ? a.createdAt.toMillis() : 0) : 0;
        const bTime = b.createdAt ? (typeof b.createdAt === 'number' ? b.createdAt : 'toMillis' in b.createdAt ? b.createdAt.toMillis() : 0) : 0;
        return bTime - aTime;
      });
    }
    case 'title-asc':
      return sorted.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()));
    case 'author-asc':
      return sorted.sort((a, b) => getAuthorSurname(a.author).localeCompare(getAuthorSurname(b.author)));
    default:
      return sorted;
  }
}

/**
 * Wishlist item card - matches book card styling
 */
function WishlistItemCard({
  item,
  onMove,
  onEdit,
  onDelete,
  priority,
}: {
  item: WishlistItem;
  onMove: () => void;
  onEdit: () => void;
  onDelete: () => void;
  priority?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex gap-4 relative">
      {/* Cover - matches book card size */}
      <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden shadow-cover">
        <BookCover
          src={item.coverImageUrl}
          alt={item.title}
          width={64}
          height={96}
          priority={priority}
        />
      </div>

      {/* Content - matches book card styling */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.author || 'Unknown author'}</p>
        {/* Date Added */}
        {item.createdAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            <span>Added {formatShortDate(item.createdAt)}</span>
          </p>
        )}
        {/* Priority & Notes badges */}
        {(item.priority || item.notes) && (
          <div className="flex items-center gap-1.5 mt-1">
            {item.priority && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLOURS[item.priority]}`}>
                {PRIORITY_LABELS[item.priority]}
              </span>
            )}
            {item.notes && (
              <span title="Has notes">
                <MessageSquare className="w-3 h-3 text-gray-400" aria-hidden="true" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions - bottom right */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        <button
          onClick={onMove}
          className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded text-gray-400 hover:text-green-600 min-w-[40px] min-h-[40px] inline-flex items-center justify-center"
          aria-label="Add to library"
        >
          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[40px] min-h-[40px] inline-flex items-center justify-center"
          aria-label="Edit item"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 min-w-[40px] min-h-[40px] inline-flex items-center justify-center"
          aria-label="Remove from wishlist"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Skeleton card for loading state
 */
function WishlistItemSkeleton() {
  return <div className="skeleton h-24 rounded-xl" />;
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortValue, setSortValue] = useState<SortOption>('createdAt-desc');

  // Modal states
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit form state
  const [editPriority, setEditPriority] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');
  const [originalPriority, setOriginalPriority] = useState<string>('');
  const [originalNotes, setOriginalNotes] = useState('');

  // Lock body scroll when modal is open
  useBodyScrollLock(showMoveModal || showEditModal || showDeleteModal);

  // Load wishlist data
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);
        const wishlistItems = await getWishlist(user.uid);
        setItems(wishlistItems);
      } catch (err) {
        console.error('Failed to load wishlist:', err);
        showToast('Failed to load wishlist. Please try again.', { type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, showToast]);

  // Sort items
  const sortedItems = sortItems(items, sortValue);

  // Check if edit form has changes
  const isEditFormDirty = editPriority !== originalPriority || editNotes !== originalNotes;

  // Open move modal
  const openMoveModal = useCallback((item: WishlistItem) => {
    setSelectedItem(item);
    setShowMoveModal(true);
  }, []);

  // Open edit modal
  const openEditModal = useCallback((item: WishlistItem) => {
    setSelectedItem(item);
    setEditPriority(item.priority || '');
    setEditNotes(item.notes || '');
    setOriginalPriority(item.priority || '');
    setOriginalNotes(item.notes || '');
    setShowEditModal(true);
  }, []);

  // Open delete modal
  const openDeleteModal = useCallback((item: WishlistItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  }, []);

  // Close modals
  const closeModals = useCallback(() => {
    setShowMoveModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedItem(null);
  }, []);

  // Handle move to library
  const handleMove = useCallback(async () => {
    if (!user || !selectedItem) return;

    setIsProcessing(true);
    try {
      await addBook(user.uid, {
        title: selectedItem.title,
        author: selectedItem.author,
        isbn: selectedItem.isbn || undefined,
        coverImageUrl: selectedItem.coverImageUrl || undefined,
        covers: selectedItem.covers || undefined,
        publisher: selectedItem.publisher || undefined,
        publishedDate: selectedItem.publishedDate || undefined,
        pageCount: selectedItem.pageCount,
        notes: selectedItem.notes || undefined,
        reads: [],
      });
      await deleteWishlistItem(user.uid, selectedItem.id);
      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      closeModals();
      // Notify header to update wishlist count
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
      showToast(`"${selectedItem.title}" added to your library!`, { type: 'success' });
    } catch (err) {
      console.error('Failed to move to library:', err);
      showToast('Failed to add to library. Please try again.', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [user, selectedItem, closeModals, showToast]);

  // Handle edit save
  const handleEditSave = useCallback(async () => {
    if (!user || !selectedItem || !isEditFormDirty) return;

    setIsProcessing(true);
    try {
      await updateWishlistItem(user.uid, selectedItem.id, {
        priority: (editPriority || null) as WishlistPriority,
        notes: editNotes || null,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, priority: (editPriority || null) as WishlistPriority, notes: editNotes || null }
            : i
        )
      );
      closeModals();
      showToast('Wishlist item updated', { type: 'success' });
    } catch (err) {
      console.error('Failed to update item:', err);
      showToast('Failed to update item. Please try again.', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [user, selectedItem, editPriority, editNotes, isEditFormDirty, closeModals, showToast]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!user || !selectedItem) return;

    setIsProcessing(true);
    try {
      await deleteWishlistItem(user.uid, selectedItem.id);
      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      closeModals();
      // Notify header to update wishlist count
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
      showToast('Removed from wishlist', { type: 'success' });
    } catch (err) {
      console.error('Failed to delete item:', err);
      showToast('Failed to remove item. Please try again.', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [user, selectedItem, closeModals, showToast]);

  // Loading state
  if (authLoading || loading) {
    return (
      <>
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 min-h-[52px]">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <WishlistItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li className="flex items-center min-w-0">
                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:underline">
                  Home
                </Link>
              </li>
              <li className="mx-2 text-gray-400 dark:text-gray-500">/</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">
                Wishlist
              </li>
            </ol>
          </nav>
          {items.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="sr-only">Sort wishlist by</label>
              <select
                id="sort-select"
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value as SortOption)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 min-h-[44px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="createdAt-desc">Date Added (Newest)</option>
                <option value="createdAt-asc">Date Added (Oldest)</option>
                <option value="priority-high">Priority (High First)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="author-asc">Author (A-Z)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Wishlist</h1>
          {items.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
              {items.length} book{items.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="text-center py-12 empty-state-animate">
            <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 mt-3">Your wishlist is empty</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Books you want to buy will appear here.</p>
            <Link
              href="/books/add"
              className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors min-h-[44px]"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Find Books</span>
            </Link>
          </div>
        ) : (
          /* Wishlist items */
          <div className="space-y-4">
            {sortedItems.map((item, index) => (
              <div key={item.id} className="card-animate">
                <WishlistItemCard
                  item={item}
                  onMove={() => openMoveModal(item)}
                  onEdit={() => openEditModal(item)}
                  onDelete={() => openDeleteModal(item)}
                  priority={index < 6}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Move to Library Modal */}
      <BottomSheet
        isOpen={showMoveModal && !!selectedItem}
        onClose={closeModals}
        title="Add to Library"
        closeOnBackdrop={!isProcessing}
        closeOnEscape={!isProcessing}
        className="md:max-w-sm"
      >
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Add to Library?</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">&ldquo;{selectedItem?.title}&rdquo; will be added to your library.</p>
          <div className="flex gap-3">
            <button
              onClick={closeModals}
              disabled={isProcessing}
              className="flex-1 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={isProcessing}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Library'
              )}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit Modal */}
      <BottomSheet
        isOpen={showEditModal && !!selectedItem}
        onClose={closeModals}
        title="Edit Wishlist Item"
        closeOnBackdrop={!isProcessing}
        closeOnEscape={!isProcessing}
      >
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Wishlist Item</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSave();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="edit-priority" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                id="edit-priority"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none min-h-[44px]"
              >
                <option value="">No priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-notes" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                placeholder=""
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModals}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !isEditFormDirty}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </form>
        </div>
      </BottomSheet>

      {/* Delete Confirmation Modal */}
      <BottomSheet
        isOpen={showDeleteModal && !!selectedItem}
        onClose={closeModals}
        title="Remove from Wishlist"
        closeOnBackdrop={!isProcessing}
        closeOnEscape={!isProcessing}
        className="md:max-w-sm"
      >
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Remove from Wishlist?</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">&ldquo;{selectedItem?.title}&rdquo; will be removed from your wishlist.</p>
          <div className="flex gap-3">
            <button
              onClick={closeModals}
              disabled={isProcessing}
              className="flex-1 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
