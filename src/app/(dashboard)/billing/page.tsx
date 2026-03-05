"use client";

import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface Wallet {
  id: string;
  currency: string;
  symbol: string;
  name: string;
  balance: number;
  color: string;
  provider: string;
  providerIcon: string;
  autoFund: boolean;
  autoFundThreshold: number;
  spendThisMonth: number;
  burnRate: number;
  daysLeft: string;
  primary: boolean;
}

function fmtNaira(amount: number): string {
  return "NGN " + amount.toLocaleString("en-NG");
}

function fmtUsdt(amount: number): string {
  return "USDT " + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtWallet(wallet: Wallet, amount: number): string {
  if (wallet.currency === "NGN") return fmtNaira(amount);
  return fmtUsdt(amount);
}

const WALLETS: Wallet[] = [
  {
    id: "ngn", currency: "NGN", symbol: "NGN ", name: "Naira Wallet", balance: 4280000,
    color: "#FFB800", provider: "Vaigence", providerIcon: "VG", autoFund: true, autoFundThreshold: 500000,
    spendThisMonth: 2850000, burnRate: 118000, daysLeft: "~36 days", primary: true,
  },
  {
    id: "usdt", currency: "USDT", symbol: "USDT ", name: "USDT Wallet", balance: 5200,
    color: "#26A17B", provider: "Manual", providerIcon: "UT", autoFund: false, autoFundThreshold: 500,
    spendThisMonth: 890, burnRate: 32, daysLeft: "~162 days", primary: false,
  },
];

const FUND_METHODS: Record<string, { label: string; fields: { label: string; placeholder: string; type: string }[] }[]> = {
  ngn: [
    { label: "Card / Bank Transfer", fields: [{ label: "Amount (NGN)", placeholder: "e.g. 1,000,000", type: "text" }] },
    { label: "Direct Bank Transfer", fields: [{ label: "Amount (NGN)", placeholder: "e.g. 1,000,000", type: "text" }] },
  ],
  usdt: [
    { label: "Crypto Transfer", fields: [{ label: "Amount (USDT)", placeholder: "e.g. 2,000", type: "text" }] },
    { label: "P2P Purchase", fields: [{ label: "Amount (USDT)", placeholder: "e.g. 2,000", type: "text" }] },
  ],
};

const transactions = [
  { date: "Feb 21", desc: "Naira wallet funded", amount: "NGN 5,000,000", type: "credit" as const, wallet: "NGN" },
  { date: "Feb 20", desc: "Daily AI usage", amount: "NGN 124,800", type: "debit" as const, wallet: "NGN" },
  { date: "Feb 19", desc: "Daily AI usage", amount: "NGN 118,200", type: "debit" as const, wallet: "NGN" },
  { date: "Feb 18", desc: "USDT deposit", amount: "USDT 1,500.00", type: "credit" as const, wallet: "USDT" },
  { date: "Feb 18", desc: "Daily AI usage", amount: "NGN 131,400", type: "debit" as const, wallet: "NGN" },
  { date: "Feb 17", desc: "Daily AI usage", amount: "USDT 42.30", type: "debit" as const, wallet: "USDT" },
  { date: "Feb 14", desc: "Naira wallet funded", amount: "NGN 3,000,000", type: "credit" as const, wallet: "NGN" },
  { date: "Feb 12", desc: "Daily AI usage", amount: "NGN 98,600", type: "debit" as const, wallet: "NGN" },
];

const invoices = [
  { month: "January 2026", amount: "NGN 3,090,000", status: "Paid", date: "Feb 1" },
  { month: "December 2025", amount: "NGN 2,840,000", status: "Paid", date: "Jan 1" },
  { month: "November 2025", amount: "NGN 1,960,000", status: "Paid", date: "Dec 1" },
];

export default function BillingPage() {
  const { toast } = useToast();
  const [selectedWallet, setSelectedWallet] = useState<string>("ngn");
  const [showFund, setShowFund] = useState(false);
  const [showAutoFund, setShowAutoFund] = useState(false);
  const [fundMethod, setFundMethod] = useState(0);
  const [fundAmount, setFundAmount] = useState("");
  const [fundStep, setFundStep] = useState<"amount" | "confirm" | "processing" | "done">("amount");
  const [autoFundEnabled, setAutoFundEnabled] = useState(true);
  const [autoFundThreshold, setAutoFundThreshold] = useState("500000");
  const [autoFundAmount, setAutoFundAmount] = useState("2000000");

  const wallet = WALLETS.find((w) => w.id === selectedWallet) || WALLETS[0];
  const methods = FUND_METHODS[wallet.id] || FUND_METHODS.ngn;
  const primaryWallet = WALLETS.find((w) => w.primary) || WALLETS[0];

  function handleFund() {
    if (!fundAmount) return;
    setFundStep("confirm");
  }

  function handleConfirmFund() {
    setFundStep("processing");
    setTimeout(() => {
      setFundStep("done");
      toast(`${wallet.name} funded with ${wallet.symbol}${fundAmount}`);
    }, 2000);
  }

  function handleCloseFund() {
    setShowFund(false);
    setFundStep("amount");
    setFundAmount("");
    setFundMethod(0);
  }

  function handleSaveAutoFund() {
    toast(`Auto-fund settings saved for ${wallet.name}`);
    setShowAutoFund(false);
  }

  return (
    <div>
      {/* Stats — all in Naira */}
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Primary Balance" value={fmtNaira(primaryWallet.balance)} change="Naira Wallet" color="#00D26A" />
        <StatCard label="Feb Spend" value={fmtNaira(primaryWallet.spendThisMonth)} change="this month" color="#FFB800" />
        <StatCard label="Daily Burn Rate" value={fmtNaira(primaryWallet.burnRate)} change={primaryWallet.daysLeft + " runway"} color="#FFB800" />
        <StatCard label="Active Wallets" value={`${WALLETS.length}`} change={WALLETS.map((w) => w.currency).join(" + ")} />
      </div>

      {/* Wallet Selector Tabs */}
      <div className="flex gap-2 mb-2.5">
        {WALLETS.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWallet(w.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
              selectedWallet === w.id
                ? "border-accent bg-[rgba(0,210,106,0.06)] text-accent"
                : "border-border bg-surface text-text-sec hover:border-border-light"
            }`}
          >
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: `${w.color}20`, color: w.color }}>
              {w.providerIcon}
            </span>
            <span>{w.currency}</span>
            {w.primary && <Badge color="#00D26A" bg="rgba(0,210,106,0.08)">Primary</Badge>}
            <span className="font-mono text-[11px]">{fmtWallet(w, w.balance)}</span>
          </button>
        ))}
      </div>

      {/* Selected Wallet Card */}
      <div className="bg-surface border border-border rounded-[10px] p-4 mb-2.5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${wallet.color}20`, color: wallet.color }}>
              {wallet.providerIcon}
            </span>
            <div>
              <span className="text-sm font-semibold">{wallet.name}</span>
              <span className="text-[11px] text-text-dim ml-2">via {wallet.provider}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-dim">
            {wallet.autoFund && <Badge color="#00D26A" bg="rgba(0,210,106,0.08)">Auto-fund ON</Badge>}
            {wallet.primary && <Badge color="#FFB800" bg="rgba(255,184,0,0.08)">Primary</Badge>}
          </div>
        </div>
        <div className="font-mono text-[28px] font-bold mb-1" style={{ color: wallet.color }}>{fmtWallet(wallet, wallet.balance)}</div>

        <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-border mb-4 mt-3">
          <div>
            <div className="text-[10px] text-text-dim uppercase tracking-wide">Spend This Month</div>
            <div className="font-mono text-sm font-semibold mt-0.5">{fmtWallet(wallet, wallet.spendThisMonth)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-dim uppercase tracking-wide">Daily Burn Rate</div>
            <div className="font-mono text-sm font-semibold mt-0.5">{fmtWallet(wallet, wallet.burnRate)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-dim uppercase tracking-wide">Runway</div>
            <div className="font-mono text-sm font-semibold mt-0.5 text-accent">{wallet.daysLeft}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFund(true)}
            className="bg-accent text-black border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:brightness-110 transition-all"
          >
            Fund {wallet.currency}
          </button>
          <button
            onClick={() => setShowAutoFund(true)}
            className="bg-transparent text-text-sec border border-border px-4 py-2 rounded-md text-xs cursor-pointer hover:bg-surface-2 transition-colors"
          >
            Auto-fund Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Panel title="Recent Transactions" icon="&#x1F4CB;">
          {transactions.map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-border text-[13px]">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-text-dim w-12">{t.date}</span>
                <span>{t.desc}</span>
                <Badge color="#66667A" bg="rgba(102,102,122,0.08)">{t.wallet}</Badge>
              </div>
              <span className={`font-mono font-semibold ${t.type === "credit" ? "text-accent" : "text-text"}`}>
                {t.type === "credit" ? "+" : "-"}{t.amount}
              </span>
            </div>
          ))}
        </Panel>

        <Panel title="Invoices" icon="&#x1F4C4;">
          {invoices.map((inv, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border text-[13px]">
              <div>
                <div className="font-medium">{inv.month}</div>
                <div className="text-[11px] text-text-dim">{inv.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold">{inv.amount}</span>
                <Badge>{inv.status}</Badge>
                <button
                  onClick={() => toast(`Downloading invoice for ${inv.month}`)}
                  className="text-accent text-[11px] font-medium cursor-pointer bg-transparent border-none hover:underline"
                >
                  &#x2193; PDF
                </button>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Fund Wallet Modal */}
      <Modal open={showFund} onClose={handleCloseFund} title={`Fund ${wallet.name}`} icon={wallet.providerIcon}>
        {fundStep === "amount" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-dim font-medium mb-2">Payment Method</label>
              <div className="flex flex-col gap-1.5">
                {methods.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setFundMethod(i)}
                    className={`text-left px-3 py-2.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                      fundMethod === i
                        ? "border-accent bg-[rgba(0,210,106,0.06)] text-accent font-semibold"
                        : "border-border bg-bg text-text-sec hover:border-border-light"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {methods[fundMethod]?.fields.map((f, fi) => (
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
              className="w-full bg-accent text-black py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}
        {fundStep === "confirm" && (
          <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="text-xs text-text-dim mb-1">You are adding to your {wallet.name}:</div>
              <div className="font-mono text-2xl font-bold" style={{ color: wallet.color }}>
                {wallet.symbol}{fundAmount}
              </div>
              <div className="text-xs text-text-dim mt-2">via {methods[fundMethod]?.label}</div>
            </div>
            <div className="bg-[rgba(255,184,0,0.06)] border border-[rgba(255,184,0,0.15)] rounded-lg p-3 text-xs text-naira">
              Please confirm this transaction. Funds will be available immediately after payment is processed.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmFund}
                className="flex-1 bg-accent text-black py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all"
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
            <div className="text-3xl mb-3 animate-spin inline-block">&#x23F3;</div>
            <div className="text-sm font-semibold mb-1">Processing Payment...</div>
            <div className="text-xs text-text-dim">Connecting to {wallet.provider}. Please wait.</div>
          </div>
        )}
        {fundStep === "done" && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[rgba(0,210,106,0.1)] flex items-center justify-center text-2xl mx-auto">&#x2713;</div>
            <div>
              <div className="text-sm font-semibold">Payment Successful!</div>
              <div className="text-xs text-text-dim mt-1">{wallet.symbol}{fundAmount} has been added to your {wallet.name}.</div>
            </div>
            <button
              onClick={handleCloseFund}
              className="bg-accent text-black px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* Auto-fund Settings Modal */}
      <Modal open={showAutoFund} onClose={() => setShowAutoFund(false)} title={`Auto-fund \u2014 ${wallet.name}`} icon="&#x2699;">
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
                <label className="block text-xs text-text-dim font-medium mb-1.5">When balance falls below ({wallet.currency})</label>
                <input
                  type="text"
                  value={autoFundThreshold}
                  onChange={(e) => setAutoFundThreshold(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim font-medium mb-1.5">Auto-fund amount ({wallet.currency})</label>
                <input
                  type="text"
                  value={autoFundAmount}
                  onChange={(e) => setAutoFundAmount(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors font-mono"
                />
              </div>
              <div className="bg-[rgba(0,210,106,0.06)] border border-[rgba(0,210,106,0.15)] rounded-lg p-3 text-xs text-accent">
                When {wallet.name} balance drops below {wallet.symbol}{Number(autoFundThreshold).toLocaleString()}, we will automatically add {wallet.symbol}{Number(autoFundAmount).toLocaleString()} via {wallet.provider}.
              </div>
            </>
          )}
          <button
            onClick={handleSaveAutoFund}
            className="w-full bg-accent text-black py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all"
          >
            Save Settings
          </button>
        </div>
      </Modal>
    </div>
  );
}
