import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWallet, useWalletTransactions, useInvoices, useBundles, useBundlePackages, usePurchaseBundle } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageError } from "@/components/ui/page-error";
import { ClipboardList, FileText, Settings, Loader2, Check, Download, Package } from "lucide-react";

const FUND_METHODS = [
  { label: "Card / Bank Transfer", fields: [{ label: "Amount (NGN)", placeholder: "e.g. 1,000,000", type: "text" }] },
  { label: "Direct Bank Transfer", fields: [{ label: "Amount (NGN)", placeholder: "e.g. 1,000,000", type: "text" }] },
];

export default function BillingPage() {
  const { toast } = useToast();
  const { data: wallet, isLoading: walletLoading, error: walletError, refetch: refetchWallet } = useWallet();
  const { data: walletTransactions, isLoading: txLoading } = useWalletTransactions(20, 0);
  const { data: invoiceData, isLoading: invLoading } = useInvoices();
  const { data: bundles, isLoading: bundlesLoading } = useBundles();
  const { data: bundlePackages } = useBundlePackages();
  const purchaseBundle = usePurchaseBundle();

  const [showBundleShop, setShowBundleShop] = useState(false);
  const [showFund, setShowFund] = useState(false);
  const [showAutoFund, setShowAutoFund] = useState(false);
  const [fundMethod, setFundMethod] = useState(0);
  const [fundAmount, setFundAmount] = useState("");
  const [fundStep, setFundStep] = useState<"amount" | "confirm" | "processing" | "done">("amount");
  const [autoFundEnabled, setAutoFundEnabled] = useState(true);
  const [autoFundThreshold, setAutoFundThreshold] = useState("500000");
  const [autoFundAmount, setAutoFundAmount] = useState("2000000");

  const isLoading = walletLoading || txLoading || invLoading || bundlesLoading;

  if (isLoading) return <PageSkeleton />;
  if (walletError) return <PageError message="Failed to load billing data" onRetry={() => refetchWallet()} />;

  const balanceNaira = wallet?.balance_naira ?? 0;
  const balanceKobo = wallet?.balance_kobo ?? 0;
  const currency = wallet?.currency ?? "NGN";
  const transactions = walletTransactions || [];
  const invoices = invoiceData || [];

  function fmtNaira(amount: number): string {
    return "NGN " + amount.toLocaleString("en-NG");
  }

  function handleFund() {
    if (!fundAmount) return;
    setFundStep("confirm");
  }

  function handleConfirmFund() {
    setFundStep("processing");
    setTimeout(() => {
      setFundStep("done");
      toast(`Naira Wallet funded with NGN ${fundAmount}`);
    }, 2000);
  }

  function handleCloseFund() {
    setShowFund(false);
    setFundStep("amount");
    setFundAmount("");
    setFundMethod(0);
  }

  function handleSaveAutoFund() {
    toast("Auto-fund settings saved for Naira Wallet");
    setShowAutoFund(false);
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-5 animate-in-stagger">
        <StatCard label="Balance" value={fmtNaira(balanceNaira)} change="Naira Wallet" color="#00E5A0" />
        <StatCard label="Currency" value={currency} change="primary wallet" color="#00E5A0" />
        <StatCard label="Transactions" value={`${transactions.length}`} change="recent" color="#00E5A0" />
        {(() => {
          const activeBundle = (bundles ?? []).find((b: any) => b.status === "active" && b.remaining_tokens > 0);
          return activeBundle
            ? <StatCard label="Bundle" value={`${(activeBundle.remaining_tokens / 1_000_000).toFixed(1)}M tokens`} change={activeBundle.name} color="#A855F7" />
            : <StatCard label="Invoices" value={`${invoices.length}`} change="total" />;
        })()}
      </div>

      {/* Wallet Card */}
      <div className="bg-surface border border-border rounded-[10px] p-4 mb-2.5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: "rgba(0,229,160,0.12)", color: "#00E5A0" }}>
              VG
            </span>
            <div>
              <span className="text-sm font-semibold">Naira Wallet</span>
              <span className="text-[11px] text-text-dim ml-2">via Vaigence</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-dim">
            <Badge color="#00E5A0" bg="rgba(0,229,160,0.08)">Primary</Badge>
          </div>
        </div>
        <div className="font-mono text-[28px] font-bold mb-1" style={{ color: "#00E5A0" }}>{fmtNaira(balanceNaira)}</div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowFund(true)}
            className="bg-accent text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-accent-muted transition-all"
          >
            Fund NGN
          </button>
          <button
            onClick={() => setShowAutoFund(true)}
            className="bg-transparent text-text-sec border border-border px-4 py-2 rounded-md text-xs cursor-pointer hover:bg-surface-2 transition-colors"
          >
            Auto-fund Settings
          </button>
        </div>
      </div>

      {/* Token Bundles */}
      <Panel title="Token Bundles" icon={<Package size={15} />} className="mb-2.5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-text-dim">Fixed-rate token packages — predictable NGN pricing, no exchange rate surprises.</p>
          <button
            onClick={() => setShowBundleShop(true)}
            className="bg-accent text-white border-none px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer hover:bg-accent-muted transition-all"
          >
            Buy Bundle
          </button>
        </div>
        {(bundles ?? []).length === 0 ? (
          <div className="text-sm text-text-dim py-4 text-center">No active bundles. Purchase one to get fixed-rate token pricing.</div>
        ) : (
          <div className="space-y-2">
            {(bundles ?? []).map((b: any) => {
              const usedPct = Math.round(((b.total_tokens - b.remaining_tokens) / b.total_tokens) * 100);
              const isActive = b.status === "active" && b.remaining_tokens > 0;
              return (
                <div key={b.id} className="bg-bg border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{b.name}</span>
                      <Badge color={isActive ? "#00E5A0" : "#66667A"} bg={isActive ? "rgba(0,229,160,0.08)" : "rgba(102,102,122,0.08)"}>
                        {isActive ? "Active" : b.remaining_tokens === 0 ? "Exhausted" : "Expired"}
                      </Badge>
                    </div>
                    <span className="font-mono text-xs text-text-dim">
                      NGN {b.rate_per_million_naira?.toLocaleString()}/1M tokens
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${usedPct}%`,
                          background: usedPct > 90 ? "#EF4444" : usedPct > 60 ? "#EAB308" : "#00E5A0",
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-text-sec whitespace-nowrap">
                      {(b.remaining_tokens / 1_000_000).toFixed(1)}M / {(b.total_tokens / 1_000_000).toFixed(0)}M
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-2.5">
        <Panel title="Recent Transactions" icon={<ClipboardList size={15} />}>
          {transactions.length === 0 && (
            <div className="text-sm text-text-dim py-4 text-center">No transactions yet</div>
          )}
          {transactions.map((t: any) => {
            const isCredit = t.type === "credit";
            const date = t.created_at ? new Date(t.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }) : "—";
            return (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border text-[13px]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-text-dim w-12">{date}</span>
                  <span>{t.description}</span>
                  <Badge color="#66667A" bg="rgba(102,102,122,0.08)">NGN</Badge>
                </div>
                <span className={`font-mono font-semibold ${isCredit ? "text-accent" : "text-text"}`}>
                  {isCredit ? "+" : "-"}{t.amount_naira != null ? `NGN ${t.amount_naira.toLocaleString("en-NG")}` : formatNaira(t.amount_kobo)}
                </span>
              </div>
            );
          })}
        </Panel>

        <Panel title="Invoices" icon={<FileText size={15} />}>
          {invoices.length === 0 && (
            <div className="text-sm text-text-dim py-4 text-center">No invoices yet</div>
          )}
          {invoices.map((inv: any) => {
            const periodStart = inv.period_start ? new Date(inv.period_start) : null;
            const periodEnd = inv.period_end ? new Date(inv.period_end) : null;
            const monthLabel = periodStart
              ? periodStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : "—";
            const dateLabel = periodEnd
              ? periodEnd.toLocaleDateString("en-GB", { month: "short", day: "numeric" })
              : "";
            return (
              <div key={inv.id} className="flex items-center justify-between py-3 border-b border-border text-[13px]">
                <div>
                  <div className="font-medium">{monthLabel}</div>
                  <div className="text-[11px] text-text-dim">{dateLabel}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold">{inv.total_cost_naira != null ? `NGN ${inv.total_cost_naira.toLocaleString("en-NG")}` : formatNaira(inv.total_cost_kobo)}</span>
                  <Badge>{inv.status}</Badge>
                  <button
                    onClick={() => toast(`Downloading invoice for ${monthLabel}`)}
                    className="text-accent text-[11px] font-medium cursor-pointer bg-transparent border-none hover:underline"
                  >
                    <Download size={12} className="inline" /> PDF
                  </button>
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      {/* Fund Wallet Modal */}
      <Modal open={showFund} onClose={handleCloseFund} title="Fund Naira Wallet" icon="VG">
        {fundStep === "amount" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-dim font-medium mb-2">Payment Method</label>
              <div className="flex flex-col gap-1.5">
                {FUND_METHODS.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setFundMethod(i)}
                    className={`text-left px-3 py-2.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                      fundMethod === i
                        ? "border-accent bg-accent-light text-accent font-semibold"
                        : "border-border bg-bg text-text-sec hover:border-border-light"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {FUND_METHODS[fundMethod]?.fields.map((f, fi) => (
              <div key={fi}>
                <label className="block text-xs text-text-dim font-medium mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors font-mono"
                />
              </div>
            ))}
            <button
              onClick={handleFund}
              disabled={!fundAmount}
              className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}
        {fundStep === "confirm" && (
          <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="text-xs text-text-dim mb-1">You are adding to your Naira Wallet:</div>
              <div className="font-mono text-2xl font-bold" style={{ color: "#00E5A0" }}>
                NGN {fundAmount}
              </div>
              <div className="text-xs text-text-dim mt-2">via {FUND_METHODS[fundMethod]?.label}</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-naira">
              Please confirm this transaction. Funds will be available immediately after payment is processed.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmFund}
                className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all"
              >
                Confirm &amp; Pay
              </button>
              <button
                onClick={() => setFundStep("amount")}
                className="flex-1 bg-surface border border-border text-text-sec py-2.5 rounded-lg text-sm cursor-pointer hover:bg-surface-2 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
        {fundStep === "processing" && (
          <div className="py-8 text-center">
            <Loader2 size={32} className="animate-spin text-accent mx-auto mb-3" />
            <div className="text-sm font-semibold mb-1">Processing Payment...</div>
            <div className="text-xs text-text-dim">Connecting to Vaigence. Please wait.</div>
          </div>
        )}
        {fundStep === "done" && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto"><Check size={28} className="text-emerald-600" /></div>
            <div>
              <div className="text-sm font-semibold">Payment Successful!</div>
              <div className="text-xs text-text-dim mt-1">NGN {fundAmount} has been added to your Naira Wallet.</div>
            </div>
            <button
              onClick={handleCloseFund}
              className="bg-accent text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* Buy Bundle Modal */}
      <Modal open={showBundleShop} onClose={() => setShowBundleShop(false)} title="Buy Token Bundle" icon={<Package size={16} />}>
        <div className="space-y-3">
          <p className="text-xs text-text-dim">Lock in a fixed NGN rate for tokens. Bundles are used before your wallet balance.</p>
          {(bundlePackages ?? []).map((pkg: any) => (
            <div key={pkg.id} className="bg-bg border border-border rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{pkg.name}</div>
                <div className="text-[11px] text-text-dim">
                  {(pkg.tokens / 1_000_000).toFixed(0)}M tokens at NGN {pkg.rate_per_million_naira?.toLocaleString()}/1M
                </div>
              </div>
              <button
                onClick={() => {
                  purchaseBundle.mutate(pkg.id, {
                    onSuccess: () => {
                      toast(`Purchased ${pkg.name} bundle!`);
                      setShowBundleShop(false);
                    },
                    onError: (err: any) => {
                      toast(err.message || "Purchase failed");
                    },
                  });
                }}
                disabled={purchaseBundle.isPending}
                className="bg-accent text-white px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer hover:bg-accent-muted transition-all disabled:opacity-40"
              >
                {purchaseBundle.isPending ? "..." : `NGN ${pkg.price_naira?.toLocaleString()}`}
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Auto-fund Settings Modal */}
      <Modal open={showAutoFund} onClose={() => setShowAutoFund(false)} title="Auto-fund - Naira Wallet" icon={<Settings size={16} />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-bg rounded-lg border border-border">
            <div>
              <div className="text-sm font-medium">Auto-fund</div>
              <div className="text-xs text-text-dim">Automatically top up when balance is low</div>
            </div>
            <button
              onClick={() => setAutoFundEnabled(!autoFundEnabled)}
              className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
                autoFundEnabled ? "bg-accent" : "bg-border"
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                autoFundEnabled ? "left-[22px]" : "left-0.5"
              }`} />
            </button>
          </div>
          {autoFundEnabled && (
            <>
              <div>
                <label className="block text-xs text-text-dim font-medium mb-1.5">When balance falls below (NGN)</label>
                <input
                  type="text"
                  value={autoFundThreshold}
                  onChange={(e) => setAutoFundThreshold(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim font-medium mb-1.5">Auto-fund amount (NGN)</label>
                <input
                  type="text"
                  value={autoFundAmount}
                  onChange={(e) => setAutoFundAmount(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors font-mono"
                />
              </div>
              <div className="bg-accent-light border border-[rgba(59,130,246,0.15)] rounded-lg p-3 text-xs text-accent">
                When Naira Wallet balance drops below NGN {Number(autoFundThreshold).toLocaleString()}, we will automatically add NGN {Number(autoFundAmount).toLocaleString()} via Vaigence.
              </div>
            </>
          )}
          <button
            onClick={handleSaveAutoFund}
            className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all"
          >
            Save Settings
          </button>
        </div>
      </Modal>
    </div>
  );
}
