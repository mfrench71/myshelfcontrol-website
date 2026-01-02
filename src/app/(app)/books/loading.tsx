/**
 * Books List Loading Skeleton
 * Shows during route transitions to books page
 */

function BookCardSkeleton() {
  return (
    <div className="flex gap-4 p-3 bg-white border border-gray-200 rounded-xl">
      <div className="w-16 h-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 py-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
      </div>
    </div>
  );
}

function FilterSidebarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
        <div className="h-8 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function BooksLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-10 animate-pulse md:hidden" />
      </div>

      {/* Mobile sort skeleton */}
      <div className="flex gap-2 mb-4 md:hidden">
        <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar skeleton */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <FilterSidebarSkeleton />
        </aside>

        {/* Books skeleton */}
        <div className="flex-1 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
