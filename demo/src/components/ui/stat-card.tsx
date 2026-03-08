import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  color?: string;
}

export function StatCard({ label, value, change, changeType, color }: StatCardProps) {
  return (
    <div
      className="relative bg-surface border border-border rounded-[10px] p-4 transition-all duration-200 hover:border-border-light hover:-translate-y-[1px] overflow-hidden"
      style={{
        borderTopColor: color ? color : undefined,
        borderTopWidth: color ? 2 : undefined,
      }}
    >
      {/* Subtle gradient overlay from color prop */}
      {color && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top left, ${color}0A 0%, transparent 60%)`,
          }}
        />
      )}
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.06em] text-text-dim font-medium mb-1.5">
          {label}
        </div>
        <div
          className="font-mono text-[24px] font-semibold tracking-[-0.02em] mb-1"
          style={{ color: color ?? "var(--color-text)" }}
        >
          {value}
        </div>
        {change && (
          <div
            className={cn(
              "text-[11px]",
              changeType === "up" ? "text-accent" : changeType === "down" ? "text-red" : "text-text-dim"
            )}
          >
            {change}
          </div>
        )}
      </div>
    </div>
  );
}
