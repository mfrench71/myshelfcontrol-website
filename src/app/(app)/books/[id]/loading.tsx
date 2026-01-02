/**
 * Book Detail Loading Skeleton
 * Shows during route transitions to book detail page
 */

export default function BookDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Cover skeleton */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div className="w-48 h-72 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Details skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />

          {/* Badges skeleton */}
          <div className="flex gap-2 flex-wrap">
            <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse" />
          </div>

          {/* Rating skeleton */}
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />

          {/* Action buttons skeleton */}
          <div className="flex gap-2 pt-4">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Sections skeleton */}
      <div className="mt-8 space-y-4">
        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
