/**
 * Profile Settings Loading Skeleton
 * Shows during route transitions to profile page
 */

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />

      {/* Profile photo section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Email section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
      </div>

      {/* Password section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
      </div>

      {/* Privacy section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="h-5 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
      </div>

      {/* Delete account section skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-5 bg-gray-200 rounded w-36 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-72 animate-pulse" />
      </div>
    </div>
  );
}
