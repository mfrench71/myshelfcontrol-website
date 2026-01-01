/**
 * Wishlist Page - Manage books you want to buy
 * Lists wishlist items with priority sorting and purchase actions
 */
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Plus,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  BookOpen,
  Trash2,
  ShoppingBag,
  ArrowUpDown,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getWishlist, deleteWishlistItem } from '@/lib/repositories/wishlist';
import { addBook } from '@/lib/repositories/books';
import { useToast } from '@/components/ui/toast';
import type { WishlistItem, WishlistPriority } from '@/lib/types';

type SortOption = 'priority' | 'createdAt-desc' | 'createdAt-asc' | 'title-asc';

const SORT_LABELS: Record<SortOption, string> = {
  priority: 'Priority',
  'createdAt-desc': 'Newest First',
  'createdAt-asc': 'Oldest First',
  'title-asc': 'Title A-Z',
};

const PRIORITY_ORDER: Record<WishlistPriority & string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: WishlistPriority }) {
  if (!priority) return null;

  const colours: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colours[priority]}`}>
      {priority}
    </span>
  );
}

/**
 * Wishlist item card
 */
function WishlistItemCard({
  item,
  onDelete,
  onMarkPurchased,
  isDeleting,
  isPurchasing,
}: {
  item: WishlistItem;
  onDelete: () => void;
  onMarkPurchased: () => void;
  isDeleting: boolean;
  isPurchasing: boolean;
}) {
  const isProcessing = isDeleting || isPurchasing;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 transition-opacity ${isProcessing ? 'opacity-50' : ''}`}>
      <div className="flex gap-4">
        {/* Cover image */}
        <div className="w-16 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.coverImageUrl ? (
            <Image
              src={item.coverImageUrl}
              alt=""
              width={64}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">
              <Heart className="w-6 h-6 text-pink-400" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
              <p className="text-sm text-gray-600 truncate">{item.author}</p>
            </div>
            <PriorityBadge priority={item.priority || null} />
          </div>

          {item.notes && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.notes}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onMarkPurchased}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
            >
              {isPurchasing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
              {isPurchasing ? 'Adding...' : 'Purchased'}
            </button>
            <button
              onClick={onDelete}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
              aria-label="Remove from wishlist"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton card for loading state
 */
function WishlistItemSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Sort dropdown
 */
function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>{SORT_LABELS[value]}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 min-h-[44px] ${
                value === option ? 'text-primary font-medium' : 'text-gray-700'
              }`}
            >
              {SORT_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortValue, setSortValue] = useState<SortOption>('priority');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Load wishlist data
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const wishlistItems = await getWishlist(user.uid);
        setItems(wishlistItems);
      } catch (err) {
        console.error('Failed to load wishlist:', err);
        setError('Failed to load your wishlist. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...items];

    switch (sortValue) {
      case 'priority':
        return sorted.sort((a, b) => {
          const aPriority = a.priority ? PRIORITY_ORDER[a.priority] : 3;
          const bPriority = b.priority ? PRIORITY_ORDER[b.priority] : 3;
          if (aPriority !== bPriority) return aPriority - bPriority;
          // Secondary sort by createdAt desc
          const aTime = a.createdAt
            ? typeof a.createdAt === 'number'
              ? a.createdAt
              : 'toMillis' in a.createdAt
                ? a.createdAt.toMillis()
                : 0
            : 0;
          const bTime = b.createdAt
            ? typeof b.createdAt === 'number'
              ? b.createdAt
              : 'toMillis' in b.createdAt
                ? b.createdAt.toMillis()
                : 0
            : 0;
          return bTime - aTime;
        });

      case 'createdAt-desc':
        return sorted.sort((a, b) => {
          const aTime = a.createdAt
            ? typeof a.createdAt === 'number'
              ? a.createdAt
              : 'toMillis' in a.createdAt
                ? a.createdAt.toMillis()
                : 0
            : 0;
          const bTime = b.createdAt
            ? typeof b.createdAt === 'number'
              ? b.createdAt
              : 'toMillis' in b.createdAt
                ? b.createdAt.toMillis()
                : 0
            : 0;
          return bTime - aTime;
        });

      case 'createdAt-asc':
        return sorted.sort((a, b) => {
          const aTime = a.createdAt
            ? typeof a.createdAt === 'number'
              ? a.createdAt
              : 'toMillis' in a.createdAt
                ? a.createdAt.toMillis()
                : 0
            : 0;
          const bTime = b.createdAt
            ? typeof b.createdAt === 'number'
              ? b.createdAt
              : 'toMillis' in b.createdAt
                ? b.createdAt.toMillis()
                : 0
            : 0;
          return aTime - bTime;
        });

      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));

      default:
        return sorted;
    }
  }, [items, sortValue]);

  // Handle delete
  const handleDelete = useCallback(
    async (itemId: string) => {
      if (!user || deletingId) return;

      try {
        setDeletingId(itemId);
        await deleteWishlistItem(user.uid, itemId);
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        showToast('Removed from wishlist', { type: 'success' });
      } catch (err) {
        console.error('Failed to delete wishlist item:', err);
        showToast('Failed to remove item', { type: 'error' });
      } finally {
        setDeletingId(null);
      }
    },
    [user, deletingId, showToast]
  );

  // Handle mark as purchased (move to books)
  const handleMarkPurchased = useCallback(
    async (item: WishlistItem) => {
      if (!user || purchasingId) return;

      try {
        setPurchasingId(item.id);

        // Add to books collection
        await addBook(user.uid, {
          title: item.title,
          author: item.author,
          isbn: item.isbn || undefined,
          coverImageUrl: item.coverImageUrl || undefined,
          covers: item.covers || undefined,
          publisher: item.publisher || undefined,
          publishedDate: item.publishedDate || undefined,
          pageCount: item.pageCount,
          notes: item.notes || undefined,
          reads: [], // Start with no reads (want-to-read status)
        });

        // Remove from wishlist
        await deleteWishlistItem(user.uid, item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        showToast('Added to your library!', { type: 'success' });
      } catch (err) {
        console.error('Failed to mark as purchased:', err);
        showToast('Failed to add to library', { type: 'error' });
      } finally {
        setPurchasingId(null);
      }
    },
    [user, purchasingId, showToast]
  );

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <WishlistItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-red-700 font-medium">Error loading wishlist</p>
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
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" aria-hidden="true" />
            Wishlist
          </h1>
          {items.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {items.length} {items.length === 1 ? 'book' : 'books'}
            </p>
          )}
        </div>
        {items.length > 0 && <SortDropdown value={sortValue} onChange={setSortValue} />}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-medium text-gray-900 mt-4">Your wishlist is empty</h2>
          <p className="text-gray-500 mt-1">
            Keep track of books you want to buy by adding them to your wishlist.
          </p>
          <p className="text-gray-400 text-sm mt-3">
            Search for a book and tap &ldquo;Add to Wishlist&rdquo; to get started.
          </p>
        </div>
      ) : (
        /* Wishlist items */
        <div className="space-y-4">
          {sortedItems.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              onDelete={() => handleDelete(item.id)}
              onMarkPurchased={() => handleMarkPurchased(item)}
              isDeleting={deletingId === item.id}
              isPurchasing={purchasingId === item.id}
            />
          ))}
        </div>
      )}

      {/* Info card */}
      {items.length > 0 && (
        <div className="mt-8 bg-pink-50 border border-pink-100 rounded-xl p-4">
          <div className="flex gap-3">
            <ShoppingBag className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-pink-800">
              <p className="font-medium">Bought a book?</p>
              <p className="mt-1 text-pink-700">
                Tap &ldquo;Purchased&rdquo; to move it to your library and start tracking your reading progress.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
