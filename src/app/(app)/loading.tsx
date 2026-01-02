/**
 * Home Page Loading Skeleton
 * Shows during route transitions to home page
 */

function WidgetSkeleton({ size }: { size: 6 | 12 }) {
  const widthClass = size === 12 ? 'col-span-12' : 'col-span-12 md:col-span-6';
  return (
    <div className={`${widthClass} bg-white rounded-xl border border-gray-200 p-6`}>
      <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
      <div className="space-y-3">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      <div className="grid grid-cols-12 gap-4">
        <WidgetSkeleton size={12} />
        <WidgetSkeleton size={6} />
        <WidgetSkeleton size={6} />
        <WidgetSkeleton size={12} />
      </div>
    </div>
  );
}
