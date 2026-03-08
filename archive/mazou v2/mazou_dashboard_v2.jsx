import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#09090B", sidebarBg: "#0C0C0F", surface: "#111114", surface2: "#161619", surface3: "#1C1C20",
  border: "#1E1E24", borderLight: "#2A2A32", text: "#E8E8ED", textSec: "#A0A0B4", textDim: "#66667A",
  accent: "#00D26A", accentMuted: "#00A854", accentBg: "rgba(0,210,106,0.08)", accentBgStrong: "rgba(0,210,106,0.15)",
  naira: "#FFB800", nairaBg: "rgba(255,184,0,0.08)", nairaBgStrong: "rgba(255,184,0,0.15)",
  red: "#FF4D4D", redBg: "rgba(255,77,77,0.08)", blue: "#4D8AFF", blueBg: "rgba(77,138,255,0.08)",
  purple: "#A855F7", purpleBg: "rgba(168,85,247,0.08)", openai: "#10A37F", anthropic: "#D4A274", google: "#4285F4", meta: "#0668E1", mistral: "#FF7200",
  teal: "#2DD4BF", tealBg: "rgba(45,212,191,0.08)", tealBgStrong: "rgba(45,212,191,0.15)", coinbase: "#0052FF", stripePurple: "#635BFF"
};

const mono = "'JetBrains Mono',monospace";
const font = "'DM Sans',sans-serif";

// ---- DATA ----
const featureData = [
  { name: "Customer Support Bot", tag: "agent", model: "gpt-4o", african: false, calls: "842K", cost: 1940000, pct: 90, tip: "→ Sonnet · Save ₦890K", actionable: true },
  { name: "Transaction Summariser", tag: "feature", model: "claude-sonnet", african: false, calls: "286K", cost: 620000, pct: 55, tip: "→ Haiku · Save ₦248K", actionable: true },
  { name: "Yoruba Chat Translation", tag: "feature", model: "SabiYarn", african: true, calls: "64K", cost: 86400, pct: 18, tip: "✓ Optimal", actionable: false },
  { name: "Fraud Detection Agent", tag: "agent", model: "gpt-4o", african: false, calls: "91K", cost: 287200, pct: 22, tip: "✓ Optimal", actionable: false },
  { name: "Receipt OCR", tag: "feature", model: "gemini-pro", african: false, calls: "38K", cost: 42000, pct: 8, tip: "✓ Optimal", actionable: false },
  { name: "Hausa Email Classifier", tag: "feature", model: "Oversabi", african: true, calls: "22K", cost: 18600, pct: 5, tip: "✓ Optimal", actionable: false },
  { name: "Document Extraction", tag: "feature", model: "gpt-4o-mini", african: false, calls: "156K", cost: 124000, pct: 12, tip: "→ Gemini · Save ₦38K", actionable: true },
  { name: "Compliance Reviewer", tag: "agent", model: "gpt-4o", african: false, calls: "3.2K", cost: 41000, pct: 4, tip: "✓ Optimal", actionable: false },
  { name: "Agent Search (Exa)", tag: "service", model: "Coinbase 0x7a3f", african: false, calls: "4.2K", cost: 134720, pct: 6, tip: "✓ Tracking", actionable: false, service: true },
  { name: "Risk Data (Stripe)", tag: "service", model: "Stripe acct_1Nq", african: false, calls: "107", cost: 37440, pct: 2, tip: "✓ Tracking", actionable: false, service: true },
];

const modelData = [
  { name: "GPT-4o", provider: "OpenAI", icon: "OA", color: COLORS.openai, spend: 2227200, pct: 78, calls: "933K", latency: "1.2s" },
  { name: "Claude Sonnet", provider: "Anthropic", icon: "AN", color: COLORS.anthropic, spend: 320000, pct: 32, calls: "286K", latency: "0.9s" },
  { name: "GPT-4o Mini", provider: "OpenAI", icon: "OA", color: COLORS.openai, spend: 124000, pct: 14, calls: "156K", latency: "0.6s" },
  { name: "SabiYarn", provider: "African", icon: "AF", color: COLORS.naira, spend: 86400, pct: 12, calls: "64K", latency: "0.8s" },
  { name: "Gemini Pro", provider: "Google", icon: "GO", color: COLORS.google, spend: 42000, pct: 6, calls: "38K", latency: "1.1s" },
  { name: "Claude Haiku", provider: "Anthropic", icon: "AN", color: COLORS.anthropic, spend: 18600, pct: 4, calls: "48K", latency: "0.3s" },
  { name: "Oversabi", provider: "African", icon: "AF", color: COLORS.naira, spend: 18600, pct: 3, calls: "22K", latency: "0.7s" },
  { name: "Llama 3", provider: "Meta", icon: "MT", color: COLORS.meta, spend: 12400, pct: 2, calls: "18K", latency: "0.5s" },
  { name: "Coinbase Agent Wallets", provider: "Service", icon: "CB", color: COLORS.coinbase, spend: 134720, pct: 6, calls: "4.2K", latency: "—", service: true, byok: true },
  { name: "Stripe Agent Commerce", provider: "Service", icon: "ST", color: COLORS.stripePurple, spend: 37440, pct: 2, calls: "107", latency: "—", service: true, byok: true },
];

