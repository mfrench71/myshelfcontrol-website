/**
 * Bin Loading Skeleton
 * Shows during route transitions to bin page
 */

export default function BinLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-16 mb-6 animate-pulse" />

      {/* Book list skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
