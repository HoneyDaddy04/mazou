import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  color?: string;
  index?: number;
}

export function StatCard({ label, value, change, changeType, color, index = 0 }: StatCardProps) {
  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 hover-lift animate-in"
      style={{
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.06em] text-text-dim font-medium mb-1.5">
        {label}
      </div>
      <div
        className="font-mono text-2xl font-extrabold tracking-[-0.02em] mb-1"
        style={{ color: color ?? "var(--color-text)" }}
      >
        {value}
      </div>
      {change && (
        <div
          className={cn(
            "text-[11px]",
            changeType === "up" ? "text-emerald-600" : changeType === "down" ? "text-red" : "text-text-dim"
          )}
        >
          {change}
        </div>
      )}
    </div>
  );
}