const agentData = [
  { name: "Customer Support Bot", status: "live", models: "gpt-4o, haiku", calls: "842K", cost: "₦1.94M", trend: "+15%", up: true, tasks: 12400, errors: 23, uptime: "99.8%", serviceKey: "CB 0x7a3f", serviceColor: COLORS.coinbase },
  { name: "Fraud Detection Agent", status: "live", models: "gpt-4o", calls: "91K", cost: "₦287K", trend: "-3%", up: false, tasks: 2800, errors: 2, uptime: "99.99%", serviceKey: "ST acct_1Nq", serviceColor: COLORS.stripePurple },
  { name: "Onboarding Assistant", status: "live", models: "sonnet, SabiYarn", calls: "24K", cost: "₦68K", trend: "-8%", up: false, tasks: 860, errors: 5, uptime: "99.7%", serviceKey: "CB 0x1b2c", serviceColor: COLORS.coinbase },
  { name: "Compliance Reviewer", status: "idle", models: "gpt-4o", calls: "3.2K", cost: "₦41K", trend: "-22%", up: false, tasks: 120, errors: 0, uptime: "100%", serviceKey: null, serviceColor: null },
];

const routeLog = [
  { time: "2m ago", agent: "Support Bot", action: "routed to", to: "claude-haiku", from: "gpt-4o", reason: "Simple FAQ detected.", saved: "₦0.80", tag: "routed" },
  { time: "4m ago", agent: "Fraud Agent", action: "kept on", to: "gpt-4o", from: null, reason: "Complex reasoning required.", saved: null, tag: "optimal" },
  { time: "6m ago", agent: "Yoruba Chat", action: "routed to", to: "SabiYarn", from: "claude-sonnet", reason: "Local language detected. Better quality + lower cost.", saved: "₦1.20", tag: "routed" },
  { time: "8m ago", agent: "Support Bot", action: "wallet paid", to: "Exa search", from: null, reason: "Agent wallet 0x7a3f paid $0.12 via X42.", saved: null, tag: "service" },
  { time: "11m ago", agent: "Receipt OCR", action: "fallback to", to: "gpt-4o-mini", from: "gemini-pro", reason: "Gemini timed out. Completed in 1.2s.", saved: null, tag: "fallback" },
  { time: "14m ago", agent: "Summariser", action: "batch routed to", to: "claude-haiku", from: "claude-sonnet", reason: "48 requests batched.", saved: "₦12.40", tag: "routed" },
  { time: "18m ago", agent: "Hausa Classifier", action: "routed to", to: "Oversabi", from: "gpt-4o", reason: "Hausa input detected. Local model 40% more accurate.", saved: "₦2.10", tag: "routed" },
  { time: "23m ago", agent: "Support Bot", action: "cache hit", to: null, from: null, reason: "Identical query found in cache. No API call made.", saved: "₦2.30", tag: "cached" },
  { time: "31m ago", agent: "Doc Extraction", action: "routed to", to: "gpt-4o-mini", from: "gpt-4o", reason: "Simple document structure. Mini sufficient.", saved: "₦0.60", tag: "routed" },
];

const optimisations = [
  { icon: "💰", type: "save", title: "Downgrade Support Bot to Claude Sonnet", desc: "842K calls/mo using GPT-4o for tier-1 support. Sonnet handles 96% of these with identical quality scores.", amount: "₦890K/mo", impact: "high" },
  { icon: "🔄", type: "swap", title: "Route Summariser to Haiku for short inputs", desc: "72% of summarisation inputs are under 500 tokens. Haiku matches Sonnet quality at this length.", amount: "₦248K/mo", impact: "high" },
  { icon: "📦", type: "cache", title: "Enable response caching for Support Bot", desc: "34% of support queries are repeated questions. Caching would eliminate redundant API calls.", amount: "₦186K/mo", impact: "medium" },
  { icon: "⚡", type: "batch", title: "Batch Transaction Summariser calls", desc: "Currently sending individual requests. Batching 50 at a time reduces per-call overhead by 18%.", amount: "₦62K/mo", impact: "medium" },
  { icon: "🌍", type: "swap", title: "Route Hausa tasks to Oversabi", desc: "14K Hausa-language calls going to GPT-4o. Oversabi scores 40% higher on Hausa benchmarks at 60% the cost.", amount: "₦38K/mo", impact: "medium" },
];

const africanModels = [
  { name: "SabiYarn", type: "NLP · Text", desc: "Nigerian multilingual language model. Strong on Yoruba, Hausa, Igbo, and Pidgin text generation and understanding.", langs: ["Yoruba", "Hausa", "Igbo", "Pidgin"], active: true, calls: "64K", spend: "₦86.4K" },
  { name: "Oversabi", type: "NLP · Chat", desc: "Conversational AI tuned on West African dialog patterns. Ideal for customer support in local languages.", langs: ["Yoruba", "Pidgin", "English-NG"], active: true, calls: "22K", spend: "₦18.6K" },
  { name: "AfriSpeech", type: "Speech · STT", desc: "Speech-to-text optimised for African accents and multilingual code-switching in voice interactions.", langs: ["120+ accents", "Code-switch"], active: false, calls: "—", spend: "—" },
  { name: "N-ATLAS", type: "Translation", desc: "Neural translation across 20+ African languages. Outperforms Google Translate on low-resource language pairs.", langs: ["Swahili", "Amharic", "Wolof", "+17"], active: false, calls: "—", spend: "—" },
  { name: "Oyster", type: "NLP · Embed", desc: "Embedding model trained on African language corpora. Better semantic search for African-language documents.", langs: ["Pan-African", "50+ langs"], active: false, calls: "—", spend: "—" },
  { name: "IrokoBench", type: "Benchmark", desc: "Evaluation suite for testing LLM performance across African languages. Used for routing quality scoring.", langs: ["Benchmark", "16 langs"], active: false, calls: "—", spend: "—" },
];

