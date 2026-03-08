"use client";

import { useState, useRef, useEffect } from "react";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { generateApiKey, maskApiKey } from "@/lib/utils";

interface ApiKey {
  name: string;
  key: string;
  fullKey: string;
  created: string;
  lastUsed: string;
  calls: string;
  status: "active" | "revoked";
}

interface ByokKey {
  provider: string;
  key: string;
  status: "connected" | "disconnected";
  models: string;
  color: string;
}

const INITIAL_KEYS: ApiKey[] = [
  { name: "Production", key: "mz_live_****...a8f2", fullKey: "mz_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9a8f2", created: "Jan 12, 2026", lastUsed: "2 min ago", calls: "1.1M", status: "active" },
  { name: "Staging", key: "mz_test_****...c3d1", fullKey: "mz_test_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9c3d1", created: "Jan 15, 2026", lastUsed: "4 hrs ago", calls: "86K", status: "active" },
  { name: "Dev - Personal", key: "mz_dev_****...e7b4", fullKey: "mz_dev_q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9e7b4", created: "Feb 2, 2026", lastUsed: "Yesterday", calls: "2.4K", status: "active" },
];

const PROVIDERS = [
  { name: "OpenAI", prefix: "sk-", color: "#10A37F", models: "gpt-4o, gpt-4o-mini, o1, o3" },
  { name: "Anthropic", prefix: "sk-ant-", color: "#D4A274", models: "opus-4.6, sonnet-4.6, haiku-4.5" },
  { name: "Google", prefix: "AIza", color: "#4285F4", models: "gemini-2.5-pro, gemini-2.5-flash" },
  { name: "Mistral", prefix: "mist-", color: "#FF7200", models: "mistral-large, mistral-medium" },
  { name: "DeepSeek", prefix: "sk-ds-", color: "#4D6BFE", models: "deepseek-r1, deepseek-v3" },
  { name: "Custom Endpoint", prefix: "", color: "#66667A", models: "Any OpenAI-compatible API" },
];

