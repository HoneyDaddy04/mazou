import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { BarFill } from "@/components/ui/bar-fill";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats, useAgents, useDepartments } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import { SimpleBarChart } from "@/components/ui/charts";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageError } from "@/components/ui/page-error";
import { LayoutList } from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  openai: "#10A37F", anthropic: "#C084FC", google: "#4285F4",
  meta: "#0668E1", naira: "#00E5A0", deepseek: "#4D6BFE",
  mistral: "#F43F5E", teal: "#2DD4BF", purple: "#A855F7",
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

export default function UsagePage() {
  const [tab, setTab] = useState("Features");
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(30);
  const { data: agents, isLoading: agentsLoading, error: agentsError } = useAgents();
  const { data: departments, isLoading: deptLoading } = useDepartments(30);

  const isLoading = statsLoading || agentsLoading || deptLoading;
  const error = statsError || agentsError;

  if (isLoading) return <PageSkeleton />;
  if (error) return <PageError message="Failed to load usage data" />;

  const models = stats?.models ?? [];
  const features = stats?.features ?? [];
  const maxModelSpend = Math.max(...models.map((m: any) => m.cost_kobo), 1);
  const maxFeatureCost = Math.max(...features.map((f: any) => f.cost_kobo), 1);

  // Find most expensive feature
  const topFeature = features.length > 0
    ? features.reduce((a: any, b: any) => a.cost_kobo > b.cost_kobo ? a : b)
    : null;
  const topFeaturePct = topFeature ? Math.round((topFeature.cost_kobo / stats.total_spend_kobo) * 100) : 0;

  // Avg cost per call
  const avgCostPerCall = stats.total_calls > 0 ? Math.round(stats.total_spend_kobo / stats.total_calls) : 0;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 mb-5 animate-in-stagger">
        <StatCard label="Total Spend" value={formatNaira(stats.total_spend_kobo)} change={stats.spend_change_pct != null ? `${stats.spend_change_pct >= 0 ? "↑" : "↓"} ${Math.abs(stats.spend_change_pct)}% vs last period` : "this period"} changeType={stats.spend_change_pct != null && stats.spend_change_pct <= 0 ? "up" : "down"} color="#00E5A0" />
        <StatCard label="Total Calls" value={stats.total_calls >= 1_000_000 ? `${(stats.total_calls / 1_000_000).toFixed(2)}M` : stats.total_calls >= 1_000 ? `${(stats.total_calls / 1_000).toFixed(0)}K` : String(stats.total_calls)} change="this period" changeType="up" />
        <StatCard label="Avg Cost/Call" value={formatNaira(avgCostPerCall)} change="via routing" changeType="up" color="#00E5A0" />
        <StatCard label="Most Expensive" value={topFeature?.tag ?? "N/A"} change={topFeature ? `${formatNaira(topFeature.cost_kobo)} - ${topFeaturePct}% of total` : ""} changeType="down" color="#EF4444" />
      </div>

      <Panel title="Spend by Model" icon={<LayoutList size={15} />} className="mb-5">
        <div className="h-[200px]">
          <SimpleBarChart
            data={models.map((m: any) => ({
              name: m.model,
              value: m.cost_kobo,
              color: COLOR_MAP[PROVIDER_COLOR[m.provider] || "blue"] || "#666",
            }))}
            layout="vertical"
            tooltipFormatter={formatNaira}
            height={200}
          />
        </div>
      </Panel>

      <Panel title="Usage Breakdown" icon={<LayoutList size={15} />} tabs={["Features", "Departments", "Agents", "Models"]} activeTab={tab} onTabChange={setTab}>
        {tab === "Features" && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.06em] text-text-dim font-semibold">
                <th className="text-left pb-2.5">Feature</th>
                <th className="text-left pb-2.5">Calls</th>
                <th className="text-left pb-2.5 w-[120px]">% of Spend</th>
                <th className="text-left pb-2.5">Cost</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f: any, i: number) => {
                const pct = Math.round((f.cost_kobo / maxFeatureCost) * 100);
                return (
                  <tr key={i} className="border-t border-border transition-colors duration-150 hover:bg-gray-50">
                    <td className="py-2.5">
                      <span className="font-medium text-[13px]">{f.tag}</span>
                    </td>
                    <td><span className="font-mono text-[13px] text-text-sec">{f.calls.toLocaleString()}</span></td>
                    <td><BarFill pct={pct} color={pct > 70 ? "#EF4444" : pct > 40 ? "#EAB308" : "#3B82F6"} /></td>
                    <td><span className="font-mono text-[13px] font-medium">{formatNaira(f.cost_kobo)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === "Departments" && (() => {
          const depts = departments ?? [];
          const maxDeptCost = Math.max(...depts.map((d: any) => d.cost_kobo), 1);
          return (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.06em] text-text-dim font-semibold">
                  <th className="text-left pb-2.5">Department / Team</th>
                  <th className="text-left pb-2.5">Calls</th>
                  <th className="text-left pb-2.5">Tokens</th>
                  <th className="text-left pb-2.5 w-[120px]">% of Spend</th>
                  <th className="text-left pb-2.5">Cost</th>
                </tr>
              </thead>
              <tbody>
                {depts.map((d: any, i: number) => {
                  const pct = Math.round((d.cost_kobo / maxDeptCost) * 100);
                  const totalTokens = (d.input_tokens + d.output_tokens);
                  return (
                    <tr key={i} className="border-t border-border transition-colors duration-150 hover:bg-gray-50">
                      <td className="py-2.5">
                        <span className="font-medium text-[13px]">{d.agent_tag}</span>
                      </td>
                      <td><span className="font-mono text-[13px] text-text-sec">{d.calls.toLocaleString()}</span></td>
                      <td><span className="font-mono text-[11px] text-text-dim">{totalTokens >= 1_000_000 ? `${(totalTokens / 1_000_000).toFixed(1)}M` : totalTokens >= 1_000 ? `${(totalTokens / 1_000).toFixed(0)}K` : String(totalTokens)}</span></td>
                      <td><BarFill pct={pct} color={pct > 70 ? "#EF4444" : pct > 40 ? "#EAB308" : "#3B82F6"} /></td>
                      <td><span className="font-mono text-[13px] font-medium">{formatNaira(d.cost_kobo)}</span></td>
                    </tr>
                  );
                })}
                {depts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-text-dim">
                      No department data yet. Tag requests with <code className="bg-bg px-1.5 py-0.5 rounded text-[11px]">agent_tag</code> to track spend by team.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          );
        })()}

        {tab === "Agents" && (
          <div>
            {(agents ?? []).map((a: any, i: number) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_0.7fr_0.8fr_0.7fr_0.7fr] items-center py-2.5 border-b border-border text-[13px] transition-colors duration-150 hover:bg-gray-50">
                <div className="flex items-center gap-2 font-medium">
                  <div className={`w-1.5 h-1.5 rounded-full ${a.status === "live" ? "bg-accent" : "bg-text-dim"}`} />
                  {a.name}
                </div>
                <span className="font-mono text-[11px] text-text-dim">{a.models || a.model || ""}</span>
                <span className="font-mono text-text-sec">{typeof a.calls === "number" ? a.calls.toLocaleString() : a.calls}</span>
                <span className="font-mono font-medium">{typeof a.cost_kobo === "number" ? formatNaira(a.cost_kobo) : a.cost}</span>
                <span className={`font-mono ${a.trend_up || a.up ? "text-red" : "text-accent"}`}>{a.trend || ""}</span>
                <span className="font-mono text-[11px] text-text-dim">{a.uptime || ""}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Models" && (
          <div>
            {models.map((m: any, i: number) => {
              const colorKey = PROVIDER_COLOR[m.provider] || "blue";
              const icon = PROVIDER_ICON[m.provider] || m.provider?.slice(0, 2).toUpperCase();
              const pct = Math.round((m.cost_kobo / maxModelSpend) * 100);
              return (
                <div key={i} className="grid grid-cols-[2fr_1fr_0.7fr_0.7fr_1fr] items-center py-2.5 border-b border-border text-[13px] transition-colors duration-150 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-[5px] flex items-center justify-center text-[9px] font-bold"
                      style={{ background: `${COLOR_MAP[colorKey]}20`, color: COLOR_MAP[colorKey] }}
                    >
                      {icon}
                    </div>
                    <span className="font-medium">{m.model}</span>
                    {m.provider === "African" && <Badge color="#00E5A0" bg="rgba(255,184,0,0.08)">African</Badge>}
                  </div>
                  <span className="font-mono text-text-sec">{typeof m.calls === "number" ? m.calls.toLocaleString() : m.calls}</span>
                  <span className="font-mono text-text-sec">{m.latency || ""}</span>
                  <span className="font-mono font-medium">{formatNaira(m.cost_kobo)}</span>
                  <BarFill pct={pct} color={COLOR_MAP[colorKey] || "#666"} height={4} />
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
