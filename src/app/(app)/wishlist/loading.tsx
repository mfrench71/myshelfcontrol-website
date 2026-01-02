/**
 * Wishlist Loading Skeleton
 * Shows during route transitions to wishlist page
 */

function WishlistItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
      </div>
      <div className="flex gap-1">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function WishlistLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
      </div>

      {/* Sort controls skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      </div>

      {/* Wishlist items skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <WishlistItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