const routingRules = [
  { name: "Language Detection", desc: "If input is Yoruba/Hausa/Igbo/Pidgin → route to SabiYarn or Oversabi", status: "active", triggers: "1,240/day" },
  { name: "Simple Query Downgrade", desc: "If Support Bot query < 100 tokens and matches FAQ pattern → route to Haiku", status: "active", triggers: "680/day" },
  { name: "Cost Cap", desc: "If feature monthly spend exceeds ₦500K → flag for review and suggest alternatives", status: "active", triggers: "2 alerts" },
  { name: "Latency Fallback", desc: "If primary model response > 5s → fallback to next cheapest capable model", status: "active", triggers: "34/day" },
  { name: "Batch Detection", desc: "If > 10 identical-structure requests within 60s → batch process", status: "active", triggers: "89/day" },
  { name: "Quality Gate", desc: "If routing saves > ₦1 but quality score drops > 5% → keep original model", status: "active", triggers: "12/day" },
];

// ---- FORMATTING ----
const fmt = (n) => {
  if (n >= 1000000) return `₦${(n/1000000).toFixed(2)}M`;
  if (n >= 1000) return `₦${(n/1000).toFixed(0)}K`;
  return `₦${n}`;
};

// ---- COMPONENTS ----
const Badge = ({ children, color = COLORS.accent, bg = COLORS.accentBg }) => (
  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: bg, color, fontFamily: mono }}>{children}</span>
);

const Panel = ({ title, icon, tabs, activeTab, onTabChange, right, children, style }) => (
  <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", ...style }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: COLORS.textDim }}>{icon}</span> {title}
      </div>
      {tabs && (
        <div style={{ display: "flex", gap: 0, background: COLORS.bg, borderRadius: 6, padding: 2 }}>
          {tabs.map(t => (
            <div key={t} onClick={() => onTabChange?.(t)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 4, color: activeTab === t ? COLORS.text : COLORS.textDim, background: activeTab === t ? COLORS.surface2 : "transparent", cursor: "pointer", fontWeight: 500 }}>{t}</div>
          ))}
        </div>
      )}
      {right}
    </div>
    <div style={{ padding: "14px 16px" }}>{children}</div>
  </div>
);

const StatCard = ({ label, value, change, changeType, color }) => (
  <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.textDim, marginBottom: 6, fontWeight: 500 }}>{label}</div>
    <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4, color: color || COLORS.text }}>{value}</div>
    <div style={{ fontSize: 11, color: changeType === "up" ? COLORS.accent : changeType === "down" ? COLORS.red : COLORS.textDim }}>{change}</div>
  </div>
);

