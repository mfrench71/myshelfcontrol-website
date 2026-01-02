/**
 * Maintenance Loading Skeleton
 * Shows during route transitions to maintenance page
 */

export default function MaintenanceLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-40 mb-4 animate-pulse" />

      {/* Library Health section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
      </div>

      {/* Genre Counts section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="h-5 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-72 mb-4 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
      </div>

      {/* Orphaned Images section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-80 mb-4 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
      </div>
    </div>
  );
}
