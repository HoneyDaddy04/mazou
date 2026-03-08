import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCIES, type CurrencyCode } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(kobo: number): string {
  const n = kobo / 100;
  if (n >= 1_000_000) return `\u20A6${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `\u20A6${(n / 1_000).toFixed(0)}K`;
  if (n >= 1) return `\u20A6${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  return `\u20A6${n.toFixed(2)}`;
}

export function formatCurrency(usd: number, currency: CurrencyCode = "USDT"): string {
  const c = CURRENCIES[currency];
  const value = usd * c.rate;
  if (value >= 1_000_000) return `${c.symbol}${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${c.symbol}${(value / 1_000).toFixed(1)}K`;
  if (value < 0.01) return `${c.symbol}${value.toFixed(4)}`;
  return `${c.symbol}${value.toFixed(2)}`;
}

export function formatTokenCost(usd: number, currency: CurrencyCode = "USDT"): string {
  const c = CURRENCIES[currency];
  const value = usd * c.rate;
  if (value >= 1000) return `${c.symbol}${(value / 1000).toFixed(1)}K`;
  if (value >= 100) return `${c.symbol}${value.toFixed(0)}`;
  if (value >= 1) return `${c.symbol}${value.toFixed(2)}`;
  return `${c.symbol}${value.toFixed(4)}`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function generateApiKey(prefix: string = "mz_live"): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = `${prefix}_`;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function maskApiKey(key: string): string {
  if (key.length < 12) return key;
  return `${key.slice(0, 8)}****...${key.slice(-4)}`;
}
