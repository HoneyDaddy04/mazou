import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { BarFill } from "@/components/ui/bar-fill";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageError } from "@/components/ui/page-error";
import { CATALOG_MODELS, CURRENCIES, type CurrencyCode } from "@/lib/constants";
import { formatNaira, formatTokenCost } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useDashboardStats } from "@/lib/api";
import { BarChart3 } from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  openai: "#10A37F", anthropic: "#C084FC", google: "#4285F4",
  meta: "#0668E1", naira: "#00E5A0", deepseek: "#4D6BFE",
  mistral: "#F43F5E", teal: "#2DD4BF", purple: "#A855F7",
  blue: "#4D8AFF",
};

// Map provider name to a color key and icon
function getProviderStyle(provider: string): { color: string; icon: string } {
  const p = provider.toLowerCase();
  if (p.includes("openai")) return { color: "openai", icon: "OA" };
  if (p.includes("anthropic")) return { color: "anthropic", icon: "AN" };
  if (p.includes("google")) return { color: "google", icon: "GO" };
  if (p.includes("meta")) return { color: "meta", icon: "MT" };
  if (p.includes("deepseek")) return { color: "deepseek", icon: "DS" };
  if (p.includes("mistral")) return { color: "mistral", icon: "MI" };
  if (p.includes("african") || p.includes("lelapa") || p.includes("masakhane") || p.includes("independent") || p.includes("community"))
    return { color: "naira", icon: "AF" };
  return { color: "blue", icon: p.slice(0, 2).toUpperCase() };
}

export default function ModelsPage() {
  const { currency, setCurrency } = useAppStore();
  const { data: stats, isLoading, error, refetch } = useDashboardStats(30);

  if (isLoading) return <PageSkeleton />;
  if (error) return <PageError message="Failed to load model data" onRetry={() => refetch()} />;

  const modelStats: any[] = stats?.models || [];

  // Derive display data by joining API usage with catalog pricing
  const maxCalls = Math.max(...modelStats.map((m: any) => m.calls), 1);

  const modelsWithPricing = modelStats.map((m: any) => {
    const catalog = (CATALOG_MODELS || []).find(
      (c) => c.name === m.model || c.name.toLowerCase().replace(/\s+/g, "-") === m.model.toLowerCase().replace(/\s+/g, "-")
    );
    const style = getProviderStyle(m.provider);
    return {
      name: m.model,
      provider: m.provider,
      icon: style.icon,
      color: style.color,
      spend: m.cost_kobo,
      calls: m.calls,
      inputTokens: m.input_tokens,
      outputTokens: m.output_tokens,
      pct: Math.round((m.calls / maxCalls) * 100),
      inputCost: catalog?.inputCost ?? 0,
      outputCost: catalog?.outputCost ?? 0,
    };
  });

  const totalSpend = modelStats.reduce((s: number, m: any) => s + m.cost_kobo, 0);
  const totalCalls = modelStats.reduce((s: number, m: any) => s + m.calls, 0);

  function formatCallsShort(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return String(n);
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 mb-5 animate-in-stagger">
        <StatCard label="Active Models" value={`${modelStats.length}`} change="in use this month" />
        <StatCard label="Total Spend" value={formatNaira(totalSpend)} change="this month" color="#00E5A0" />
        <StatCard label="Total Calls" value={formatCallsShort(totalCalls)} change="across all models" />
        <StatCard label="Avg Latency" value="--" change="p50 across models" />
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

      <Panel title="Active Models" icon={<BarChart3 size={15} />}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">
                <th className="text-left py-2.5 pr-3">Model</th>
                <th className="text-left py-2.5 px-3">Calls</th>
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
                  <td className="py-3 px-3 font-mono text-text-sec text-xs">{formatCallsShort(m.calls)}</td>
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
