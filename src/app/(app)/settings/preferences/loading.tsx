/**
 * Preferences Settings Loading Skeleton
 * Shows during route transitions to preferences page
 */

export default function PreferencesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />

      {/* Sync section skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse" />
        <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Widgets section skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56 mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Browser section skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      </div>
    </div>
  );
}