export default function APIKeysPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [byokKeys, setByokKeys] = useState<ByokKey[]>([
    { provider: "OpenAI", key: "sk-****...x9f2", status: "connected", models: "gpt-4o, gpt-4o-mini", color: "#10A37F" },
    { provider: "Anthropic", key: "sk-ant-****...m3a1", status: "connected", models: "sonnet, haiku", color: "#D4A274" },
  ]);

  const [showNewKey, setShowNewKey] = useState(false);
  const [showConnectKey, setShowConnectKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState<"live" | "test">("live");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
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

  function handleCreateKey() {
    if (!newKeyName.trim()) return;
    const fullKey = generateApiKey(newKeyEnv === "live" ? "mz_live" : "mz_test");
    const newKey: ApiKey = {
      name: newKeyName,
      key: maskApiKey(fullKey),
      fullKey,
      created: "Just now",
      lastUsed: "Never",
      calls: "0",
      status: "active",
    };
    setKeys((prev) => [...prev, newKey]);
    setCreatedKey(fullKey);
    toast(`API key "${newKeyName}" created`);
  }

  function handleCloseNewKey() {
    setShowNewKey(false);
    setNewKeyName("");
    setNewKeyEnv("live");
    setCreatedKey(null);
  }

  function handleRevokeKey(index: number) {
    setKeys((prev) => prev.map((k, i) => i === index ? { ...k, status: "revoked" } : k));
    setMenuOpen(null);
    toast(`Key "${keys[index].name}" revoked`);
  }

  function handleCopyKey(index: number) {
    navigator.clipboard.writeText(keys[index].fullKey);
    setMenuOpen(null);
    toast("API key copied to clipboard");
  }

  function handleDeleteKey(index: number) {
    const name = keys[index].name;
    setKeys((prev) => prev.filter((_, i) => i !== index));
    setMenuOpen(null);
    toast(`Key "${name}" deleted`);
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

  return (
    <div>
      <Panel
        title="API Keys"
        icon="\uD83D\uDD11"
        right={
          <button
            onClick={() => setShowNewKey(true)}
            className="bg-accent text-black border-none px-3 py-[5px] rounded-md text-xs font-semibold cursor-pointer hover:brightness-110 transition-all"
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
        {keys.map((k, i) => (
          <div key={i} className="grid grid-cols-[1.5fr_2fr_1fr_1fr_0.7fr_0.5fr] items-center py-3.5 border-b border-border text-[13px]">
            <span className="font-semibold">{k.name}</span>
            <span className="font-mono text-xs text-text-dim">{k.key}</span>
            <span className="text-text-dim text-xs">{k.lastUsed}</span>
            <span className="font-mono text-text-sec">{k.calls}</span>
            <Badge
              color={k.status === "active" ? "#00D26A" : "#FF4D4D"}
              bg={k.status === "active" ? "rgba(0,210,106,0.08)" : "rgba(255,77,77,0.08)"}
            >
              {k.status}
            </Badge>
            <div className="relative" ref={menuOpen === i ? menuRef : undefined}>
              <button
                onClick={() => setMenuOpen(menuOpen === i ? null : i)}
                className="text-text-dim cursor-pointer text-xs hover:text-text transition-colors bg-transparent border-none px-1"
              >
                \u2022\u2022\u2022
              </button>
              {menuOpen === i && (
                <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                  <button
                    onClick={() => handleCopyKey(i)}
                    className="w-full text-left px-3 py-2 text-xs text-text-sec hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    Copy Full Key
                  </button>
                  {k.status === "active" && (
                    <button
                      onClick={() => handleRevokeKey(i)}
                      className="w-full text-left px-3 py-2 text-xs text-naira hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      Revoke Key
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteKey(i)}
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
        icon="\uD83D\uDD17"
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
                <div className="font-mono text-[11px] text-text-dim">{k.key} \u2192 {k.models}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={k.status === "connected" ? "#00D26A" : "#FF4D4D"} bg={k.status === "connected" ? "rgba(0,210,106,0.08)" : "rgba(255,77,77,0.08)"}>
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
      <Modal open={showNewKey} onClose={handleCloseNewKey} title="Create API Key" icon="\uD83D\uDD11">
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
                        ? "bg-[rgba(0,210,106,0.08)] border-accent text-accent"
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
              disabled={!newKeyName.trim()}
              className="w-full bg-accent text-black py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate Key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[rgba(0,210,106,0.06)] border border-[rgba(0,210,106,0.15)] rounded-lg p-4">
              <div className="text-xs text-text-dim mb-2">Your new API key (copy now \u2014 it won't be shown again):</div>
              <div className="font-mono text-sm text-accent break-all bg-bg rounded-md px-3 py-2 border border-border">
                {createdKey}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(createdKey!); toast("API key copied"); }}
                className="flex-1 bg-accent text-black py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all"
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
      <Modal open={showConnectKey} onClose={handleCloseConnect} title="Connect Provider Key" icon="\uD83D\uDD17" width="max-w-lg">
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
            <div className="bg-[rgba(77,138,255,0.06)] border border-[rgba(77,138,255,0.15)] rounded-lg p-3 text-xs text-blue">
              Your key is encrypted and stored securely. Mazou uses it only to route requests to {PROVIDERS[selectedProvider].name} on your behalf.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConnectByok}
                disabled={!byokApiKey.trim()}
                className="flex-1 bg-accent text-black py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="text-3xl mb-3 animate-spin inline-block">\u23F3</div>
            <div className="text-sm font-semibold mb-1">Testing Connection...</div>
            <div className="text-xs text-text-dim">Verifying API key with {PROVIDERS[selectedProvider].name}. Sending test request...</div>
          </div>
        )}
        {connectStep === "done" && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[rgba(0,210,106,0.1)] flex items-center justify-center text-2xl mx-auto">\u2713</div>
            <div>
              <div className="text-sm font-semibold">Connected Successfully!</div>
              <div className="text-xs text-text-dim mt-1">{PROVIDERS[selectedProvider].name} key verified. Models available: {PROVIDERS[selectedProvider].models}</div>
            </div>
            <button
              onClick={handleCloseConnect}
              className="bg-accent text-black px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
