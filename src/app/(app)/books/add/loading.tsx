/**
 * Add Book Loading Skeleton
 * Shows during route transitions to add book page
 */

export default function AddBookLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse" />

      {/* Tab buttons skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse" />
      </div>

      {/* Search section skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4 animate-pulse" />
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-16 animate-pulse" />
        </div>
      </div>

      {/* Results area skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
