"use client";

import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { AGENT_DATA } from "@/lib/constants";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const AGENT_SPARKLINES: Record<string, number[]> = {
  "Customer Support Bot": [820, 780, 850, 910, 842, 880, 900],
  "Fraud Detection Agent": [88, 92, 85, 95, 91, 89, 93],
  "Onboarding Assistant": [28, 22, 25, 20, 24, 21, 19],
  "Compliance Reviewer": [5, 3, 4, 2, 3, 4, 2],
};

export default function AgentsPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Active Agents" value="3" change="1 idle" />
        <StatCard label="Agent Spend" value="₦2.34M" change="82% of total" color="#FFB800" />
        <StatCard label="Total Tasks" value="16,180" change="this month" />
        <StatCard label="Error Rate" value="0.19%" change="30 errors total" changeType="up" color="#00D26A" />
      </div>

      <Panel title="AI Agents" icon="🤖">
        <div className="grid grid-cols-2 gap-2.5">
          {AGENT_DATA.map((a, i) => {
            const sparkData = (AGENT_SPARKLINES[a.name] || [0, 0, 0, 0, 0, 0, 0]).map((v) => ({ v }));
            const isLive = a.status === "live";

            return (
              <div
                key={i}
                onClick={() => setSelected(selected === i ? null : i)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selected === i
                    ? "bg-surface-2 border border-accent"
                    : isLive
                      ? "bg-bg border border-border hover:border-border-light shadow-[0_0_12px_rgba(0,210,106,0.06)]"
                      : "bg-bg border border-border hover:border-border-light"
                }`}
                style={isLive && selected !== i ? { borderColor: "rgba(0,210,106,0.15)" } : undefined}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isLive ? "bg-accent shadow-[0_0_8px_#00D26A]" : "bg-text-dim"}`} />
                    <span className="text-sm font-semibold">{a.name}</span>
                  </div>
                  <Badge
                    color={isLive ? "#00D26A" : "#66667A"}
                    bg={isLive ? "rgba(0,210,106,0.08)" : "rgba(0,0,0,0.2)"}
                  >
                    {a.status}
                  </Badge>
                </div>

                <div className="flex items-end gap-3 mb-1">
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {[
                      { label: "Cost", val: a.cost },
                      { label: "Calls", val: a.calls },
                      { label: "Trend", val: a.trend, color: a.up ? "#FF4D4D" : "#00D26A" },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="text-[10px] text-text-dim uppercase tracking-[0.05em]">{s.label}</div>
                        <div className="font-mono text-base font-semibold mt-0.5" style={s.color ? { color: s.color } : undefined}>
                          {s.val}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mini sparkline */}
                  <div className="w-20 h-8 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isLive ? "#00D26A" : "#66667A"} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={isLive ? "#00D26A" : "#66667A"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke={isLive ? "#00D26A" : "#66667A"}
                          strokeWidth={1.5}
                          fill={`url(#spark-${i})`}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {selected === i && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[rgba(255,255,255,0.02)] rounded-md p-2.5">
                        <div className="text-[10px] text-text-dim uppercase tracking-wide mb-1">Models</div>
                        <div className="font-mono text-[11px] font-medium">{a.models}</div>
                      </div>
                      <div className="bg-[rgba(255,255,255,0.02)] rounded-md p-2.5">
                        <div className="text-[10px] text-text-dim uppercase tracking-wide mb-1">Tasks Completed</div>
                        <div className="font-mono text-[11px] font-medium">{a.tasks.toLocaleString()}</div>
                      </div>
                      <div className="bg-[rgba(255,255,255,0.02)] rounded-md p-2.5">
                        <div className="text-[10px] text-text-dim uppercase tracking-wide mb-1">Errors</div>
                        <div className="font-mono text-[11px] font-medium">{a.errors}</div>
                      </div>
                      <div className="bg-[rgba(255,255,255,0.02)] rounded-md p-2.5">
                        <div className="text-[10px] text-text-dim uppercase tracking-wide mb-1">Uptime</div>
                        <div className="font-mono text-[11px] font-medium text-accent">{a.uptime}</div>
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