const BarFill = ({ pct, color, height = 6 }) => {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(pct), 100); }, [pct]);
  return (
    <div style={{ width: "100%", height, background: COLORS.bg, borderRadius: height/2, overflow: "hidden" }}>
      <div style={{ width: `${w}%`, height: "100%", borderRadius: height/2, background: color, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
};

// ---- PAGES ----

// DASHBOARD
const DashboardPage = () => (
  <div>
    <div style={{ background: COLORS.accentBg, border: "1px solid rgba(0,210,106,0.2)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
        <span>💡</span>
        <span>Smart Routing found <strong style={{ color: COLORS.accent }}>₦1,138,880 in potential savings</strong> this month across 5 recommendations.</span>
      </div>
      <button style={{ background: COLORS.accent, color: "#000", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: font }}>Review →</button>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
      <StatCard label="Total Spend" value="₦3.02M" change="↓ 4% · LLMs + services" changeType="up" color={COLORS.naira} />
      <StatCard label="API Calls" value="1.24M" change="↑ 12% vs last month" changeType="up" />
      <StatCard label="Connected Services" value="11" change="8 models · 2 wallets · 1 commerce" />
      <StatCard label="Saved This Month" value="₦486K" change="via smart routing" changeType="up" color={COLORS.accent} />
      <StatCard label="Wallet Balances" value="₦4.28M" change="+ $1,850 USDT" color={COLORS.naira} />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 10, marginBottom: 10 }}>
      <Panel title="Spend by Feature" icon="⬡">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.textDim, fontWeight: 600 }}>
              <th style={{ textAlign: "left", paddingBottom: 10 }}>Feature</th>
              <th style={{ textAlign: "left", paddingBottom: 10 }}>Model</th>
              <th style={{ textAlign: "left", paddingBottom: 10 }}>Calls</th>
              <th style={{ textAlign: "left", paddingBottom: 10, width: 100 }}>Spend</th>
              <th style={{ textAlign: "left", paddingBottom: 10 }}>Cost</th>
              <th style={{ textAlign: "right", paddingBottom: 10 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {featureData.slice(0, 7).map((f, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "10px 0" }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{f.name}</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: f.service ? COLORS.teal : COLORS.textDim, background: f.service ? COLORS.tealBg : COLORS.bg, padding: "1px 6px", borderRadius: 3, marginLeft: 6 }}>{f.tag}</span>
                </td>
                <td><span style={{ fontFamily: mono, fontSize: 12, color: f.service ? COLORS.teal : f.african ? COLORS.naira : COLORS.textSec }}>{f.model}</span></td>
                <td><span style={{ fontFamily: mono, fontSize: 13, color: COLORS.textSec }}>{f.calls}</span></td>
                <td><BarFill pct={f.pct} color={f.pct > 70 ? COLORS.red : f.pct > 40 ? COLORS.naira : COLORS.accent} /></td>
                <td><span style={{ fontFamily: mono, fontSize: 13, fontWeight: 500 }}>{fmt(f.cost)}</span></td>
                <td style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 100, background: f.actionable ? COLORS.accentBg : "transparent", color: f.actionable ? COLORS.accent : COLORS.textDim, cursor: f.actionable ? "pointer" : "default" }}>{f.tip}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Service Usage" icon="◈">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {modelData.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: `${m.color}20`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}{m.byok && <span style={{ fontSize: 9, color: COLORS.teal, fontWeight: 600, marginLeft: 6, background: COLORS.tealBg, padding: "1px 5px", borderRadius: 3 }}>BYOK</span>}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: m.service ? COLORS.teal : COLORS.textSec }}>{m.service ? `$${(m.spend/1600).toFixed(0)}` : fmt(m.spend)}</span>
                </div>
                <BarFill pct={m.pct} color={m.color} height={4} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Panel title="Smart Routing · Live" icon="⚡">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {routeLog.slice(0, 6).map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: 10, background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: COLORS.textDim, width: 42, flexShrink: 0, paddingTop: 2 }}>{r.time}</div>
              <div>
                <div style={{ fontSize: 12, color: COLORS.textSec, lineHeight: 1.5 }}>
                  <strong style={{ color: COLORS.text }}>{r.agent}</strong> — {r.action} {r.to && <span style={{ color: r.tag === "service" ? COLORS.teal : COLORS.accent, fontFamily: mono, fontSize: 11 }}>{r.to}</span>}
                  {r.from && <> instead of <span style={{ color: COLORS.red, fontFamily: mono, fontSize: 11, textDecoration: "line-through", opacity: 0.6 }}>{r.from}</span></>}
                  . {r.reason} {r.saved && <span style={{ color: COLORS.accent, fontWeight: 600 }}>Saved {r.saved}</span>}
                </div>
                <span style={{ display: "inline-block", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", padding: "1px 5px", borderRadius: 3, fontWeight: 600, marginTop: 4,
                  background: r.tag === "routed" ? COLORS.accentBg : r.tag === "optimal" ? COLORS.nairaBg : r.tag === "cached" ? COLORS.purpleBg : r.tag === "service" ? COLORS.tealBg : COLORS.blueBg,
                  color: r.tag === "routed" ? COLORS.accent : r.tag === "optimal" ? COLORS.naira : r.tag === "cached" ? COLORS.purple : r.tag === "service" ? COLORS.teal : COLORS.blue
                }}>{r.tag === "routed" ? "Smart Routed" : r.tag === "optimal" ? "Optimal" : r.tag === "cached" ? "Cache Hit" : r.tag === "service" ? "Service" : "Fallback"}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Top Recommendations" icon="💡" right={<span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>₦1.14M saveable</span>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {optimisations.slice(0, 4).map((o, i) => (
            <div key={i} style={{ padding: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, display: "flex", gap: 10, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                background: o.type === "save" ? COLORS.accentBg : o.type === "swap" ? COLORS.nairaBg : o.type === "cache" ? COLORS.blueBg : COLORS.purpleBg
              }}>{o.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{o.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.5 }}>{o.desc}</div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, color: COLORS.accent, whiteSpace: "nowrap", paddingTop: 2 }}>{o.amount}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  </div>
);

