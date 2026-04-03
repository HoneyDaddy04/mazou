import { Link } from "react-router";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { BarFill } from "@/components/ui/bar-fill";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats, useDashboardUsage, useRecommendations } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import { SimpleAreaChart } from "@/components/ui/charts";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageError } from "@/components/ui/page-error";
import { LayoutList, BarChart3, ArrowLeftRight, TrendingDown, DollarSign, RefreshCw, Package, Timer, Globe, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const OPT_ICON_MAP: Record<string, LucideIcon> = { DollarSign, RefreshCw, Package, Timer, Globe };

const COLOR_MAP: Record<string, string> = {
  openai: "#10A37F", anthropic: "#C084FC", google: "#4285F4",
  meta: "#0668E1", naira: "#00E5A0", mistral: "#F43F5E",
  deepseek: "#4D6BFE", teal: "#2DD4BF", purple: "#A855F7",
  blue: "#4D8AFF",
};

const PROVIDER_COLOR: Record<string, string> = {
  OpenAI: "openai", Anthropic: "anthropic", Google: "google",
  Meta: "meta", DeepSeek: "deepseek", Mistral: "mistral",
  "Lelapa AI": "naira", African: "naira",
};

const PROVIDER_ICON: Record<string, string> = {
  OpenAI: "OA", Anthropic: "AN", Google: "GO",
  Meta: "MT", DeepSeek: "DS", Mistral: "MI",
  "Lelapa AI": "AF", African: "AF",
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(30);
  const { data: usage, isLoading: usageLoading, error: usageError } = useDashboardUsage(14, "day");
  const { data: recommendations, isLoading: recsLoading, error: recsError } = useRecommendations();

  const isLoading = statsLoading || usageLoading || recsLoading;
  const error = statsError || usageError || recsError;

  if (isLoading) return <PageSkeleton />;
  if (error) return <PageError message="Failed to load dashboard data" />;

  const totalSaveable = recommendations?.reduce?.((sum: number, r: any) => sum + (r.savings_kobo || 0), 0) ?? 0;
  const recsCount = recommendations?.length ?? 0;

  // Map model data for bars - compute max spend for percentage
  const models = stats?.models ?? [];
  const maxModelSpend = Math.max(...models.map((m: any) => m.cost_kobo), 1);

  const isNewUser = (stats?.total_calls ?? 0) === 0;

  return (
    <div>
      {/* Onboarding Banner - shown when user has 0 API calls */}
      {isNewUser && (
        <div className="bg-[#00E5A0]/8 border border-[#00E5A0]/20 rounded-lg px-4 py-3.5 flex items-center justify-between mb-4 animate-in">
          <div className="flex items-center gap-2.5 text-[13px]">
            <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/10 flex items-center justify-center shrink-0">
              <Rocket size={16} className="text-[#00E5A0]" />
            </div>
            <span>
              <strong className="text-[#00E5A0]">Welcome!</strong>{" "}
              Get your first API call working in 2 minutes with our quickstart guide.
            </span>
          </div>
          <Link to="/quickstart" className="bg-[#00E5A0] text-[#0A1628] border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap no-underline hover:bg-[#00E5A0]/90 hover-lift">
            Start here &rarr;
          </Link>
        </div>
      )}

      {/* Savings Banner */}
      <div className="bg-accent-light border border-[rgba(59,130,246,0.15)] rounded-lg px-4 py-3.5 flex items-center justify-between mb-6 animate-in">
        <div className="flex items-center gap-2.5 text-[13px]">
          <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center shrink-0">
            <TrendingDown size={16} className="text-accent" />
          </div>
          <span>
            <strong className="text-accent">Smart Routing</strong> found{" "}
            <strong className="text-accent">{formatNaira(totalSaveable)} in potential savings</strong>{" "}
            this month across {recsCount} recommendations.
          </span>
        </div>
        <Link to="/recommendations" className="bg-accent text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap no-underline hover:bg-accent-muted hover-lift">
          Review →
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6 animate-in-stagger">
        <StatCard label="Total Spend" value={formatNaira(stats?.total_spend_kobo ?? 0)} change={stats?.spend_change_pct != null ? `${stats.spend_change_pct >= 0 ? "↑" : "↓"} ${Math.abs(stats.spend_change_pct)}% vs last month` : "this period"} changeType={stats?.spend_change_pct != null && stats.spend_change_pct <= 0 ? "up" : "down"} color="#00E5A0" index={0} />
        <StatCard label="API Calls" value={(stats?.total_calls ?? 0) >= 1_000_000 ? `${((stats?.total_calls ?? 0) / 1_000_000).toFixed(2)}M` : (stats?.total_calls ?? 0) >= 1_000 ? `${((stats?.total_calls ?? 0) / 1_000).toFixed(0)}K` : String(stats?.total_calls ?? 0)} change="this period" index={1} />
        <StatCard label="Active Models" value={String(stats?.active_models ?? 0)} change="across all features" index={2} />
        <StatCard label="Saved This Month" value={formatNaira(stats?.savings_kobo ?? 0)} change="via smart routing" changeType="up" color="#00E5A0" index={3} />
        <StatCard label="More Savings Found" value={formatNaira(totalSaveable)} change={`${recsCount} recommendations`} color="#00E5A0" index={4} />
      </div>

      {/* Feature Spend + Model Usage */}
      <div className="grid grid-cols-[3fr_2fr] gap-4 mb-4">
        <Panel title="Spend by Feature" icon={<LayoutList size={15} />}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.06em] text-text-dim font-semibold">
                <th className="text-left pb-2.5">Feature</th>
                <th className="text-left pb-2.5">Calls</th>
                <th className="text-left pb-2.5 w-[100px]">Spend</th>
                <th className="text-left pb-2.5">Cost</th>
              </tr>
            </thead>
            <tbody>
              {(stats.features ?? []).slice(0, 5).map((f: any, i: number) => {
                const maxCost = Math.max(...(stats.features ?? []).map((x: any) => x.cost_kobo), 1);
                const pct = Math.round((f.cost_kobo / maxCost) * 100);
                return (
                  <tr
                    key={i}
                    className={`border-t border-border ${i % 2 === 1 ? "bg-gray-50" : ""}`}
                  >
                    <td className="py-2.5">
                      <span className="font-medium text-[13px]">{f.tag}</span>
                    </td>
                    <td><span className="font-mono text-[13px] text-text-sec">{f.calls.toLocaleString()}</span></td>
                    <td>
                      <BarFill
                        pct={pct}
                        color={pct > 70 ? "#EF4444" : pct > 40 ? "#EAB308" : "#3B82F6"}
                      />
                    </td>
                    <td><span className="font-mono text-[13px] font-medium">{formatNaira(f.cost_kobo)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title="Model Usage" icon={<BarChart3 size={15} />}>
          <div className="flex flex-col gap-4">
            {/* Spend trend chart */}
            <div>
              <div className="text-[11px] text-text-dim font-medium mb-2 uppercase tracking-[0.05em]">
                Daily Spend · 14d
              </div>
              <div className="h-[120px] -mx-1">
                <SimpleAreaChart
                  data={(usage?.data ?? []).map((d: any) => ({ label: d.date, value: d.cost_kobo }))}
                  tooltipFormatter={formatNaira}
                  color="#3B82F6"
                  showGrid={true}
                />
              </div>
            </div>

            {/* Model bars */}
            <div className="flex flex-col gap-3">
              {models.slice(0, 6).map((m: any, i: number) => {
                const colorKey = PROVIDER_COLOR[m.provider] || "blue";
                const icon = PROVIDER_ICON[m.provider] || m.provider?.slice(0, 2).toUpperCase();
                const pct = Math.round((m.cost_kobo / maxModelSpend) * 100);
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        background: `${COLOR_MAP[colorKey] || "#666"}20`,
                        color: COLOR_MAP[colorKey] || "#666",
                      }}
                    >
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[13px] font-medium">{m.model}</span>
                        <span className="font-mono text-xs text-text-sec">{formatNaira(m.cost_kobo)}</span>
                      </div>
                      <BarFill pct={pct} color={COLOR_MAP[colorKey] || "#666"} height={4} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      {/* Routing + Recommendations */}
      <div className="grid grid-cols-2 gap-4">
        <Panel title="Smart Routing · Live" icon={<ArrowLeftRight size={15} />}>
          <div className="flex flex-col gap-2">
            {(stats.recent_routes ?? []).slice(0, 5).map((r: any, i: number) => {
              const tag = r.savings_kobo > 0 ? "routed" : r.routed_to === r.routed_from ? "optimal" : "fallback";
              const timeAgo = r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
              return (
                <div key={i} className="flex gap-2.5 p-2.5 bg-bg rounded-md border border-border">
                  <div className="font-mono text-[10px] text-text-dim w-[42px] shrink-0 pt-0.5">
                    {timeAgo}
                  </div>
                  <div>
                    <div className="text-xs text-text-sec leading-relaxed">
                      <strong className="text-text">{r.request_id?.slice(0, 8)}</strong> - routed to{" "}
                      <span className="text-accent font-mono text-[11px]">{r.routed_to}</span>
                      {r.routed_from && r.routed_from !== r.routed_to && (
                        <>
                          {" "}instead of{" "}
                          <span className="text-red font-mono text-[11px] line-through opacity-60">
                            {r.routed_from}
                          </span>
                        </>
                      )}
                      . {r.reason}{" "}
                      {r.savings_kobo > 0 && <span className="text-accent font-semibold">Saved {formatNaira(r.savings_kobo)}</span>}
                    </div>
                    <span
                      className="inline-block text-[9px] uppercase tracking-[0.05em] px-[5px] py-px rounded font-semibold mt-1"
                      style={{
                        background:
                          tag === "routed" ? "rgba(59,130,246,0.08)"
                          : tag === "optimal" ? "rgba(0,229,160,0.08)"
                          : "rgba(77,138,255,0.08)",
                        color:
                          tag === "routed" ? "#3B82F6"
                          : tag === "optimal" ? "#00E5A0"
                          : "#4D8AFF",
                      }}
                    >
                      {tag === "routed" ? "Smart Routed" : tag === "optimal" ? "Optimal" : "Fallback"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Top Recommendations"
          icon={<TrendingDown size={15} />}
          right={<span className="text-[11px] text-accent font-semibold">{formatNaira(totalSaveable)} saveable</span>}
        >
          <div className="flex flex-col gap-2.5">
            {(recommendations ?? []).slice(0, 4).map((o: any, i: number) => {
              const type = o.type || "save";
              const iconName = o.icon || "DollarSign";
              return (
                <div key={i} className="p-3 bg-bg border border-border rounded-md flex gap-2.5 cursor-pointer hover:border-border-light transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{
                      background:
                        type === "save" ? "rgba(59,130,246,0.08)"
                        : type === "swap" ? "rgba(0,229,160,0.08)"
                        : type === "cache" ? "rgba(77,138,255,0.08)"
                        : "rgba(168,85,247,0.08)",
                    }}
                  >
                    {(() => { const Icon = OPT_ICON_MAP[iconName]; return Icon ? <Icon size={16} /> : <DollarSign size={16} />; })()}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold mb-0.5">{o.title}</div>
                    <div className="text-xs text-text-dim leading-relaxed">{o.description || o.desc}</div>
                  </div>
                  <div className="font-mono text-sm font-semibold text-accent whitespace-nowrap pt-0.5">
                    {formatNaira(o.savings_kobo || 0)}/mo
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
