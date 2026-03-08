import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { generateApiKey, maskApiKey } from "@/lib/utils";
import { Calendar, Key } from "lucide-react";

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/usage": "Usage & Spend",
  "/routing": "Smart Routing",
  "/agents": "AI Agents",
  "/models": "Active Models",
  "/catalog": "Model Catalog",
  "/african": "Model Catalog",
  "/recommendations": "Recommendations",
  "/keys": "API Keys",
  "/billing": "Wallets & Billing",
  "/settings": "Settings",

  "/docs": "Documentation",
};

// Static labels - no Date() at module level so SSR and client always agree
const DATE_RANGE_LABELS = [
  "Last 7 days",
  "Last 14 days",
  "This Month",
  "Last Month",
  "Last 90 days",
] as const;

function pad2(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function buildDateRanges() {
  const now = new Date();
  const today = fmtDate(now);
  const sub = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return fmtDate(d); };
  const monthStart = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const lme = new Date(now.getFullYear(), now.getMonth(), 0);
  return DATE_RANGE_LABELS.map((label, i) => {
    if (i === 0) return { label, from: sub(7),  to: today };
    if (i === 1) return { label, from: sub(14), to: today };
    if (i === 2) return { label, from: monthStart, to: today };
    if (i === 3) return { label, from: fmtDate(new Date(lme.getFullYear(), lme.getMonth(), 1)), to: fmtDate(lme) };
    return { label, from: sub(90), to: today };
  });
}

function formatRange(from: string, to: string) {
  const f = new Date(from);
  const t = new Date(to);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[f.getMonth()]} ${f.getDate()} \u2013 ${months[t.getMonth()]} ${t.getDate()}, ${t.getFullYear()}`;
}

export function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const title = PAGE_NAMES[pathname] || "Dashboard";

  const [dateOpen, setDateOpen] = useState(false);
  const [dateRanges, setDateRanges] = useState<ReturnType<typeof buildDateRanges>>([]);
  const [dateRange, setDateRange] = useState({ label: "This Month", from: "", to: "" });
  const dateRef = useRef<HTMLDivElement>(null);

  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState<"live" | "test">("live");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // Compute date ranges client-side only - avoids SSR/client mismatch from new Date()
  useEffect(() => {
    const ranges = buildDateRanges();
    setDateRanges(ranges);
    setDateRange(ranges[2]); // "This Month"
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleCreateKey() {
    if (!newKeyName.trim()) return;
    const key = generateApiKey(newKeyEnv === "live" ? "mz_live" : "mz_test");
    setCreatedKey(key);
    toast(`API key "${newKeyName}" created`);
  }

  function handleCopyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      toast("API key copied to clipboard");
    }
  }

  function handleCloseKeyModal() {
    setShowNewKey(false);
    setNewKeyName("");
    setNewKeyEnv("live");
    setCreatedKey(null);
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="text-[15px] font-bold">{title}</div>
          <div ref={dateRef} className="relative">
            <div
              onClick={() => setDateOpen(!dateOpen)}
              className="flex items-center gap-1.5 bg-surface border border-border px-2.5 py-1 rounded-md text-xs text-text-sec cursor-pointer hover:border-border-light transition-colors"
            >
              <Calendar size={13} className="text-text-dim" />
              {dateRange.from ? formatRange(dateRange.from, dateRange.to) : dateRange.label}
              <span className="text-text-dim ml-0.5">&#9662;</span>
            </div>
            {dateOpen && (
              <div className="absolute top-full left-0 mt-1.5 bg-white border border-border rounded-lg shadow-lg z-30 py-1 min-w-[180px] overflow-hidden">
                {dateRanges.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => { setDateRange(r); setDateOpen(false); toast(`Date range: ${r.label}`); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-surface transition-colors cursor-pointer ${
                      dateRange.from === r.from && dateRange.to === r.to ? "text-accent font-semibold" : "text-text-sec"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewKey(true)}
            className="bg-accent text-white px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer font-sans hover:bg-accent-muted transition-colors"
          >
            + Add API Key
          </button>
        </div>
      </div>

      <Modal open={showNewKey} onClose={handleCloseKeyModal} title="Create API Key" icon={<Key size={16} />}>
        {!createdKey ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-dim font-medium mb-1.5">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production, Staging, Dev"
                className="w-full bg-white border border-border rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-dim font-medium mb-1.5">Environment</label>
              <div className="flex gap-2">
                {(["live", "test"] as const).map((env) => (
                  <button
                    key={env}
                    onClick={() => setNewKeyEnv(env)}
                    className={`flex items-center gap-1.5 flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      newKeyEnv === env
                        ? "bg-accent-light border-accent text-accent"
                        : "bg-white border-border text-text-sec hover:border-border-light"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${env === "live" ? "bg-emerald-500" : "bg-amber-400"}`} />
                    {env === "live" ? "Production" : "Test / Staging"}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreateKey}
              disabled={!newKeyName.trim()}
              className="w-full bg-accent text-white py-2 rounded-md text-[13px] font-semibold cursor-pointer hover:bg-accent-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate Key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-accent-light border border-[rgba(59,130,246,0.15)] rounded-md p-3">
              <div className="text-xs text-text-dim mb-2">Your new API key (copy now - it won&apos;t be shown again):</div>
              <div className="font-mono text-sm text-accent break-all bg-white rounded-md px-3 py-2 border border-border">
                {createdKey}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyKey}
                className="flex-1 bg-accent text-white py-2 rounded-md text-[13px] font-semibold cursor-pointer hover:bg-accent-muted transition-colors"
              >
                Copy Key
              </button>
              <button
                onClick={handleCloseKeyModal}
                className="flex-1 bg-surface border border-border text-text-sec py-2 rounded-md text-[13px] cursor-pointer hover:bg-surface-2 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
