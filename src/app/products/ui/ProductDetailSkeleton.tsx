export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen page-surface text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="skeleton-block h-4 w-24 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-panel border border-panel rounded-lg overflow-hidden">
            <div
              className="skeleton-block w-full"
              style={{ paddingTop: "100%" }}
            />
          </div>
          <div className="space-y-4">
            <div className="skeleton-block h-8 w-3/4 rounded" />
            <div className="skeleton-block h-4 w-1/3 rounded" />
            <div className="space-y-2">
              <div className="skeleton-block h-3 w-full rounded" />
              <div className="skeleton-block h-3 w-11/12 rounded" />
              <div className="skeleton-block h-3 w-4/5 rounded" />
            </div>
            <div className="flex gap-3">
              <div className="skeleton-block h-12 w-32 rounded-lg" />
              <div className="skeleton-block h-12 w-44 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="skeleton-block h-6 w-64 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="skeleton-block h-44 rounded-lg" />
                <div className="skeleton-block h-4 w-3/4 rounded" />
                <div className="skeleton-block h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
