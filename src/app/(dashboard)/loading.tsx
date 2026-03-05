export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-5 gap-2.5 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-[10px] p-4">
            <div className="h-3 w-20 bg-surface-2 rounded mb-2" />
            <div className="h-6 w-16 bg-surface-2 rounded mb-1" />
            <div className="h-3 w-24 bg-surface-2 rounded" />
          </div>
        ))}
      </div>
      {/* Panel skeleton */}
      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="h-4 w-32 bg-surface-2 rounded" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-2 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
