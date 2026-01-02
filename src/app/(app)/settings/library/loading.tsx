/**
 * Library Settings Loading Skeleton
 * Shows during route transitions to library settings page
 */

export default function LibraryLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />

      {/* Genres section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="h-5 bg-gray-200 rounded w-24 mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Series section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="h-5 bg-gray-200 rounded w-20 mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Backup section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
