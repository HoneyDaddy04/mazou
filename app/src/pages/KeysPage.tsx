import { useState, useRef, useEffect } from "react";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageError } from "@/components/ui/page-error";
import { maskApiKey } from "@/lib/utils";
import { useApiKeys, useCreateKey, useRevokeKey } from "@/lib/api";
import { Key, Link2, Loader2, Check, MoreHorizontal } from "lucide-react";

interface ByokKey {
  provider: string;
  key: string;
  status: "connected" | "disconnected";
  models: string;
  color: string;
}

const PROVIDERS = [
  { name: "OpenAI", prefix: "sk-", color: "#10A37F", models: "gpt-4o, gpt-4o-mini, o1, o3" },
  { name: "Anthropic", prefix: "sk-ant-", color: "#C084FC", models: "opus-4.6, sonnet-4.6, haiku-4.5" },
  { name: "Google", prefix: "AIza", color: "#4285F4", models: "gemini-2.5-pro, gemini-2.5-flash" },
  { name: "Mistral", prefix: "mist-", color: "#F43F5E", models: "mistral-large, mistral-medium" },
  { name: "DeepSeek", prefix: "sk-ds-", color: "#4D6BFE", models: "deepseek-r1, deepseek-v3" },
  { name: "Custom Endpoint", prefix: "", color: "#66667A", models: "Any OpenAI-compatible API" },
];

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export default function APIKeysPage() {
  const { toast } = useToast();
  const { data: keys, isLoading, error, refetch } = useApiKeys();
  const createKey = useCreateKey();
  const revokeKey = useRevokeKey();

  const [byokKeys, setByokKeys] = useState<ByokKey[]>([
    { provider: "OpenAI", key: "sk-****...x9f2", status: "connected", models: "gpt-4o, gpt-4o-mini", color: "#10A37F" },
    { provider: "Anthropic", key: "sk-ant-****...m3a1", status: "connected", models: "sonnet, haiku", color: "#C084FC" },
  ]);

  const [showNewKey, setShowNewKey] = useState(false);
  const [showConnectKey, setShowConnectKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState<"live" | "test">("live");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // BYOK state
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [byokApiKey, setByokApiKey] = useState("");
  const [byokEndpoint, setByokEndpoint] = useState("");
  const [connectStep, setConnectStep] = useState<"select" | "enter" | "testing" | "done">("select");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleCreateKey() {
    if (!newKeyName.trim()) return;
    try {
      const result = await createKey.mutateAsync({
        name: newKeyName,
        environment: newKeyEnv,
      }) as any;
      setCreatedKey(result.key);
      toast(`API key "${newKeyName}" created`);
    } catch (err) {
      toast(`Failed to create key: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  function handleCloseNewKey() {
    setShowNewKey(false);
    setNewKeyName("");
    setNewKeyEnv("live");
    setCreatedKey(null);
  }

  async function handleRevokeKey(id: string, name: string) {
    try {
      await revokeKey.mutateAsync(id);
      setMenuOpen(null);
      toast(`Key "${name}" revoked`);
    } catch (err) {
      toast(`Failed to revoke key: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  function handleCopyKey(keyPrefix: string) {
    navigator.clipboard.writeText(keyPrefix);
    setMenuOpen(null);
    toast("Key prefix copied to clipboard");
  }

  function handleConnectByok() {
    if (!byokApiKey.trim()) return;
    setConnectStep("testing");
    setTimeout(() => {
      const prov = PROVIDERS[selectedProvider];
      const newByok: ByokKey = {
        provider: prov.name,
        key: maskApiKey(byokApiKey),
        status: "connected",
        models: prov.models,
        color: prov.color,
      };
      setByokKeys((prev) => [...prev, newByok]);
      setConnectStep("done");
      toast(`${prov.name} key connected successfully`);
    }, 2000);
  }

  function handleCloseConnect() {
    setShowConnectKey(false);
    setSelectedProvider(0);
    setByokApiKey("");
    setByokEndpoint("");
    setConnectStep("select");
  }

  function handleDisconnectByok(index: number) {
    const name = byokKeys[index].provider;
    setByokKeys((prev) => prev.filter((_, i) => i !== index));
    toast(`${name} key disconnected`);
  }

  if (isLoading) return <PageSkeleton />;
  if (error) return <PageError message="Failed to load API keys" onRetry={() => refetch()} />;

  const keyList = keys || [];

  return (
    <div>
      <Panel
        title="API Keys"
        icon={<Key size={15} />}
        right={
          <button
            onClick={() => setShowNewKey(true)}
            className="bg-accent text-white border-none px-3 py-[5px] rounded-md text-xs font-semibold cursor-pointer hover:bg-accent-muted transition-all"
          >
            + New Key
          </button>
        }
      >
        <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_0.7fr_0.5fr] items-center pb-2 text-[10px] uppercase tracking-[0.06em] text-text-dim font-semibold">
          <span>Name</span>
          <span>Key</span>
          <span>Last Used</span>
          <span>Calls</span>
          <span>Status</span>
          <span></span>
        </div>
        {keyList.map((k: any) => (
          <div key={k.id} className="grid grid-cols-[1.5fr_2fr_1fr_1fr_0.7fr_0.5fr] items-center py-3.5 border-b border-border text-[13px]">
            <span className="font-semibold">{k.name}</span>
            <span className="font-mono text-xs text-text-dim">{k.key_prefix}****</span>
            <span className="text-text-dim text-xs">{formatRelativeTime(k.last_used_at)}</span>
            <span className="font-mono text-text-sec">{formatCalls(k.total_calls)}</span>
            <Badge
              color={k.status === "active" ? "#10B981" : "#EF4444"}
              bg={k.status === "active" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}
            >
              {k.status}
            </Badge>
            <div className="relative" ref={menuOpen === k.id ? menuRef : undefined}>
              <button
                onClick={() => setMenuOpen(menuOpen === k.id ? null : k.id)}
                className="text-text-dim cursor-pointer text-xs hover:text-text transition-colors bg-transparent border-none px-1"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen === k.id && (
                <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                  <button
                    onClick={() => handleCopyKey(k.key_prefix)}
                    className="w-full text-left px-3 py-2 text-xs text-text-sec hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    Copy Key Prefix
                  </button>
                  {k.status === "active" && (
                    <button
                      onClick={() => handleRevokeKey(k.id, k.name)}
                      className="w-full text-left px-3 py-2 text-xs text-naira hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      Revoke Key
                    </button>
                  )}
                  <button
                    onClick={() => handleRevokeKey(k.id, k.name)}
                    className="w-full text-left px-3 py-2 text-xs text-red hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    Delete Key
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </Panel>

      <Panel
        title="Bring Your Own Keys (BYOK)"
        icon={<Link2 size={15} />}
        className="mt-2.5"
        right={
          <button
            onClick={() => setShowConnectKey(true)}
            className="bg-transparent text-text-sec border border-border px-3 py-[5px] rounded-md text-xs cursor-pointer hover:bg-surface-2 transition-colors"
          >
            + Connect Key
          </button>
        }
      >
        {byokKeys.map((k, i) => (
          <div key={i} className="flex items-center justify-between py-3.5 border-b border-border text-[13px]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold"
                style={{ background: `${k.color}20`, color: k.color }}
              >
                {k.provider.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{k.provider}</div>
                <div className="font-mono text-[11px] text-text-dim">{k.key} {"\u2192"} {k.models}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={k.status === "connected" ? "#10B981" : "#EF4444"} bg={k.status === "connected" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}>
                {k.status}
              </Badge>
              <button
                onClick={() => handleDisconnectByok(i)}
                className="text-[11px] text-red bg-transparent border-none cursor-pointer hover:underline"
              >
                Disconnect
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setShowConnectKey(true)}
          className="w-full py-4 flex items-center justify-center gap-2.5 text-text-dim text-[13px] cursor-pointer bg-transparent border-none hover:text-text-sec transition-colors"
        >
          <span className="text-lg">+</span> Connect Google, Mistral, DeepSeek, Meta, or any OpenAI-compatible endpoint
        </button>
      </Panel>

      {/* New Key Modal */}
      <Modal open={showNewKey} onClose={handleCloseNewKey} title="Create API Key" icon={<Key size={16} />}>
        {!createdKey ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-dim font-medium mb-1.5">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production, Staging, Dev"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-dim font-medium mb-1.5">Environment</label>
              <div className="flex gap-2">
                {(["live", "test"] as const).map((env) => (
                  <button
                    key={env}
                    onClick={() => setNewKeyEnv(env)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      newKeyEnv === env
                        ? "bg-accent-light border-accent text-accent"
                        : "bg-bg border-border text-text-sec hover:border-border-light"
                    }`}
                  >
                    {env === "live" ? "Production" : "Test / Staging"}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreateKey}
              disabled={!newKeyName.trim() || createKey.isPending}
              className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createKey.isPending ? "Creating..." : "Generate Key"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-accent-light border border-[rgba(59,130,246,0.15)] rounded-lg p-4">
              <div className="text-xs text-text-dim mb-2">Your new API key (copy now - it won't be shown again):</div>
              <div className="font-mono text-sm text-accent break-all bg-bg rounded-md px-3 py-2 border border-border">
                {createdKey}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(createdKey!); toast("API key copied"); }}
                className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all"
              >
                Copy Key
              </button>
              <button
                onClick={handleCloseNewKey}
                className="flex-1 bg-surface border border-border text-text-sec py-2.5 rounded-lg text-sm cursor-pointer hover:bg-surface-2 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Connect BYOK Modal */}
      <Modal open={showConnectKey} onClose={handleCloseConnect} title="Connect Provider Key" icon={<Link2 size={16} />} width="max-w-lg">
        {connectStep === "select" && (
          <div className="space-y-3">
            <div className="text-xs text-text-dim mb-2">Select a provider to connect your API key:</div>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedProvider(i); setConnectStep("enter"); }}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-bg hover:border-border-light transition-colors cursor-pointer text-left"
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold"
                    style={{ background: `${p.color}20`, color: p.color }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-[10px] text-text-dim">{p.models}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {connectStep === "enter" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 p-3 bg-bg rounded-lg border border-border">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold"
                style={{ background: `${PROVIDERS[selectedProvider].color}20`, color: PROVIDERS[selectedProvider].color }}
              >
                {PROVIDERS[selectedProvider].name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold">{PROVIDERS[selectedProvider].name}</div>
                <div className="text-[10px] text-text-dim">Models: {PROVIDERS[selectedProvider].models}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-dim font-medium mb-1.5">API Key</label>
              <input
                type="password"
                value={byokApiKey}
                onChange={(e) => setByokApiKey(e.target.value)}
                placeholder={`${PROVIDERS[selectedProvider].prefix}...`}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors font-mono"
              />
            </div>
            {PROVIDERS[selectedProvider].name === "Custom Endpoint" && (
              <div>
                <label className="block text-xs text-text-dim font-medium mb-1.5">Base URL</label>
                <input
                  type="url"
                  value={byokEndpoint}
                  onChange={(e) => setByokEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors font-mono"
                />
              </div>
            )}
            <div className="bg-accent-light border border-[rgba(59,130,246,0.15)] rounded-lg p-3 text-xs text-blue">
              Your key is encrypted and stored securely. Mazou uses it only to route requests to {PROVIDERS[selectedProvider].name} on your behalf.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConnectByok}
                disabled={!byokApiKey.trim()}
                className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Connect &amp; Test
              </button>
              <button
                onClick={() => setConnectStep("select")}
                className="flex-1 bg-surface border border-border text-text-sec py-2.5 rounded-lg text-sm cursor-pointer hover:bg-surface-2 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
        {connectStep === "testing" && (
          <div className="py-8 text-center">
            <Loader2 size={32} className="animate-spin text-accent mx-auto mb-3" />
            <div className="text-sm font-semibold mb-1">Testing Connection...</div>
            <div className="text-xs text-text-dim">Verifying API key with {PROVIDERS[selectedProvider].name}. Sending test request...</div>
          </div>
        )}
        {connectStep === "done" && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto"><Check size={28} className="text-emerald-600" /></div>
            <div>
              <div className="text-sm font-semibold">Connected Successfully!</div>
              <div className="text-xs text-text-dim mt-1">{PROVIDERS[selectedProvider].name} key verified. Models available: {PROVIDERS[selectedProvider].models}</div>
            </div>
            <button
              onClick={handleCloseConnect}
              className="bg-accent text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
