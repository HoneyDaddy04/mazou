export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4 h-[88px]">
            <div className="h-2.5 bg-border rounded w-20 mb-3" />
            <div className="h-5 bg-border rounded w-28 mb-2" />
            <div className="h-2 bg-border rounded w-24" />
          </div>
        ))}
      </div>
      {/* Panel skeleton */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="h-3.5 bg-border rounded w-40 mb-5" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-border/50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 animate-pulse">
      <div className="h-2.5 bg-border rounded w-20 mb-3" />
      <div className="h-5 bg-border rounded w-28 mb-2" />
      <div className="h-2 bg-border rounded w-24" />
    </div>
  );
}
