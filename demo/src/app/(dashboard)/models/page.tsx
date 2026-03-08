"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { BarFill } from "@/components/ui/bar-fill";
import { MODEL_DATA, CATALOG_MODELS, CURRENCIES, type CurrencyCode } from "@/lib/constants";
import { formatNaira, formatTokenCost } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const COLOR_MAP: Record<string, string> = {
  openai: "#10A37F", anthropic: "#D4A274", google: "#4285F4",
  meta: "#0668E1", naira: "#FFB800", deepseek: "#4D6BFE",
  mistral: "#FF7200", teal: "#2DD4BF", purple: "#A855F7",
  blue: "#4D8AFF",
};

export default function ModelsPage() {
  const { currency, setCurrency } = useAppStore();

  const modelsWithPricing = (MODEL_DATA || []).map((m) => {
    const catalog = (CATALOG_MODELS || []).find(
      (c) => c.name === m.name || c.name.toLowerCase().replace(/\s+/g, "-") === m.name.toLowerCase().replace(/\s+/g, "-")
    );
    return { ...m, inputCost: catalog?.inputCost ?? 0, outputCost: catalog?.outputCost ?? 0 };
  });

  const totalSpend = (MODEL_DATA || []).reduce((s, m) => s + m.spend, 0);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Active Models" value={`${MODEL_DATA.length}`} change="in use this month" />
        <StatCard label="Total Spend" value={formatNaira(totalSpend)} change="this month" color="#FFB800" />
        <StatCard label="Total Calls" value="1.4M" change="across all models" />
        <StatCard label="Avg Latency" value="0.61s" change="p50 across models" />
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <div className="text-xs text-text-dim">Models currently active on your account with usage data</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-dim">Token pricing in:</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="bg-surface border border-border rounded-md px-2 py-1 text-[11px] text-text-sec cursor-pointer outline-none font-mono"
          >
            {Object.entries(CURRENCIES).map(([code, c]) => (
              <option key={code} value={code}>{c.symbol} {code}</option>
            ))}
          </select>
        </div>
      </div>

      <Panel title="Active Models" icon="&#x25C8;">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">
                <th className="text-left py-2.5 pr-3">Model</th>
                <th className="text-left py-2.5 px-3">Calls</th>
                <th className="text-left py-2.5 px-3">Latency</th>
                <th className="text-left py-2.5 px-3">Spend</th>
                <th className="text-left py-2.5 px-3">Input /1M</th>
                <th className="text-left py-2.5 px-3">Output /1M</th>
                <th className="text-left py-2.5 pl-3 w-[100px]">Usage</th>
              </tr>
            </thead>
            <tbody>
              {modelsWithPricing.map((m, i) => (
                <tr key={i} className="border-t border-border hover:bg-surface-2 transition-colors">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: `${COLOR_MAP[m.color]}20`, color: COLOR_MAP[m.color] }}
                      >
                        {m.icon}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold">{m.name}</div>
                        <div className="text-[11px] text-text-dim">{m.provider}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-text-sec text-xs">{m.calls}</td>
                  <td className="py-3 px-3 font-mono text-text-sec text-xs">{m.latency}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-xs">{formatNaira(m.spend)}</td>
                  <td className="py-3 px-3 font-mono text-accent text-xs">{formatTokenCost(m.inputCost, currency)}</td>
                  <td className="py-3 px-3 font-mono text-text-sec text-xs">{formatTokenCost(m.outputCost, currency)}</td>
                  <td className="py-3 pl-3 w-[100px]">
                    <BarFill pct={m.pct} color={COLOR_MAP[m.color] || "#666"} height={5} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
