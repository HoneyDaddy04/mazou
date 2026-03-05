"use client";

import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { BarFill } from "@/components/ui/bar-fill";
import { Badge } from "@/components/ui/badge";
import { FEATURE_DATA, MODEL_DATA, AGENT_DATA } from "@/lib/constants";
import { formatNaira } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLOR_MAP: Record<string, string> = {
  openai: "#10A37F", anthropic: "#D4A274", google: "#4285F4",
  meta: "#0668E1", naira: "#FFB800", deepseek: "#4D6BFE",
  mistral: "#FF7200", teal: "#2DD4BF", purple: "#A855F7",
  blue: "#4D8AFF",
};

const SPEND_BY_MODEL = [
  { name: "GPT-5", spend: 2227200, color: "#10A37F" },
  { name: "Sonnet 4.6", spend: 320000, color: "#D4A274" },
  { name: "4.1 Mini", spend: 124000, color: "#10A37F" },
  { name: "YarnGPT", spend: 86400, color: "#FFB800" },
  { name: "Gemini", spend: 42000, color: "#4285F4" },
  { name: "Haiku 4.5", spend: 18600, color: "#D4A274" },
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

export default function UsagePage() {
  const [tab, setTab] = useState("Features");

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Total Spend (Feb)" value="₦2.85M" change="↓ 8% vs Jan" changeType="up" color="#FFB800" />
        <StatCard label="Total Calls" value="1.24M" change="↑ 12%" changeType="up" />
        <StatCard label="Avg Cost/Call" value="₦2.30" change="↓ 18% via routing" changeType="up" color="#00D26A" />
        <StatCard label="Most Expensive" value="Support Bot" change="₦1.94M — 68% of total" changeType="down" color="#FF4D4D" />
      </div>

      <Panel title="Spend by Model" icon="⬡" className="mb-5">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SPEND_BY_MODEL} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
              <XAxis
                type="number"
                tickFormatter={(v) => formatNaira(v)}
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#999", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<SpendTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="spend" radius={[0, 4, 4, 0]} barSize={18}>
                {SPEND_BY_MODEL.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Usage Breakdown" icon="⬡" tabs={["Features", "Agents", "Models"]} activeTab={tab} onTabChange={setTab}>
        {tab === "Features" && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.06em] text-text-dim font-semibold">
                <th className="text-left pb-2.5">Feature</th>
                <th className="text-left pb-2.5">Model</th>
                <th className="text-left pb-2.5">Calls</th>
                <th className="text-left pb-2.5 w-[120px]">% of Spend</th>
                <th className="text-left pb-2.5">Cost</th>
                <th className="text-right pb-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_DATA.map((f, i) => (
                <tr key={i} className="border-t border-border transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="py-2.5">
                    <span className="font-medium text-[13px]">{f.name}</span>
                    <span className="font-mono text-[10px] text-text-dim bg-bg px-1.5 py-px rounded ml-1.5">{f.tag}</span>
                  </td>
                  <td><span className={`font-mono text-xs ${f.african ? "text-naira" : "text-text-sec"}`}>{f.model}</span></td>
                  <td><span className="font-mono text-[13px] text-text-sec">{f.calls}</span></td>
                  <td><BarFill pct={f.pct} color={f.pct > 70 ? "#FF4D4D" : f.pct > 40 ? "#FFB800" : "#00D26A"} /></td>
                  <td><span className="font-mono text-[13px] font-medium">{formatNaira(f.cost)}</span></td>
                  <td className="text-right">
                    <span className={`text-[11px] font-medium px-2 py-[3px] rounded-full ${f.actionable ? "bg-[rgba(0,210,106,0.08)] text-accent" : "text-text-dim"}`}>
                      {f.tip}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "Agents" && (
          <div>
            {AGENT_DATA.map((a, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_0.7fr_0.8fr_0.7fr_0.7fr] items-center py-2.5 border-b border-border text-[13px] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-2 font-medium">
                  <div className={`w-1.5 h-1.5 rounded-full ${a.status === "live" ? "bg-accent shadow-[0_0_6px_#00D26A]" : "bg-text-dim"}`} />
                  {a.name}
                </div>
                <span className="font-mono text-[11px] text-text-dim">{a.models}</span>
                <span className="font-mono text-text-sec">{a.calls}</span>
                <span className="font-mono font-medium">{a.cost}</span>
                <span className={`font-mono ${a.up ? "text-red" : "text-accent"}`}>{a.trend}</span>
                <span className="font-mono text-[11px] text-text-dim">{a.uptime}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Models" && (
          <div>
            {MODEL_DATA.map((m, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_0.7fr_0.7fr_1fr] items-center py-2.5 border-b border-border text-[13px] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-[5px] flex items-center justify-center text-[9px] font-bold"
                    style={{ background: `${COLOR_MAP[m.color]}20`, color: COLOR_MAP[m.color] }}
                  >
                    {m.icon}
                  </div>
                  <span className="font-medium">{m.name}</span>
                  {m.provider === "African" && <Badge color="#FFB800" bg="rgba(255,184,0,0.08)">African</Badge>}
                </div>
                <span className="font-mono text-text-sec">{m.calls}</span>
                <span className="font-mono text-text-sec">{m.latency}</span>
                <span className="font-mono font-medium">{formatNaira(m.spend)}</span>
                <BarFill pct={m.pct} color={COLOR_MAP[m.color] || "#666"} height={4} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
