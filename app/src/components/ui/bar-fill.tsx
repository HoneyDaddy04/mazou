interface BarFillProps {
  pct: number;
  color: string;
  height?: number;
}

export function BarFill({ pct, color, height = 6 }: BarFillProps) {
  return (
    <div
      className="w-full bg-gray-100 overflow-hidden"
      style={{ height, borderRadius: height / 2 }}
    >
      <div
        className="h-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: `${pct}%`,
          borderRadius: height / 2,
          background: color,
        }}
      />
    </div>
  );
}
