import { useState, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CATALOG_MODELS, MODEL_CATEGORIES, CURRENCIES, type CatalogModel, type CurrencyCode } from "@/lib/constants";
import { useAppStore } from "@/lib/store";
import { formatTokenCost } from "@/lib/utils";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#10A37F", anthropic: "#C084FC", google: "#4285F4",
  meta: "#0668E1", naira: "#00E5A0", deepseek: "#4D6BFE",
  mistral: "#F43F5E", teal: "#2DD4BF", purple: "#A855F7",
  blue: "#4D8AFF",
};

const FILTER_TABS = ["All", "Global", "African"] as const;

export default function CatalogPage() {
  const { toast } = useToast();
  const { currency, setCurrency } = useAppStore();
  const [search, setSearch] = useState("");
  const [regionTab, setRegionTab] = useState<(typeof FILTER_TABS)[number]>("All");
  const [category, setCategory] = useState("All");
  const [selectedModel, setSelectedModel] = useState<CatalogModel | null>(null);

  const filtered = useMemo(() => {
    return CATALOG_MODELS.filter((m) => {
      if (regionTab === "Global" && m.isAfrican) return false;
      if (regionTab === "African" && !m.isAfrican) return false;
      if (category !== "All" && m.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.tags.some((t) => t.includes(q)) ||
          m.category.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [regionTab, category, search]);

  const globalCount = CATALOG_MODELS.filter((m) => !m.isAfrican).length;
  const africanCount = CATALOG_MODELS.filter((m) => m.isAfrican).length;
  const categories = [...new Set(CATALOG_MODELS.map((m) => m.category))];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-5 animate-in-stagger">
        <StatCard label="Total Models" value={`${CATALOG_MODELS.length}`} change={`${globalCount} global + ${africanCount} African`} />
        <StatCard label="Providers" value={`${new Set(CATALOG_MODELS.map((m) => m.provider)).size}`} change="OpenAI, Anthropic, Google, Meta, etc." />
        <StatCard label="African Models" value={`${africanCount}`} change="Language, Healthcare, AgriTech, FinTech" color="#00E5A0" />
        <StatCard label="Categories" value={`${categories.length}`} change={categories.slice(0, 4).join(", ")} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2.5 mb-3">
        {/* Region tabs */}
        <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setRegionTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                regionTab === tab
                  ? "bg-accent text-white"
                  : "text-text-sec hover:text-text hover:bg-surface-2"
              }`}
            >
              {tab} {tab === "African" ? `(${africanCount})` : tab === "Global" ? `(${globalCount})` : ""}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-sec cursor-pointer outline-none"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search models, providers, tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text outline-none focus:border-accent transition-colors"
        />

        {/* Currency switcher */}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-sec cursor-pointer outline-none font-mono"
        >
          {Object.entries(CURRENCIES).map(([code, c]) => (
            <option key={code} value={code}>{c.symbol} {code}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-[11px] text-text-dim mb-2.5">
        Showing {filtered.length} of {CATALOG_MODELS.length} models
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {filtered.map((m) => {
          const color = PROVIDER_COLORS[m.providerColor] || "#666";
          return (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m)}
              className="text-left p-4 bg-surface rounded-lg border border-border hover:border-border-light transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: `${color}20`, color }}
                  >
                    {m.providerIcon}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold group-hover:text-accent transition-colors">{m.name}</div>
                    <div className="text-[10px] text-text-dim">{m.provider}</div>
                  </div>
                </div>
                {m.isAfrican && (
                  <Badge color="#00E5A0" bg="rgba(0,229,160,0.1)">African</Badge>
                )}
              </div>

              {/* Category + Tags */}
              <div className="flex items-center gap-1 mb-2 flex-wrap">
                <span className="text-[9px] px-1.5 py-0.5 bg-accent-light text-accent rounded font-medium">
                  {m.category}
                </span>
                {m.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 bg-surface-2 text-text-dim rounded">
                    {t}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="text-[11px] text-text-dim leading-relaxed mb-3 line-clamp-2">
                {m.description}
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between pt-2.5 border-t border-border">
                <div className="flex gap-3">
                  <div>
                    <div className="text-[9px] text-text-dim uppercase">Input /1M</div>
                    <div className="font-mono text-[11px] font-semibold text-accent">
                      {formatTokenCost(m.inputCost, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-dim uppercase">Output /1M</div>
                    <div className="font-mono text-[11px] font-semibold text-text">
                      {formatTokenCost(m.outputCost, currency)}
                    </div>
                  </div>
                </div>
                {m.contextWindow !== "N/A" && (
                  <div className="text-[10px] text-text-dim font-mono">
                    {m.contextWindow} ctx
                  </div>
                )}
              </div>

              {/* African domain badge */}
              {m.africanMeta?.domain && m.africanMeta.domain !== "Language" && (
                <div className="mt-2 text-[9px] px-1.5 py-0.5 bg-[rgba(0,229,160,0.08)] text-naira rounded inline-block font-medium">
                  {m.africanMeta.domain}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-dim text-sm">
          No models match your filters. Try adjusting your search or category.
        </div>
      )}

      {/* Model Detail Modal */}
      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          currency={currency}
          onClose={() => setSelectedModel(null)}
          onActivate={() => {
            toast(`${selectedModel.name} activated for your organization`);
            setSelectedModel(null);
          }}
        />
      )}
    </div>
  );
}

function ModelDetailModal({
  model: m,
  currency,
  onClose,
  onActivate,
}: {
  model: CatalogModel;
  currency: CurrencyCode;
  onClose: () => void;
  onActivate: () => void;
}) {
  const color = PROVIDER_COLORS[m.providerColor] || "#666";

  return (
    <Modal open={true} onClose={onClose} title={m.name} icon={m.providerIcon}>
      <div className="space-y-4">
        {/* Header + Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: `${color}20`, color }}
            >
              {m.providerIcon}
            </div>
            <div>
              <div className="text-lg font-bold">{m.name}</div>
              <div className="text-xs text-text-dim">{m.provider} &middot; Released {m.released}</div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onActivate}
              className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-accent-muted transition-all"
            >
              Activate Model
            </button>
            <button
              onClick={onClose}
              className="bg-surface border border-border text-text-sec px-4 py-2 rounded-lg text-xs cursor-pointer hover:bg-surface-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 bg-accent-light text-accent rounded-full font-semibold">
            {m.category}
          </span>
          {m.tags.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 bg-surface-2 text-text-sec rounded-full">
              {t}
            </span>
          ))}
          {m.isAfrican && (
            <span className="text-[10px] px-2 py-0.5 bg-[rgba(0,229,160,0.1)] text-naira rounded-full font-semibold">
              African
            </span>
          )}
        </div>

        {/* Description */}
        <div className="text-sm text-text-sec leading-relaxed">{m.description}</div>

        {/* Pricing Card */}
        <div className="bg-bg border border-border rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-wide text-text-dim font-semibold mb-3">Token Pricing (per 1M tokens)</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-dim mb-1">Input Tokens</div>
              <div className="font-mono text-xl font-bold text-accent">
                {formatTokenCost(m.inputCost, currency)}
              </div>
              {currency !== "USDT" && (
                <div className="font-mono text-[10px] text-text-dim mt-0.5">
                  ${m.inputCost.toFixed(2)} USD
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-text-dim mb-1">Output Tokens</div>
              <div className="font-mono text-xl font-bold text-text">
                {formatTokenCost(m.outputCost, currency)}
              </div>
              {currency !== "USDT" && (
                <div className="font-mono text-[10px] text-text-dim mt-0.5">
                  ${m.outputCost.toFixed(2)} USD
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-bg border border-border rounded-lg p-3">
            <div className="text-[10px] text-text-dim uppercase mb-1">Context Window</div>
            <div className="font-mono text-sm font-semibold">{m.contextWindow}</div>
          </div>
          <div className="bg-bg border border-border rounded-lg p-3">
            <div className="text-[10px] text-text-dim uppercase mb-1">Provider</div>
            <div className="text-sm font-semibold">{m.provider}</div>
          </div>
        </div>

        {/* African metadata */}
        {m.africanMeta && (
          <div className="bg-[rgba(0,229,160,0.04)] border border-[rgba(0,229,160,0.15)] rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wide text-naira font-semibold mb-2">African Model Details</div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-text-dim mb-0.5">Country</div>
                <div className="font-medium">{m.africanMeta.country}</div>
              </div>
              <div>
                <div className="text-text-dim mb-0.5">Domain</div>
                <div className="font-medium">{m.africanMeta.domain}</div>
              </div>
              <div>
                <div className="text-text-dim mb-0.5">Languages</div>
                <div className="font-medium">{m.africanMeta.langs.length}</div>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap mt-2">
              {m.africanMeta.langs.map((l, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-[rgba(0,229,160,0.08)] text-naira rounded font-mono">
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
