"use client";

import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { BarFill } from "@/components/ui/bar-fill";
import { Badge } from "@/components/ui/badge";
import { FEATURE_DATA, MODEL_DATA, ROUTE_LOG, OPTIMISATIONS } from "@/lib/constants";
import { formatNaira } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const COLOR_MAP: Record<string, string> = {
  openai: "#10A37F", anthropic: "#D4A274", google: "#4285F4",
  meta: "#0668E1", naira: "#FFB800", mistral: "#FF7200",
  deepseek: "#4D6BFE", teal: "#2DD4BF", purple: "#A855F7",
  blue: "#4D8AFF",
};

const DAILY_SPEND = [
  { day: "Feb 8", spend: 98000 },
  { day: "Feb 9", spend: 112000 },
  { day: "Feb 10", spend: 105000 },
  { day: "Feb 11", spend: 134000 },
  { day: "Feb 12", spend: 98600 },
  { day: "Feb 13", spend: 127000 },
  { day: "Feb 14", spend: 118000 },
  { day: "Feb 15", spend: 142000 },
  { day: "Feb 16", spend: 108000 },
  { day: "Feb 17", spend: 131000 },
  { day: "Feb 18", spend: 131400 },
  { day: "Feb 19", spend: 118200 },
  { day: "Feb 20", spend: 124800 },
  { day: "Feb 21", spend: 136000 },
];

function SpendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[11px] text-text-dim">{label}</div>
      <div className="font-mono text-sm font-semibold text-accent">{formatNaira(payload[0].value)}</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div>
      {/* Savings Banner */}
      <div className="bg-gradient-to-r from-[rgba(0,210,106,0.06)] to-transparent border border-[rgba(0,210,106,0.2)] rounded-[10px] px-[18px] py-4 flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5 text-[13px]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
              fill="#00D26A"
              fillOpacity="0.2"
              stroke="#00D26A"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            Smart Routing found{" "}
            <strong className="text-accent">₦1,138,880 in potential savings</strong>{" "}
            this month across 5 recommendations.
          </span>
        </div>
        <Link href="/recommendations" className="bg-accent text-black border-none px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap no-underline">
          Review →
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-2.5 mb-5">
        <StatCard label="Total Spend" value="₦2.85M" change="↓ 8% vs last month" changeType="up" color="#FFB800" />
        <StatCard label="API Calls" value="1.24M" change="↑ 12% vs last month" changeType="up" />
        <StatCard label="Active Models" value="8" change="3 global · 2 African · 3 open" />
        <StatCard label="Saved This Month" value="₦486K" change="via smart routing" changeType="up" color="#00D26A" />
        <StatCard label="More Savings Found" value="₦1.14M" change="5 recommendations" color="#00D26A" />
      </div>

      {/* Feature Spend + Model Usage */}
      <div className="grid grid-cols-[3fr_2fr] gap-2.5 mb-2.5">
        <Panel title="Spend by Feature" icon="⬡">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.06em] text-text-dim font-semibold">
                <th className="text-left pb-2.5">Feature</th>
                <th className="text-left pb-2.5">Model</th>
                <th className="text-left pb-2.5">Calls</th>
                <th className="text-left pb-2.5 w-[100px]">Spend</th>
                <th className="text-left pb-2.5">Cost</th>
                <th className="text-right pb-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_DATA.slice(0, 5).map((f, i) => (
                <tr
                  key={i}
                  className={`border-t border-border ${i % 2 === 1 ? "bg-[rgba(255,255,255,0.015)]" : ""}`}
                >
                  <td className="py-2.5">
                    <span className="font-medium text-[13px]">{f.name}</span>
                    <span className="font-mono text-[10px] text-text-dim bg-bg px-1.5 py-px rounded ml-1.5">
                      {f.tag}
                    </span>
                  </td>
                  <td>
                    <span className={`font-mono text-xs ${f.african ? "text-naira" : "text-text-sec"}`}>
                      {f.model}
                    </span>
                  </td>
                  <td><span className="font-mono text-[13px] text-text-sec">{f.calls}</span></td>
                  <td>
                    <BarFill
                      pct={f.pct}
                      color={f.pct > 70 ? "#FF4D4D" : f.pct > 40 ? "#FFB800" : "#00D26A"}
                    />
                  </td>
                  <td><span className="font-mono text-[13px] font-medium">{formatNaira(f.cost)}</span></td>
                  <td className="text-right">
                    {f.actionable ? (
                      <span className="text-[11px] font-medium px-2.5 py-[4px] rounded-full bg-[rgba(0,210,106,0.1)] text-accent cursor-pointer border border-[rgba(0,210,106,0.2)] hover:bg-[rgba(0,210,106,0.16)] transition-colors">
                        {f.tip}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-[3px] rounded-full text-text-dim">
                        {f.tip}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Model Usage" icon="◈">
          <div className="flex flex-col gap-4">
            {/* Spend trend chart */}
            <div>
              <div className="text-[11px] text-text-dim font-medium mb-2 uppercase tracking-[0.05em]">
                Daily Spend · 14d
              </div>
              <div className="h-[120px] -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DAILY_SPEND} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D26A" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#00D26A" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1F1F2E"
                      vertical={false}
                    />
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip content={<SpendTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      stroke="rgba(0,210,106,0.6)"
                      strokeWidth={2}
                      fill="url(#spendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model bars */}
            <div className="flex flex-col gap-3">
              {MODEL_DATA.slice(0, 6).map((m, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      background: `${COLOR_MAP[m.color] || "#666"}20`,
                      color: COLOR_MAP[m.color] || "#666",
                    }}
                  >
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[13px] font-medium">{m.name}</span>
                      <span className="font-mono text-xs text-text-sec">{formatNaira(m.spend)}</span>
                    </div>
                    <BarFill pct={m.pct} color={COLOR_MAP[m.color] || "#666"} height={4} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Routing + Recommendations */}
      <div className="grid grid-cols-2 gap-2.5">
        <Panel title="Smart Routing · Live" icon="⇋">
          <div className="flex flex-col gap-2">
            {ROUTE_LOG.slice(0, 5).map((r, i) => (
              <div key={i} className="flex gap-2.5 p-2.5 bg-bg rounded-md border border-border">
                <div className="font-mono text-[10px] text-text-dim w-[42px] shrink-0 pt-0.5">
                  {r.time}
                </div>
                <div>
                  <div className="text-xs text-text-sec leading-relaxed">
                    <strong className="text-text">{r.agent}</strong> — {r.action}{" "}
                    {r.to && <span className="text-accent font-mono text-[11px]">{r.to}</span>}
                    {r.from && (
                      <>
                        {" "}instead of{" "}
                        <span className="text-red font-mono text-[11px] line-through opacity-60">
                          {r.from}
                        </span>
                      </>
                    )}
                    . {r.reason}{" "}
                    {r.saved && <span className="text-accent font-semibold">Saved {r.saved}</span>}
                  </div>
                  <span
                    className="inline-block text-[9px] uppercase tracking-[0.05em] px-[5px] py-px rounded font-semibold mt-1"
                    style={{
                      background:
                        r.tag === "routed" ? "rgba(0,210,106,0.08)"
                        : r.tag === "optimal" ? "rgba(255,184,0,0.08)"
                        : r.tag === "cached" ? "rgba(168,85,247,0.08)"
                        : "rgba(77,138,255,0.08)",
                      color:
                        r.tag === "routed" ? "#00D26A"
                        : r.tag === "optimal" ? "#FFB800"
                        : r.tag === "cached" ? "#A855F7"
                        : "#4D8AFF",
                    }}
                  >
                    {r.tag === "routed" ? "Smart Routed" : r.tag === "optimal" ? "Optimal" : r.tag === "cached" ? "Cache Hit" : "Fallback"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Top Recommendations"
          icon="💡"
          right={<span className="text-[11px] text-accent font-semibold">₦1.14M saveable</span>}
        >
          <div className="flex flex-col gap-2.5">
            {OPTIMISATIONS.slice(0, 4).map((o, i) => (
              <div key={i} className="p-3 bg-bg border border-border rounded-md flex gap-2.5 cursor-pointer hover:border-border-light transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{
                    background:
                      o.type === "save" ? "rgba(0,210,106,0.08)"
                      : o.type === "swap" ? "rgba(255,184,0,0.08)"
                      : o.type === "cache" ? "rgba(77,138,255,0.08)"
                      : "rgba(168,85,247,0.08)",
                  }}
                >
                  {o.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold mb-0.5">{o.title}</div>
                  <div className="text-xs text-text-dim leading-relaxed">{o.desc}</div>
                </div>
                <div className="font-mono text-sm font-semibold text-accent whitespace-nowrap pt-0.5">
                  {o.amount}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
