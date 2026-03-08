"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/constants";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard, TrendingUp, GitBranch, Bot, Boxes, Globe,
  Lightbulb, Key, Wallet, BookOpen, LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, TrendingUp, GitBranch, Bot, Boxes, Globe,
  Lightbulb, Key, Wallet, BookOpen,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebarCollapse } = useAppStore();

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-border flex flex-col shrink-0 overflow-y-auto overflow-x-hidden transition-all duration-200 scrollbar-none",
        sidebarCollapsed ? "w-[60px]" : "w-60"
      )}
    >
      {/* Logo + Collapse Toggle */}
      <div className="px-[14px] pt-[18px] pb-3.5 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-accent rounded-[7px] flex items-center justify-center font-extrabold text-sm text-black shrink-0">
            m
          </div>
          {!sidebarCollapsed && (
            <span className="font-extrabold text-lg tracking-tight whitespace-nowrap">
              mazou<span className="text-accent">.</span>
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebarCollapse}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface text-text-dim hover:text-text transition-colors cursor-pointer shrink-0"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav */}
      {NAV_SECTIONS.map((section, si) => (
        <div key={si}>
          {!sidebarCollapsed && (
            <div className="px-3 pt-3.5 pb-1">
              <div className="text-[10px] uppercase tracking-[0.12em] text-text-dim font-semibold pl-2">
                {section.label}
              </div>
            </div>
          )}
          {sidebarCollapsed && si === 0 && <div className="pt-2" />}
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                title={sidebarCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-2.5 py-[7px] mx-2 my-px rounded-md text-[13px] font-medium transition-all",
                  sidebarCollapsed ? "px-0 justify-center" : "px-2.5",
                  isActive
                    ? "text-accent bg-[rgba(0,210,106,0.08)]"
                    : "text-text-sec hover:text-text hover:bg-surface"
                )}
              >
                <span className={cn("flex items-center justify-center shrink-0", sidebarCollapsed ? "w-full" : "w-[18px]")}>
                  {(() => { const Icon = ICON_MAP[item.icon]; return Icon ? <Icon size={16} /> : item.icon; })()}
                </span>
                {!sidebarCollapsed && <span className="flex-1 whitespace-nowrap">{item.name}</span>}
                {!sidebarCollapsed && item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-px rounded-full font-mono",
                      "badgeWarn" in item && item.badgeWarn
                        ? "bg-[rgba(255,184,0,0.15)] text-naira"
                        : "bg-[rgba(0,210,106,0.15)] text-accent"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          {si < NAV_SECTIONS.length - 1 && (
            <div className="h-px bg-border mx-3 my-1.5" />
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="mt-auto border-t border-border">
        <div className={cn("flex items-center gap-2.5 p-3.5", sidebarCollapsed ? "justify-center" : "")}>
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue to-purple flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            MO
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold">Vaigence Org</div>
            </div>
          )}
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          title="Sign out"
          className={cn(
            "flex items-center gap-2.5 w-full py-2 text-[13px] font-medium text-text-sec hover:text-red hover:bg-[rgba(255,77,77,0.06)] transition-colors cursor-pointer",
            sidebarCollapsed ? "justify-center px-0" : "px-[22px]"
          )}
        >
          <LogOut size={15} />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
        <div className="h-2" />
      </div>
    </aside>
  );
}
