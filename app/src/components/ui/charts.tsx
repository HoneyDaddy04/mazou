import { useState, useRef, useCallback, useId } from "react";

/* ───────────────────────── Shared tooltip ───────────────────────── */

function ChartTooltip({
  x,
  y,
  containerRect,
  children,
}: {
  x: number;
  y: number;
  containerRect: DOMRect | null;
  children: React.ReactNode;
}) {
  if (!containerRect) return null;
  // Position tooltip so it doesn't overflow the container
  const left = x;
  const top = y;
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left,
        top,
        transform: "translate(-50%, -110%)",
      }}
    >
      <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────── SimpleAreaChart ───────────────────────── */

interface AreaDatum {
  label: string;
  value: number;
}

interface SimpleAreaChartProps {
  data: AreaDatum[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  tooltipFormatter?: (value: number) => string;
  gradientOpacity?: [number, number];
}

export function SimpleAreaChart({
  data,
  color = "#3B82F6",
  height = 120,
  showGrid = false,
  showTooltip = true,
  tooltipFormatter = String,
  gradientOpacity = [0.1, 0.01],
}: SimpleAreaChartProps) {
  const gradId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    index: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const n = data.length;
  if (n === 0) return null;

  const padX = 0;
  const padTop = 6;
  const padBot = 4;
  const vbW = 400;
  const vbH = height;
  const chartW = vbW - padX * 2;
  const chartH = vbH - padTop - padBot;

  const vals = data.map((d) => d.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const points = data.map((d, i) => ({
    x: padX + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
    y: padTop + chartH - ((d.value - minV) / range) * chartH,
  }));

  // Build SVG path (linear interpolation)
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[n - 1].x},${vbH} L${points[0].x},${vbH} Z`;

  // Grid lines (4 horizontal)
  const gridLines = showGrid
    ? [0.25, 0.5, 0.75].map((frac) => padTop + chartH * (1 - frac))
    : [];

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || n === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const pct = relX / rect.width;
      const idx = Math.round(pct * (n - 1));
      const clampedIdx = Math.max(0, Math.min(n - 1, idx));
      setHover({
        index: clampedIdx,
        mouseX: (points[clampedIdx].x / vbW) * rect.width,
        mouseY: (points[clampedIdx].y / vbH) * rect.height,
      });
    },
    [n, points, vbW, vbH],
  );

  const handleMouseLeave = useCallback(() => setHover(null), []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={gradientOpacity[0]} />
            <stop offset="100%" stopColor={color} stopOpacity={gradientOpacity[1]} />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={padX}
            x2={vbW - padX}
            y1={y}
            y2={y}
            stroke="#E5E7EB"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeOpacity={0.6}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover indicator */}
        {hover !== null && (
          <>
            <line
              x1={points[hover.index].x}
              x2={points[hover.index].x}
              y1={padTop}
              y2={vbH - padBot}
              stroke={color}
              strokeOpacity={0.3}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={points[hover.index].x}
              cy={points[hover.index].y}
              r={3}
              fill={color}
              stroke="white"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {showTooltip && hover !== null && (
        <ChartTooltip
          x={hover.mouseX}
          y={hover.mouseY}
          containerRect={containerRef.current?.getBoundingClientRect() ?? null}
        >
          <div className="text-[11px] text-text-dim">{data[hover.index].label}</div>
          <div className="font-mono text-sm font-semibold text-accent">
            {tooltipFormatter(data[hover.index].value)}
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}

/* ───────────────────────── SimpleBarChart ───────────────────────── */

interface BarDatum {
  name: string;
  value: number;
  color: string;
}

interface SimpleBarChartProps {
  data: BarDatum[];
  height?: number;
  layout?: "horizontal" | "vertical";
  tooltipFormatter?: (value: number) => string;
}

export function SimpleBarChart({
  data,
  height = 200,
  layout = "vertical",
  tooltipFormatter = String,
}: SimpleBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value));
  const barH = 18;
  const gap = 8;
  const labelW = 80;
  const axisPad = 24;

  if (layout === "vertical") {
    // Horizontal bars (vertical layout in Recharts = bars going left-to-right)
    const totalH = data.length * (barH + gap) - gap + axisPad;
    const usedHeight = Math.max(height, totalH);

    const handleBarMouseMove = (
      e: React.MouseEvent,
      idx: number,
    ) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setHoverIdx(idx);
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    // Tick values for x-axis
    const tickCount = 4;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
      Math.round((maxVal / tickCount) * i),
    );

    return (
      <div ref={containerRef} className="relative w-full" style={{ height: usedHeight }}>
        <svg className="w-full h-full" viewBox={`0 0 600 ${totalH}`} preserveAspectRatio="xMidYMid meet">
          {data.map((d, i) => {
            const barWidth = maxVal > 0 ? (d.value / maxVal) * (600 - labelW - 16) : 0;
            const y = i * (barH + gap);

            return (
              <g
                key={i}
                onMouseMove={(e) => handleBarMouseMove(e as unknown as React.MouseEvent, i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: "default" }}
              >
                {/* Hover background */}
                {hoverIdx === i && (
                  <rect
                    x={labelW}
                    y={y - 2}
                    width={600 - labelW}
                    height={barH + 4}
                    fill="rgba(0,0,0,0.03)"
                    rx={4}
                  />
                )}
                {/* Label */}
                <text
                  x={labelW - 8}
                  y={y + barH / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="#999"
                  fontSize={11}
                  fontFamily="inherit"
                >
                  {d.name}
                </text>
                {/* Bar */}
                <rect
                  x={labelW}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill={d.color}
                  fillOpacity={0.85}
                  rx={4}
                  ry={4}
                />
              </g>
            );
          })}

          {/* X-axis tick labels */}
          {ticks.map((tick, i) => {
            const x = labelW + (maxVal > 0 ? (tick / maxVal) * (600 - labelW - 16) : 0);
            const y = data.length * (barH + gap) + 16;
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                fill="#666"
                fontSize={10}
                fontFamily="inherit"
              >
                {tooltipFormatter(tick)}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoverIdx !== null && (
          <ChartTooltip
            x={mousePos.x}
            y={mousePos.y}
            containerRect={containerRef.current?.getBoundingClientRect() ?? null}
          >
            <div className="text-[11px] text-text-dim">{data[hoverIdx].name}</div>
            <div className="font-mono text-sm font-semibold text-accent">
              {tooltipFormatter(data[hoverIdx].value)}
            </div>
          </ChartTooltip>
        )}
      </div>
    );
  }

  // Horizontal layout (vertical bars) - basic implementation
  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg className="w-full h-full">
        {data.map((d, i) => {
          const barWidth = (1 / data.length) * 100;
          const barHeight = maxVal > 0 ? (d.value / maxVal) * (height - 24) : 0;
          return (
            <rect
              key={i}
              x={`${i * barWidth + barWidth * 0.15}%`}
              y={height - 24 - barHeight}
              width={`${barWidth * 0.7}%`}
              height={barHeight}
              fill={d.color}
              fillOpacity={0.85}
              rx={4}
            />
          );
        })}
      </svg>
    </div>
  );
}

/* ───────────────────────── Sparkline ───────────────────────── */

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fillOpacity?: number;
  animated?: boolean;
}

export function Sparkline({
  data,
  color = "#3B82F6",
  height = 32,
  width = 80,
  fillOpacity = 0.3,
}: SparklineProps) {
  const gradId = useId();
  const n = data.length;
  if (n < 2) return null;

  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const range = maxV - minV || 1;
  const pad = 1;
  const chartW = width;
  const chartH = height;

  const points = data.map((v, i) => ({
    x: pad + (i / (n - 1)) * (chartW - pad * 2),
    y: pad + (chartH - pad * 2) - ((v - minV) / range) * (chartH - pad * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[n - 1].x},${chartH} L${points[0].x},${chartH} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${chartW} ${chartH}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
