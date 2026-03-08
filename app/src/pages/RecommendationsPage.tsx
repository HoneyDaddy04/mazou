import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useRecommendations, useUpdateRecommendation } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageError } from "@/components/ui/page-error";
import { TrendingDown, DollarSign, RefreshCw, Package, Timer, Globe, Loader2, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const OPT_ICON_MAP: Record<string, LucideIcon> = { DollarSign, RefreshCw, Package, Timer, Globe };

const TYPE_COLORS: Record<string, string> = {
  save: "#3B82F6",
  swap: "#00E5A0",
  cache: "#4D8AFF",
  batch: "#A855F7",
};

const TYPE_ICONS: Record<string, string> = {
  save: "DollarSign",
  swap: "RefreshCw",
  cache: "Package",
  batch: "Timer",
};

export default function RecommendationsPage() {
  const { toast } = useToast();
  const { data: recommendations, isLoading, error, refetch } = useRecommendations();
  const updateRecommendation = useUpdateRecommendation();
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyStep, setApplyStep] = useState<"confirm" | "applying" | "done">("confirm");

  if (isLoading) return <PageSkeleton />;
  if (error) return <PageError message="Failed to load recommendations" onRetry={() => refetch()} />;

  const recs = recommendations || [];
  const appliedCount = recs.filter((r: any) => r.status === "applied").length;
  const pendingRecs = recs.filter((r: any) => r.status === "pending");
  const pendingCount = pendingRecs.length;
  const totalSaveableKobo = pendingRecs.reduce((sum: number, r: any) => sum + (r.savings_kobo || 0), 0);
  const saveableDisplay = formatNaira(totalSaveableKobo) + "/mo";

  const maxSavingsKobo = recs.reduce((max: number, r: any) => Math.max(max, r.savings_kobo || 0), 0);

  const applyingRec = applyingId ? recs.find((r: any) => r.id === applyingId) : null;

  function handleApply(id: string) {
    setApplyingId(id);
    setApplyStep("confirm");
  }

  function handleConfirmApply() {
    if (!applyingId) return;
    setApplyStep("applying");
    updateRecommendation.mutate(
      { id: applyingId, status: "applied" },
      {
        onSuccess: () => {
          setApplyStep("done");
          const rec = recs.find((r: any) => r.id === applyingId);
          toast(`"${rec?.title}" applied successfully`);
        },
        onError: () => {
          setApplyStep("confirm");
          toast("Failed to apply recommendation");
        },
      }
    );
  }

  function handleCloseApply() {
    setApplyingId(null);
    setApplyStep("confirm");
  }

  function handleDismiss(id: string) {
    updateRecommendation.mutate(
      { id, status: "dismissed" },
      {
        onSuccess: () => toast("Recommendation dismissed"),
        onError: () => toast("Failed to dismiss recommendation"),
      }
    );
  }

  function handleUndo(id: string) {
    updateRecommendation.mutate(
      { id, status: "pending" },
      {
        onSuccess: () => toast("Recommendation restored"),
        onError: () => toast("Failed to restore recommendation"),
      }
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 mb-5 animate-in-stagger">
        <StatCard label="Total Saveable" value={saveableDisplay} change={`across ${pendingCount} recommendations`} color="#00E5A0" />
        <StatCard label="Already Saved" value={`${appliedCount} applied`} change="this month via routing" changeType="up" color="#00E5A0" />
        <StatCard label="Implemented" value={`${appliedCount} of ${recs.length}`} change={`${pendingCount} pending review`} />
      </div>

      <Panel title="Optimisation Recommendations" icon={<TrendingDown size={15} />} right={<span className="text-[11px] text-accent font-semibold">Sorted by impact</span>}>
        <div className="flex flex-col gap-2.5">
          {recs.map((o: any) => {
            const status = o.status;
            const borderColor = TYPE_COLORS[o.type] || "#66667A";
            const impactPct = maxSavingsKobo > 0 ? ((o.savings_kobo || 0) / maxSavingsKobo) * 100 : 0;
            const iconName = TYPE_ICONS[o.type] || "DollarSign";
            const savingsDisplay = formatNaira(o.savings_kobo || 0) + "/mo";

            return (
              <div
                key={o.id}
                className={`rounded-lg flex gap-3.5 items-start transition-all overflow-hidden ${
                  status === "dismissed" ? "opacity-50" :
                  status === "applied" ? "" : ""
                }`}
                style={{
                  background: "var(--color-bg)",
                  border: status === "applied"
                    ? "1px solid rgba(59,130,246,0.2)"
                    : "1px solid var(--color-border)",
                }}
              >
                {/* Subtle left accent */}
                <div
                  className="w-0.5 self-stretch shrink-0 rounded-l-lg"
                  style={{ background: borderColor }}
                />

                <div className="flex gap-3.5 items-start flex-1 py-4 pr-4">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0"
                    style={{
                      background: o.type === "save" ? "rgba(59,130,246,0.08)" : o.type === "swap" ? "rgba(0,229,160,0.08)" : o.type === "cache" ? "rgba(77,138,255,0.08)" : "rgba(168,85,247,0.08)",
                    }}
                  >
                    {(() => { const Icon = OPT_ICON_MAP[iconName]; return Icon ? <Icon size={18} /> : null; })()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold">{o.title}</div>
                      <div
                        className="font-mono text-xl font-bold"
                        style={{
                          color: "#00E5A0",
                        }}
                      >
                        {savingsDisplay}
                      </div>
                    </div>
                    <div className="text-xs text-text-dim leading-relaxed mb-2.5">{o.description}</div>

                    {/* Impact meter */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[10px] text-text-dim uppercase tracking-wide">Savings</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[140px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${impactPct}%`,
                            background: `linear-gradient(to right, ${borderColor}88, ${borderColor})`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      {status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApply(o.id)}
                            className="px-3.5 py-[5px] bg-accent text-white border-none rounded-md text-xs font-semibold cursor-pointer hover:bg-accent-muted transition-all"
                          >
                            Apply Now
                          </button>
                          <button
                            onClick={() => handleDismiss(o.id)}
                            className="px-3.5 py-[5px] bg-transparent text-text-sec border border-border rounded-md text-xs cursor-pointer hover:bg-surface-2 transition-colors"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {status === "applied" && (
                        <Badge color="#10B981" bg="rgba(16,185,129,0.08)"><span className="inline-flex items-center gap-1"><Check size={12} /> Applied</span></Badge>
                      )}
                      {status === "dismissed" && (
                        <>
                          <Badge color="#66667A" bg="rgba(102,102,122,0.08)">Dismissed</Badge>
                          <button
                            onClick={() => handleUndo(o.id)}
                            className="text-[11px] text-accent bg-transparent border-none cursor-pointer hover:underline"
                          >
                            Undo
                          </button>
                        </>
                      )}
                      <Badge
                        color={o.impact === "high" ? "#EF4444" : "#00E5A0"}
                        bg={o.impact === "high" ? "rgba(255,77,77,0.08)" : "rgba(0,229,160,0.08)"}
                      >
                        {o.impact} impact
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Apply Recommendation Modal */}
      {applyingRec && (
        <Modal open={true} onClose={handleCloseApply} title="Apply Recommendation" icon={<TrendingDown size={16} />}>
          {applyStep === "confirm" && (
            <div className="space-y-4">
              <div className="bg-bg border border-border rounded-lg p-4">
                <div className="text-sm font-semibold mb-1">{applyingRec.title}</div>
                <div className="text-xs text-text-dim leading-relaxed mb-2">{applyingRec.description}</div>
                <div className="font-mono text-lg font-bold text-accent">{formatNaira(applyingRec.savings_kobo || 0)}/mo</div>
              </div>
              <div className="bg-accent-light border border-[rgba(59,130,246,0.15)] rounded-lg p-3 text-xs text-accent">
                This will update your Smart Routing rules to automatically apply this optimisation. Changes take effect immediately for new requests.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmApply}
                  className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all"
                >
                  Apply Optimisation
                </button>
                <button
                  onClick={handleCloseApply}
                  className="flex-1 bg-surface border border-border text-text-sec py-2.5 rounded-lg text-sm cursor-pointer hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {applyStep === "applying" && (
            <div className="py-8 text-center">
              <Loader2 size={32} className="animate-spin text-accent mx-auto mb-3" />
              <div className="text-sm font-semibold mb-1">Applying Optimisation...</div>
              <div className="text-xs text-text-dim">Updating routing rules and model configurations...</div>
            </div>
          )}
          {applyStep === "done" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto"><Check size={28} className="text-emerald-600" /></div>
              <div>
                <div className="text-sm font-semibold">Optimisation Applied!</div>
                <div className="text-xs text-text-dim mt-1">Routing rules updated. Savings will begin immediately for new requests.</div>
              </div>
              <button
                onClick={handleCloseApply}
                className="bg-accent text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all"
              >
                Done
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
