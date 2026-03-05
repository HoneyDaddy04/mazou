"use client";

import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ROUTE_LOG, ROUTING_RULES } from "@/lib/constants";

const TAG_BORDER_COLOR: Record<string, string> = {
  routed: "#00D26A",
  optimal: "#FFB800",
  cached: "#A855F7",
  fallback: "#4D8AFF",
};

export default function RoutingPage() {
  const [tab, setTab] = useState("Live Feed");

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Routed Today" value="2,847" change="68% of all requests" color="#00D26A" />
        <StatCard label="Saved Today" value="₦18,400" change="avg ₦6.46/routed call" changeType="up" color="#00D26A" />
        <StatCard label="Fallbacks" value="34" change="1.2% of requests" />
        <StatCard label="Cache Hits" value="412" change="14.5% hit rate" color="#A855F7" />
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
        icon="⇋"
        tabs={["Live Feed", "Rules"]}
        activeTab={tab}
        onTabChange={setTab}
      >
        {tab === "Live Feed" && (
          <div className="flex flex-col gap-2.5">
            {ROUTE_LOG.map((r, i) => (
              <div
                key={i}
                className="flex gap-2.5 p-3 bg-bg rounded-md border border-border transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]"
                style={{ borderLeftWidth: 3, borderLeftColor: TAG_BORDER_COLOR[r.tag] || "#333" }}
              >
                <div className="font-mono text-[10px] text-text-dim w-[50px] shrink-0 pt-0.5">{r.time}</div>
                <div className="flex-1">
                  <div className="text-xs text-text-sec leading-relaxed">
                    <strong className="text-text">{r.agent}</strong> — {r.action}{" "}
                    {r.to && <span className="text-accent font-mono text-[11px]">{r.to}</span>}
                    {r.from && (
                      <> instead of <span className="text-red font-mono text-[11px] line-through opacity-60">{r.from}</span></>
                    )}
                    . {r.reason} {r.saved && <span className="text-accent font-semibold">Saved {r.saved}</span>}
                  </div>
                  <span
                    className="inline-block text-[9px] uppercase tracking-[0.05em] px-[5px] py-px rounded font-semibold mt-1.5"
                    style={{
                      background: r.tag === "routed" ? "rgba(0,210,106,0.08)" : r.tag === "optimal" ? "rgba(255,184,0,0.08)" : r.tag === "cached" ? "rgba(168,85,247,0.08)" : "rgba(77,138,255,0.08)",
                      color: r.tag === "routed" ? "#00D26A" : r.tag === "optimal" ? "#FFB800" : r.tag === "cached" ? "#A855F7" : "#4D8AFF",
                    }}
                  >
                    {r.tag === "routed" ? "Smart Routed" : r.tag === "optimal" ? "Optimal" : r.tag === "cached" ? "Cache Hit" : "Fallback"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Rules" && (
          <div className="flex flex-col gap-2.5">
            {ROUTING_RULES.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 bg-bg rounded-md border border-border transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]">
                <div className="flex-1">
                  <div className="text-[13px] font-semibold mb-0.5">{r.name}</div>
                  <div className="text-xs text-text-dim">{r.desc}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] text-text-dim">{r.triggers}</span>
                  {/* Decorative toggle switch */}
                  <div className="relative w-9 h-5 rounded-full bg-accent/20 cursor-default">
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-accent shadow-[0_0_6px_rgba(0,210,106,0.4)] transition-all" />
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
