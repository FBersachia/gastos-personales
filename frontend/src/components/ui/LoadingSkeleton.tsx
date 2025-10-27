interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'list' | 'dashboard';
  rows?: number;
}

export default function LoadingSkeleton({ type = 'table', rows = 5 }: LoadingSkeletonProps) {
  if (type === 'dashboard') {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        {/* Header skeleton */}
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Widgets skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Default: table skeleton
  return (
    <div className="animate-pulse">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
        {/* Table rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded flex-1"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
