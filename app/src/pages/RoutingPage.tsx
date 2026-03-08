import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats, useRoutingRules } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageError } from "@/components/ui/page-error";
import { ArrowLeftRight } from "lucide-react";

const TAG_BORDER_COLOR: Record<string, string> = {
  routed: "#3B82F6",
  optimal: "#00E5A0",
  cached: "#A855F7",
  fallback: "#4D8AFF",
};

export default function RoutingPage() {
  const [tab, setTab] = useState("Live Feed");
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(30);
  const { data: routingRules, isLoading: rulesLoading, error: rulesError } = useRoutingRules();

  const isLoading = statsLoading || rulesLoading;
  const error = statsError || rulesError;

  if (isLoading) return <PageSkeleton />;
  if (error) return <PageError message="Failed to load routing data" />;

  const routes = stats?.recent_routes ?? [];
  const routedCount = routes.filter((r: any) => r.routed_from && r.routed_from !== r.routed_to).length;
  const totalSavings = routes.reduce((sum: number, r: any) => sum + (r.savings_kobo || 0), 0);
  const fallbacks = routes.filter((r: any) => r.reason?.toLowerCase().includes("fallback") || r.reason?.toLowerCase().includes("timeout")).length;
  const cacheHits = routes.filter((r: any) => r.reason?.toLowerCase().includes("cache")).length;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 mb-5 animate-in-stagger">
        <StatCard label="Routed" value={routedCount.toLocaleString()} change={`${routes.length} total requests`} color="#3B82F6" />
        <StatCard label="Saved" value={formatNaira(totalSavings)} change="via smart routing" changeType="up" color="#00E5A0" />
        <StatCard label="Fallbacks" value={String(fallbacks)} change={routes.length > 0 ? `${((fallbacks / routes.length) * 100).toFixed(1)}% of requests` : "0%"} />
        <StatCard label="Cache Hits" value={String(cacheHits)} change={routes.length > 0 ? `${((cacheHits / routes.length) * 100).toFixed(1)}% hit rate` : "0%"} color="#A855F7" />
      </div>

      <Panel
        title={
          tab === "Live Feed" ? (
            <span className="flex items-center gap-2">
              Smart Routing
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-[10px] font-normal text-text-dim uppercase tracking-wider">Live Feed</span>
            </span>
          ) : (
            "Smart Routing"
          )
        }
        icon={<ArrowLeftRight size={15} />}
        tabs={["Live Feed", "Rules"]}
        activeTab={tab}
        onTabChange={setTab}
      >
        {tab === "Live Feed" && (
          <div className="flex flex-col gap-2.5">
            {routes.map((r: any, i: number) => {
              const tag = r.savings_kobo > 0 ? "routed" : r.routed_to === r.routed_from ? "optimal" : r.reason?.toLowerCase().includes("cache") ? "cached" : r.reason?.toLowerCase().includes("fallback") || r.reason?.toLowerCase().includes("timeout") ? "fallback" : "optimal";
              const timeAgo = r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
              return (
                <div
                  key={i}
                  className="flex gap-2.5 p-3 bg-bg rounded-md border border-border transition-colors duration-150 hover:bg-gray-50"
                  style={{}}
                >
                  <div className="font-mono text-[10px] text-text-dim w-[50px] shrink-0 pt-0.5">{timeAgo}</div>
                  <div className="flex-1">
                    <div className="text-xs text-text-sec leading-relaxed">
                      <strong className="text-text">{r.request_id?.slice(0, 8)}</strong> - routed to{" "}
                      <span className="text-accent font-mono text-[11px]">{r.routed_to}</span>
                      {r.routed_from && r.routed_from !== r.routed_to && (
                        <> instead of <span className="text-red font-mono text-[11px] line-through opacity-60">{r.routed_from}</span></>
                      )}
                      . {r.reason} {r.savings_kobo > 0 && <span className="text-accent font-semibold">Saved {formatNaira(r.savings_kobo)}</span>}
                    </div>
                    <span
                      className="inline-block text-[9px] uppercase tracking-[0.05em] px-[5px] py-px rounded font-semibold mt-1.5"
                      style={{
                        background: tag === "routed" ? "rgba(59,130,246,0.08)" : tag === "optimal" ? "rgba(0,229,160,0.08)" : tag === "cached" ? "rgba(168,85,247,0.08)" : "rgba(77,138,255,0.08)",
                        color: tag === "routed" ? "#3B82F6" : tag === "optimal" ? "#00E5A0" : tag === "cached" ? "#A855F7" : "#4D8AFF",
                      }}
                    >
                      {tag === "routed" ? "Smart Routed" : tag === "optimal" ? "Optimal" : tag === "cached" ? "Cache Hit" : "Fallback"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "Rules" && (
          <div className="flex flex-col gap-2.5">
            {(routingRules ?? []).map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3.5 bg-bg rounded-md border border-border transition-colors duration-150 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="text-[13px] font-semibold mb-0.5">{r.name}</div>
                  <div className="text-xs text-text-dim">{r.description || r.desc}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] text-text-dim">{r.triggers_count != null ? `${r.triggers_count}/day` : r.triggers}</span>
                  {/* Decorative toggle switch */}
                  <div className="relative w-9 h-5 rounded-full bg-accent/20 cursor-default">
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${r.status === "active" ? "right-0.5 bg-accent" : "left-0.5 bg-text-dim"}`} />
                  </div>
                  <Badge>{r.status === "active" ? "Active" : r.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
