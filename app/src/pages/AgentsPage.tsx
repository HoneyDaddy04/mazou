import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageError } from "@/components/ui/page-error";
import { Bot } from "lucide-react";
import { Sparkline } from "@/components/ui/charts";

export default function AgentsPage() {
  const { data: agents, isLoading, error, refetch } = useAgents();
  const [selected, setSelected] = useState<number | null>(null);

  if (isLoading) return <PageSkeleton />;
  if (error) return <PageError message="Failed to load agents" onRetry={() => refetch()} />;

  const agentList = agents || [];
  const liveCount = agentList.filter((a: any) => a.status === "live").length;
  const idleCount = agentList.length - liveCount;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 mb-5 animate-in-stagger">
        <StatCard label="Active Agents" value={`${liveCount}`} change={`${idleCount} idle`} />
        <StatCard label="Total Agents" value={`${agentList.length}`} change="configured" color="#00E5A0" />
        <StatCard label="Live" value={`${liveCount}`} change="running now" />
        <StatCard label="Idle" value={`${idleCount}`} change="paused" color="#3B82F6" />
      </div>

      <Panel title="AI Agents" icon={<Bot size={15} />}>
        <div className="grid grid-cols-2 gap-2.5">
          {agentList.map((a: any, i: number) => {
            const isLive = a.status === "live";
            const models = Array.isArray(a.models) ? a.models.join(", ") : (a.models || "—");
            const budget = a.config?.budget;

            return (
              <div
                key={a.id || i}
                onClick={() => setSelected(selected === i ? null : i)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selected === i
                    ? "bg-surface-2 border border-accent"
                    : isLive
                      ? "bg-bg border border-border hover:border-border-light"
                      : "bg-bg border border-border hover:border-border-light"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isLive ? "bg-accent" : "bg-text-dim"}`} />
                    <span className="text-sm font-semibold">{a.name}</span>
                  </div>
                  <Badge
                    color={isLive ? "#3B82F6" : "#66667A"}
                    bg={isLive ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.05)"}
                  >
                    {a.status}
                  </Badge>
                </div>

                <div className="flex items-end gap-3 mb-1">
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {[
                      { label: "Budget", val: budget ? formatNaira(budget) : "—" },
                      { label: "Models", val: `${Array.isArray(a.models) ? a.models.length : 0}` },
                      { label: "Tag", val: a.config?.tag || "—" },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="text-[10px] text-text-dim uppercase tracking-[0.05em]">{s.label}</div>
                        <div className="font-mono text-base font-semibold mt-0.5">
                          {s.val}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mini sparkline placeholder */}
                  <div className="w-20 h-8 shrink-0">
                    <Sparkline
                      data={[0, 0, 0, 0, 0, 0, 0]}
                      color={isLive ? "#3B82F6" : "#66667A"}
                      height={32}
                      width={80}
                    />
                  </div>
                </div>

                {selected === i && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-md p-2.5">
                        <div className="text-[10px] text-text-dim uppercase tracking-wide mb-1">Models</div>
                        <div className="font-mono text-[11px] font-medium">{models}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2.5">
                        <div className="text-[10px] text-text-dim uppercase tracking-wide mb-1">Tag</div>
                        <div className="font-mono text-[11px] font-medium">{a.config?.tag || "—"}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2.5">
                        <div className="text-[10px] text-text-dim uppercase tracking-wide mb-1">Created</div>
                        <div className="font-mono text-[11px] font-medium">{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2.5">
                        <div className="text-[10px] text-text-dim uppercase tracking-wide mb-1">Updated</div>
                        <div className="font-mono text-[11px] font-medium text-accent">{a.updated_at ? new Date(a.updated_at).toLocaleDateString() : "—"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
