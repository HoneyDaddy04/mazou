import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  className?: string;
}

export function Badge({ children, color, bg, className }: BadgeProps) {
  return (
    <span
      className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono", className)}
      style={{
        color: color || "var(--color-accent)",
        background: bg || "rgba(0,210,106,0.08)",
      }}
    >
      {children}
    </span>
  );
}
