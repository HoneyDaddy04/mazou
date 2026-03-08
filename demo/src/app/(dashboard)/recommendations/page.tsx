"use client";

import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { OPTIMISATIONS } from "@/lib/constants";

type RecStatus = "pending" | "applying" | "applied" | "dismissed";

const TYPE_COLORS: Record<string, string> = {
  save: "#00D26A",
  swap: "#FFB800",
  cache: "#4D8AFF",
  batch: "#A855F7",
};

export default function RecommendationsPage() {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<RecStatus[]>(OPTIMISATIONS.map(() => "pending"));
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [applyStep, setApplyStep] = useState<"confirm" | "applying" | "done">("confirm");

  const appliedCount = statuses.filter((s) => s === "applied").length;
  const pendingCount = statuses.filter((s) => s === "pending").length;
  // Parse amounts like "₦890K/mo" or "₦1.14M/mo" into a numeric kobo-thousands value
  const totalSaveableK = OPTIMISATIONS
    .filter((_, i) => statuses[i] === "pending")
    .reduce((sum, o) => {
      const mM = o.amount.match(/([\d.]+)M/);
      if (mM) return sum + parseFloat(mM[1]) * 1000;
      const mK = o.amount.match(/([\d.]+)K/);
      if (mK) return sum + parseFloat(mK[1]);
      return sum;
    }, 0);
  const saveableDisplay = totalSaveableK >= 1000
    ? `\u20A6${(totalSaveableK / 1000).toFixed(2)}M/mo`
    : totalSaveableK > 0
      ? `\u20A6${totalSaveableK.toFixed(0)}K/mo`
      : "\u20A60/mo";

  function handleApply(index: number) {
    setApplyingIndex(index);
    setApplyStep("confirm");
  }

  function handleConfirmApply() {
    if (applyingIndex === null) return;
    setApplyStep("applying");
    setTimeout(() => {
      setStatuses((prev) => prev.map((s, i) => i === applyingIndex ? "applied" : s));
      setApplyStep("done");
      toast(`"${OPTIMISATIONS[applyingIndex].title}" applied successfully`);
    }, 2500);
  }

  function handleCloseApply() {
    setApplyingIndex(null);
    setApplyStep("confirm");
  }

  function handleDismiss(index: number) {
    setStatuses((prev) => prev.map((s, i) => i === index ? "dismissed" : s));
    toast(`Recommendation dismissed`);
  }

  function handleUndoDismiss(index: number) {
    setStatuses((prev) => prev.map((s, i) => i === index ? "pending" : s));
    toast(`Recommendation restored`);
  }

  // Find max amount for impact bar normalization
  const maxAmountK = OPTIMISATIONS.reduce((max, o) => {
    const mM = o.amount.match(/([\d.]+)M/);
    if (mM) return Math.max(max, parseFloat(mM[1]) * 1000);
    const mK = o.amount.match(/([\d.]+)K/);
    if (mK) return Math.max(max, parseFloat(mK[1]));
    return max;
  }, 0);

  function getAmountK(amount: string): number {
    const mM = amount.match(/([\d.]+)M/);
    if (mM) return parseFloat(mM[1]) * 1000;
    const mK = amount.match(/([\d.]+)K/);
    if (mK) return parseFloat(mK[1]);
    return 0;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <StatCard label="Total Saveable" value={saveableDisplay} change={`across ${pendingCount} recommendations`} color="#00D26A" />
        <StatCard label="Already Saved" value="\u20A6486K" change="this month via routing" changeType="up" color="#00D26A" />
        <StatCard label="Implemented" value={`${appliedCount} of ${OPTIMISATIONS.length}`} change={`${pendingCount} pending review`} />
      </div>

      <Panel title="Optimisation Recommendations" icon="\uD83D\uDCA1" right={<span className="text-[11px] text-accent font-semibold">Sorted by impact</span>}>
        <div className="flex flex-col gap-2.5">
          {OPTIMISATIONS.map((o, i) => {
            const status = statuses[i];
            const borderColor = TYPE_COLORS[o.type] || "#66667A";
            const impactPct = maxAmountK > 0 ? (getAmountK(o.amount) / maxAmountK) * 100 : 0;

            return (
              <div
                key={i}
                className={`rounded-lg flex gap-3.5 items-start transition-all overflow-hidden ${
                  status === "dismissed" ? "opacity-50" :
                  status === "applied" ? "" : ""
                }`}
                style={{
                  background: "var(--color-bg)",
                  border: status === "applied"
                    ? "1px solid rgba(0,210,106,0.2)"
                    : "1px solid var(--color-border)",
                }}
              >
                {/* Gradient left border */}
                <div
                  className="w-1 self-stretch shrink-0 rounded-l-lg"
                  style={{
                    background: `linear-gradient(to bottom, ${borderColor}, ${borderColor}88)`,
                  }}
                />

                <div className="flex gap-3.5 items-start flex-1 py-4 pr-4">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0"
                    style={{
                      background: o.type === "save" ? "rgba(0,210,106,0.08)" : o.type === "swap" ? "rgba(255,184,0,0.08)" : o.type === "cache" ? "rgba(77,138,255,0.08)" : "rgba(168,85,247,0.08)",
                    }}
                  >
                    {o.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold">{o.title}</div>
                      <div
                        className="font-mono text-xl font-bold"
                        style={{
                          color: "#00D26A",
                          textShadow: "0 0 20px rgba(0,210,106,0.3)",
                        }}
                      >
                        {o.amount}
                      </div>
                    </div>
                    <div className="text-xs text-text-dim leading-relaxed mb-2.5">{o.desc}</div>

                    {/* Impact meter */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[10px] text-text-dim uppercase tracking-wide">Savings</span>
                      <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden max-w-[140px]">
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
                            onClick={() => handleApply(i)}
                            className="px-3.5 py-[5px] bg-accent text-black border-none rounded-md text-xs font-semibold cursor-pointer hover:brightness-110 transition-all"
                          >
                            Apply Now
                          </button>
                          <button
                            onClick={() => handleDismiss(i)}
                            className="px-3.5 py-[5px] bg-transparent text-text-sec border border-border rounded-md text-xs cursor-pointer hover:bg-surface-2 transition-colors"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {status === "applied" && (
                        <Badge color="#00D26A" bg="rgba(0,210,106,0.08)">{"\u2713"} Applied</Badge>
                      )}
                      {status === "dismissed" && (
                        <>
                          <Badge color="#66667A" bg="rgba(102,102,122,0.08)">Dismissed</Badge>
                          <button
                            onClick={() => handleUndoDismiss(i)}
                            className="text-[11px] text-accent bg-transparent border-none cursor-pointer hover:underline"
                          >
                            Undo
                          </button>
                        </>
                      )}
                      <Badge
                        color={o.impact === "high" ? "#FF4D4D" : "#FFB800"}
                        bg={o.impact === "high" ? "rgba(255,77,77,0.08)" : "rgba(255,184,0,0.08)"}
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
      {applyingIndex !== null && (
        <Modal open={true} onClose={handleCloseApply} title="Apply Recommendation" icon="\uD83D\uDCA1">
          {applyStep === "confirm" && (
            <div className="space-y-4">
              <div className="bg-bg border border-border rounded-lg p-4">
                <div className="text-sm font-semibold mb-1">{OPTIMISATIONS[applyingIndex].title}</div>
                <div className="text-xs text-text-dim leading-relaxed mb-2">{OPTIMISATIONS[applyingIndex].desc}</div>
                <div className="font-mono text-lg font-bold text-accent">{OPTIMISATIONS[applyingIndex].amount}</div>
              </div>
              <div className="bg-[rgba(0,210,106,0.06)] border border-[rgba(0,210,106,0.15)] rounded-lg p-3 text-xs text-accent">
                This will update your Smart Routing rules to automatically apply this optimisation. Changes take effect immediately for new requests.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmApply}
                  className="flex-1 bg-accent text-black py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all"
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
              <div className="text-3xl mb-3 animate-spin inline-block">{"\u23F3"}</div>
              <div className="text-sm font-semibold mb-1">Applying Optimisation...</div>
              <div className="text-xs text-text-dim">Updating routing rules and model configurations...</div>
            </div>
          )}
          {applyStep === "done" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,210,106,0.1)] flex items-center justify-center text-2xl mx-auto">{"\u2713"}</div>
              <div>
                <div className="text-sm font-semibold">Optimisation Applied!</div>
                <div className="text-xs text-text-dim mt-1">Routing rules updated. Savings will begin immediately for new requests.</div>
              </div>
              <button
                onClick={handleCloseApply}
                className="bg-accent text-black px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all"
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