// USAGE & SPEND
const UsagePage = () => {
  const [tab, setTab] = useState("Features");
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        <StatCard label="Total Spend (Feb)" value="₦2.85M" change="↓ 8% vs Jan" changeType="up" color={COLORS.naira} />
        <StatCard label="Total Calls" value="1.24M" change="↑ 12%" changeType="up" />
        <StatCard label="Avg Cost/Call" value="₦2.30" change="↓ 18% via routing" changeType="up" color={COLORS.accent} />
        <StatCard label="Most Expensive" value="Support Bot" change="₦1.94M — 68% of total" changeType="down" color={COLORS.red} />
      </div>

      <Panel title="Usage Breakdown" icon="⬡" tabs={["Features", "Agents", "Models"]} activeTab={tab} onTabChange={setTab}>
        {tab === "Features" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.textDim, fontWeight: 600 }}>
                <th style={{ textAlign: "left", paddingBottom: 10 }}>Feature</th>
                <th style={{ textAlign: "left", paddingBottom: 10 }}>Model</th>
                <th style={{ textAlign: "left", paddingBottom: 10 }}>Calls</th>
                <th style={{ textAlign: "left", paddingBottom: 10, width: 120 }}>% of Spend</th>
                <th style={{ textAlign: "left", paddingBottom: 10 }}>Cost</th>
                <th style={{ textAlign: "right", paddingBottom: 10 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {featureData.map((f, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "10px 0" }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{f.name}</span>
                    <span style={{ fontFamily: mono, fontSize: 10, color: COLORS.textDim, background: COLORS.bg, padding: "1px 6px", borderRadius: 3, marginLeft: 6 }}>{f.tag}</span>
                  </td>
                  <td><span style={{ fontFamily: mono, fontSize: 12, color: f.african ? COLORS.naira : COLORS.textSec }}>{f.model}</span></td>
                  <td><span style={{ fontFamily: mono, fontSize: 13, color: COLORS.textSec }}>{f.calls}</span></td>
                  <td><BarFill pct={f.pct} color={f.pct > 70 ? COLORS.red : f.pct > 40 ? COLORS.naira : COLORS.accent} /></td>
                  <td><span style={{ fontFamily: mono, fontSize: 13, fontWeight: 500 }}>{fmt(f.cost)}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 100, background: f.actionable ? COLORS.accentBg : "transparent", color: f.actionable ? COLORS.accent : COLORS.textDim }}>{f.tip}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "Agents" && (
          <div>
            {agentData.map((a, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.7fr 0.8fr 0.7fr 0.7fr", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.status === "live" ? COLORS.accent : COLORS.textDim, boxShadow: a.status === "live" ? `0 0 6px ${COLORS.accent}` : "none" }} />
                  {a.name}
                </div>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textDim }}>{a.models}</span>
                <span style={{ fontFamily: mono, color: COLORS.textSec }}>{a.calls}</span>
                <span style={{ fontFamily: mono, fontWeight: 500 }}>{a.cost}</span>
                <span style={{ fontFamily: mono, color: a.up ? COLORS.red : COLORS.accent }}>{a.trend}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textDim }}>{a.uptime}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "Models" && (
          <div>
            {modelData.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.7fr 0.7fr 1fr", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 5, background: `${m.color}20`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{m.icon}</div>
                  <span style={{ fontWeight: 500 }}>{m.name}</span>
                  {m.provider === "African" && <Badge color={COLORS.naira} bg={COLORS.nairaBg}>African</Badge>}
                </div>
                <span style={{ fontFamily: mono, color: COLORS.textSec }}>{m.calls}</span>
                <span style={{ fontFamily: mono, color: COLORS.textSec }}>{m.latency}</span>
                <span style={{ fontFamily: mono, fontWeight: 500 }}>{fmt(m.spend)}</span>
                <BarFill pct={m.pct} color={m.color} height={4} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

// SMART ROUTING
const RoutingPage = () => {
  const [tab, setTab] = useState("Live Feed");
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        <StatCard label="Routed Today" value="2,847" change="68% of all requests" color={COLORS.accent} />
        <StatCard label="Saved Today" value="₦18,400" change="avg ₦6.46/routed call" changeType="up" color={COLORS.accent} />
        <StatCard label="Fallbacks" value="34" change="1.2% of requests" />
        <StatCard label="Cache Hits" value="412" change="14.5% hit rate" color={COLORS.purple} />
      </div>

      <Panel title="Smart Routing" icon="⚡" tabs={["Live Feed", "Rules"]} activeTab={tab} onTabChange={setTab}>
        {tab === "Live Feed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {routeLog.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: 12, background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontFamily: mono, fontSize: 10, color: COLORS.textDim, width: 50, flexShrink: 0, paddingTop: 2 }}>{r.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: COLORS.textSec, lineHeight: 1.6 }}>
                    <strong style={{ color: COLORS.text }}>{r.agent}</strong> — {r.action} {r.to && <span style={{ color: COLORS.accent, fontFamily: mono, fontSize: 11 }}>{r.to}</span>}
                    {r.from && <> instead of <span style={{ color: COLORS.red, fontFamily: mono, fontSize: 11, textDecoration: "line-through", opacity: 0.6 }}>{r.from}</span></>}
                    . {r.reason} {r.saved && <span style={{ color: COLORS.accent, fontWeight: 600 }}>Saved {r.saved}</span>}
                  </div>
                  <span style={{ display: "inline-block", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", padding: "1px 5px", borderRadius: 3, fontWeight: 600, marginTop: 4,
                    background: r.tag === "routed" ? COLORS.accentBg : r.tag === "optimal" ? COLORS.nairaBg : r.tag === "cached" ? COLORS.purpleBg : COLORS.blueBg,
                    color: r.tag === "routed" ? COLORS.accent : r.tag === "optimal" ? COLORS.naira : r.tag === "cached" ? COLORS.purple : COLORS.blue
                  }}>{r.tag === "routed" ? "Smart Routed" : r.tag === "optimal" ? "Optimal" : r.tag === "cached" ? "Cache Hit" : "Fallback"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "Rules" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {routingRules.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textDim }}>{r.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textDim }}>{r.triggers}</span>
                  <Badge color={COLORS.accent} bg={COLORS.accentBg}>Active</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

// AGENTS
const AgentsPage = () => {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        <StatCard label="Active Agents" value="3" change="1 idle" />
        <StatCard label="Agent Spend" value="₦2.34M" change="82% of total" color={COLORS.naira} />
        <StatCard label="Total Tasks" value="16,180" change="this month" />
        <StatCard label="Error Rate" value="0.19%" change="30 errors total" changeType="up" color={COLORS.accent} />
      </div>

      <Panel title="AI Agents" icon="🤖">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {agentData.map((a, i) => (
            <div key={i} onClick={() => setSelected(selected === i ? null : i)}
              style={{ padding: 16, background: selected === i ? COLORS.surface2 : COLORS.bg, border: `1px solid ${selected === i ? COLORS.accent : COLORS.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.status === "live" ? COLORS.accent : COLORS.textDim, boxShadow: a.status === "live" ? `0 0 8px ${COLORS.accent}` : "none" }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                </div>
                <Badge color={a.status === "live" ? COLORS.accent : COLORS.textDim} bg={a.status === "live" ? COLORS.accentBg : COLORS.bg}>{a.status}</Badge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cost</div>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, marginTop: 2 }}>{a.cost}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Calls</div>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, marginTop: 2 }}>{a.calls}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Trend</div>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, marginTop: 2, color: a.up ? COLORS.red : COLORS.accent }}>{a.trend}</div>
                </div>
              </div>
              {selected === i && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                    <div><span style={{ color: COLORS.textDim }}>Models:</span> <span style={{ fontFamily: mono, fontSize: 11 }}>{a.models}</span></div>
                    <div><span style={{ color: COLORS.textDim }}>Service:</span> <span style={{ fontFamily: mono, fontSize: 11, color: a.serviceColor || COLORS.textDim }}>{a.serviceKey || "—"}</span></div>
                    <div><span style={{ color: COLORS.textDim }}>Tasks:</span> <span style={{ fontFamily: mono }}>{a.tasks.toLocaleString()}</span></div>
                    <div><span style={{ color: COLORS.textDim }}>Errors:</span> <span style={{ fontFamily: mono }}>{a.errors}</span></div>
                    <div><span style={{ color: COLORS.textDim }}>Uptime:</span> <span style={{ fontFamily: mono, color: COLORS.accent }}>{a.uptime}</span></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

// MODELS
const ModelsPage = () => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
      <StatCard label="Total Models" value="12" change="8 active" />
      <StatCard label="Global Models" value="6" change="OpenAI, Anthropic, Google, Meta" />
      <StatCard label="African Models" value="6" change="2 active, 4 available" color={COLORS.naira} />
      <StatCard label="Avg Latency" value="0.84s" change="across all models" />
    </div>

    <Panel title="All Models" icon="◈" style={{ marginBottom: 10 }}>
      {modelData.map((m, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 0.7fr 0.7fr 0.7fr 1.2fr", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: `${m.color}20`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{m.icon}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim }}>{m.provider}</div>
            </div>
          </div>
          <span style={{ fontFamily: mono, color: COLORS.textSec }}>{m.calls} calls</span>
          <span style={{ fontFamily: mono, color: COLORS.textSec }}>{m.latency}</span>
          <span style={{ fontFamily: mono, fontWeight: 600 }}>{fmt(m.spend)}</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textDim }}>{m.pct}%</span>
          <BarFill pct={m.pct} color={m.color} height={4} />
        </div>
      ))}
    </Panel>
  </div>
);

// AFRICAN CATALOGUE
const AfricanPage = () => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
      <StatCard label="African Models" value="6" change="2 active on your account" color={COLORS.naira} />
      <StatCard label="African Spend" value="₦105K" change="3.7% of total" color={COLORS.naira} />
      <StatCard label="Languages Covered" value="50+" change="across all models" />
      <StatCard label="Quality vs Global" value="+40%" change="on local language tasks" changeType="up" color={COLORS.accent} />
    </div>

    <Panel title="African Model Catalogue" icon="🌍">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {africanModels.map((m, i) => (
          <div key={i} style={{ padding: 16, background: COLORS.bg, border: `1px solid ${m.active ? COLORS.naira + "40" : COLORS.border}`, borderRadius: 8, transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.naira }}>{m.name}</span>
              <Badge color={m.active ? COLORS.accent : COLORS.textDim} bg={m.active ? COLORS.accentBg : COLORS.bg}>{m.active ? "Active" : "Available"}</Badge>
            </div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.textDim, marginBottom: 8 }}>{m.type}</div>
            <div style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.5, marginBottom: 10 }}>{m.desc}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: m.active ? 10 : 0 }}>
              {m.langs.map((l, j) => (
                <span key={j} style={{ fontSize: 9, padding: "1px 5px", background: COLORS.nairaBg, color: COLORS.naira, borderRadius: 3, fontFamily: mono }}>{l}</span>
              ))}
            </div>
            {m.active && (
              <div style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                <div><span style={{ color: COLORS.textDim }}>Calls: </span><span style={{ fontFamily: mono }}>{m.calls}</span></div>
                <div><span style={{ color: COLORS.textDim }}>Spend: </span><span style={{ fontFamily: mono }}>{m.spend}</span></div>
              </div>
            )}
            {!m.active && (
              <button style={{ marginTop: 8, width: "100%", padding: "6px 0", background: COLORS.nairaBg, border: `1px solid ${COLORS.naira}40`, borderRadius: 6, color: COLORS.naira, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Activate Model →</button>
            )}
          </div>
        ))}
      </div>
    </Panel>
  </div>
);

// RECOMMENDATIONS
const RecommendationsPage = () => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
      <StatCard label="Total Saveable" value="₦1.14M/mo" change="across 5 recommendations" color={COLORS.accent} />
      <StatCard label="Already Saved" value="₦486K" change="this month via routing" changeType="up" color={COLORS.accent} />
      <StatCard label="Implemented" value="2 of 5" change="3 pending review" />
    </div>

    <Panel title="Optimisation Recommendations" icon="💡" right={<span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>Sorted by impact</span>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {optimisations.map((o, i) => (
          <div key={i} style={{ padding: 16, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              background: o.type === "save" ? COLORS.accentBg : o.type === "swap" ? COLORS.nairaBg : o.type === "cache" ? COLORS.blueBg : COLORS.purpleBg
            }}>{o.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{o.title}</div>
                <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: COLORS.accent }}>{o.amount}</div>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, marginBottom: 10 }}>{o.desc}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "5px 14px", background: COLORS.accent, color: "#000", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Apply Now</button>
                <button style={{ padding: "5px 14px", background: "transparent", color: COLORS.textSec, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: font }}>Dismiss</button>
                <Badge color={o.impact === "high" ? COLORS.red : COLORS.naira} bg={o.impact === "high" ? COLORS.redBg : COLORS.nairaBg}>{o.impact} impact</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  </div>
);

// BILLING
const BillingPage = () => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
      <StatCard label="Naira Balance" value="₦4.28M" change="funded 3 days ago" color={COLORS.naira} />
      <StatCard label="USDT Balance" value="$1,850" change="TRC-20 stablecoin" color={COLORS.teal} />
      <StatCard label="Feb Spend" value="₦3.02M" change="LLMs + agent services" color={COLORS.naira} />
      <StatCard label="Avg Daily Burn" value="₦126K" change="est. 10 days left" />
      <StatCard label="Payment Methods" value="3" change="Paystack · USDT · Crypto" />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>₦ Naira Wallet</span>
          <span style={{ fontSize: 11, color: COLORS.textDim }}>via Paystack · Auto-fund at ₦500K</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: COLORS.naira, marginBottom: 6 }}>₦4,280,000</div>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 12 }}>~$2,675 at ₦1,600/$1</div>
        <div style={{ height: 4, background: COLORS.surface3, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: "68%", height: "100%", borderRadius: 4, background: COLORS.naira }} />
        </div>
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.teal }}>◆ USDT Wallet</span>
          <span style={{ fontSize: 11, color: COLORS.textDim }}>TRC-20 · For agent services &amp; cross-border</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: COLORS.teal, marginBottom: 6 }}>$1,850.00</div>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 12 }}>Funds agent wallet top-ups and USD-denominated services</div>
        <div style={{ height: 4, background: COLORS.surface3, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: "42%", height: "100%", borderRadius: 4, background: COLORS.teal }} />
        </div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Panel title="Recent Transactions" icon="₦">
        {[
          { date: "Feb 21", desc: "Wallet funded", amount: "+₦5,000,000", type: "credit" },
          { date: "Feb 21", desc: "USDT deposit", amount: "+$500.00", type: "credit", usdt: true },
          { date: "Feb 20", desc: "Daily AI + services", amount: "-₦132,400", type: "debit" },
          { date: "Feb 19", desc: "Daily AI + services", amount: "-₦118,200", type: "debit" },
          { date: "Feb 18", desc: "Agent wallet top-up", amount: "-$200.00", type: "debit", usdt: true },
          { date: "Feb 17", desc: "Daily AI + services", amount: "-₦108,600", type: "debit" },
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textDim, width: 48 }}>{t.date}</span>
              <span>{t.desc}</span>
            </div>
            <span style={{ fontFamily: mono, fontWeight: 600, color: t.type === "credit" ? COLORS.accent : t.usdt ? COLORS.teal : COLORS.text }}>{t.amount}</span>
          </div>
        ))}
      </Panel>

      <Panel title="Invoices" icon="📄">
        {[
          { month: "January 2026", amount: "₦3,092,400", status: "Paid", date: "Feb 1" },
          { month: "December 2025", amount: "₦2,841,000", status: "Paid", date: "Jan 1" },
          { month: "November 2025", amount: "₦1,960,200", status: "Paid", date: "Dec 1" },
        ].map((inv, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 500 }}>{inv.month}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim }}>{inv.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: mono, fontWeight: 600 }}>{inv.amount}</span>
              <Badge>{inv.status}</Badge>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  </div>
);

// API KEYS
const APIKeysPage = () => (
  <div>
    <Panel title="API Keys" icon="🔑" right={<button style={{ background: COLORS.accent, color: "#000", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>+ New Key</button>}>
      {[
        { name: "Production", key: "mz_live_****...a8f2", created: "Jan 12, 2026", lastUsed: "2 min ago", calls: "1.1M", status: "active" },
        { name: "Staging", key: "mz_test_****...c3d1", created: "Jan 15, 2026", lastUsed: "4 hrs ago", calls: "86K", status: "active" },
        { name: "Dev - Personal", key: "mz_dev_****...e7b4", created: "Feb 2, 2026", lastUsed: "Yesterday", calls: "2.4K", status: "active" },
      ].map((k, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr 1fr 0.7fr 0.5fr", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{k.name}</span>
          <span style={{ fontFamily: mono, fontSize: 12, color: COLORS.textDim }}>{k.key}</span>
          <span style={{ color: COLORS.textDim, fontSize: 12 }}>{k.lastUsed}</span>
          <span style={{ fontFamily: mono, color: COLORS.textSec }}>{k.calls}</span>
          <Badge>{k.status}</Badge>
          <span style={{ color: COLORS.textDim, cursor: "pointer", fontSize: 12 }}>•••</span>
        </div>
      ))}
    </Panel>

    <Panel title="Bring Your Own Keys (BYOK)" icon="🔗" style={{ marginTop: 10 }}
      right={<button style={{ background: "transparent", color: COLORS.textSec, border: `1px solid ${COLORS.border}`, padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: font }}>+ Connect Key</button>}>
      {[
        { provider: "OpenAI", key: "sk-****...x9f2", status: "connected", models: "gpt-4o, gpt-4o-mini", color: COLORS.openai },
        { provider: "Anthropic", key: "sk-ant-****...m3a1", status: "connected", models: "sonnet, haiku", color: COLORS.anthropic },
        { provider: "Coinbase", key: "cb-agent-****...7a3f", status: "connected", models: "Agent Wallets × 2", color: COLORS.coinbase },
        { provider: "Stripe", key: "sk_agent_****...1Nqx", status: "connected", models: "Agent Commerce", color: COLORS.stripePurple },
      ].map((k, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `${k.color}20`, color: k.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{k.provider.slice(0, 2).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{k.provider}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: COLORS.textDim }}>{k.key} → {k.models}</div>
            </div>
          </div>
          <Badge>{k.status}</Badge>
        </div>
      ))}
      <div style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 10, color: COLORS.textDim, fontSize: 13 }}>
        <span style={{ fontSize: 18 }}>+</span> Connect Google, Mistral, Meta, or any OpenAI-compatible endpoint, Coinbase wallet, or Stripe agent key
      </div>
    </Panel>
  </div>
);

// ---- NAV CONFIG ----
const navSections = [
  { label: "Overview", items: [
    { id: "dashboard", icon: "◫", name: "Dashboard" },
    { id: "usage", icon: "↗", name: "Usage & Spend" },
    { id: "routing", icon: "⚡", name: "Smart Routing", badge: "Live" },
  ]},
  { label: "AI Assets", items: [
    { id: "agents", icon: "🤖", name: "Agents", badge: "4" },
    { id: "models", icon: "◈", name: "Models", badge: "12" },
    { id: "african", icon: "🌍", name: "African Catalogue", badge: "New", badgeWarn: true },
  ]},
  { label: "Optimise", items: [
    { id: "recommendations", icon: "💡", name: "Recommendations", badge: "5" },
    { id: "keys", icon: "🔑", name: "API Keys & Services" },
  ]},
  { label: "Billing", items: [
    { id: "billing", icon: "₦", name: "Wallets" },
  ]},
];

const pages = {
  dashboard: DashboardPage,
  usage: UsagePage,
  routing: RoutingPage,
  agents: AgentsPage,
  models: ModelsPage,
  african: AfricanPage,
  recommendations: RecommendationsPage,
  keys: APIKeysPage,
  billing: BillingPage,
};

const pageNames = {
  dashboard: "Dashboard", usage: "Usage & Spend", routing: "Smart Routing", agents: "AI Agents",
  models: "Models", african: "African Catalogue", recommendations: "Recommendations", keys: "API Keys & Services", billing: "Wallets"
};

// ---- MAIN APP ----
export default function App() {
  const [page, setPage] = useState("dashboard");
  const PageComponent = pages[page] || DashboardPage;

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: font, fontSize: 13, WebkitFontSmoothing: "antialiased" }}>
      {/* SIDEBAR */}
      <aside style={{ width: 240, height: "100vh", background: COLORS.sidebarBg, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: COLORS.accent, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#000" }}>M</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>mazu<span style={{ color: COLORS.accent }}>.</span></span>
        </div>

        {navSections.map((section, si) => (
          <div key={si}>
            <div style={{ padding: "14px 12px 4px" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: COLORS.textDim, fontWeight: 600, paddingLeft: 8 }}>{section.label}</div>
            </div>
            {section.items.map(item => (
              <div key={item.id} onClick={() => setPage(item.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", margin: "1px 10px", borderRadius: 6,
                  color: page === item.id ? COLORS.accent : COLORS.textSec,
                  background: page === item.id ? COLORS.accentBg : "transparent",
                  cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s"
                }}>
                <span style={{ width: 18, textAlign: "center", fontSize: 14 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.badge && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 100, fontFamily: mono,
                    background: item.badgeWarn ? COLORS.nairaBgStrong : COLORS.accentBgStrong,
                    color: item.badgeWarn ? COLORS.naira : COLORS.accent
                  }}>{item.badge}</span>
                )}
              </div>
            ))}
            {si < navSections.length - 1 && <div style={{ height: 1, background: COLORS.border, margin: "6px 12px" }} />}
          </div>
        ))}

        <div style={{ marginTop: "auto", padding: 14, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>PS</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Paystack</div>
              <div style={{ fontSize: 11, color: COLORS.textDim }}>Growth Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOPBAR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{pageNames[page]}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "4px 10px", borderRadius: 6, fontSize: 12, color: COLORS.textSec, cursor: "pointer" }}>📅 Feb 1 – 24, 2026 ▾</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textSec, padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: font }}>↓ Export</button>
            <button style={{ background: COLORS.accent, border: "none", color: "#000", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>+ Add Key / Service</button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <PageComponent />
        </div>
      </div>
    </div>
  );
}
