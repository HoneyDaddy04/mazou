interface BarFillProps {
  pct: number;
  color: string;
  height?: number;
}

export function BarFill({ pct, color, height = 6 }: BarFillProps) {
  return (
    <div
      className="w-full bg-bg overflow-hidden"
      style={{ height, borderRadius: height / 2 }}
    >
      <div
        className="h-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: `${pct}%`,
          borderRadius: height / 2,
          background: `linear-gradient(180deg, ${color}dd 0%, ${color} 100%)`,
          boxShadow: `0 0 8px ${color}33, 0 0 2px ${color}22`,
        }}
      />
    </div>
  );
}
