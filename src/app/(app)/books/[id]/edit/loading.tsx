/**
 * Book Edit Loading Skeleton
 * Shows during route transitions to book edit page
 */

export default function BookEditLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
      </div>

      {/* Cover section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex gap-4">
          <div className="w-24 h-36 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse mt-2" />
          </div>
        </div>
      </div>

      {/* Form sections skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}

      {/* Delete section skeleton */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
    </div>
  );
}
