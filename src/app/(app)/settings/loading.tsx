/**
 * Settings Loading Skeleton
 * Shows during route transitions to settings pages
 */

export default function SettingsLoading() {
  return (
    <>
      {/* Mobile: Hub skeleton */}
      <div className="md:hidden max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Desktop: Profile skeleton (redirect destination) */}
      <div className="hidden md:block max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </>
  );
}
