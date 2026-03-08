import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { NAV_SECTIONS } from "@/lib/constants";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard, TrendingUp, GitBranch, Bot, Boxes, Globe,
  TrendingDown, Key, Wallet, BookOpen, Compass, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, TrendingUp, GitBranch, Bot, Boxes, Globe,
  TrendingDown, Key, Wallet, BookOpen, Compass,
};

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebarCollapse } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const collapsed = mounted ? sidebarCollapsed : false;

  return (
    <aside
      className={cn(
        "h-screen bg-[#0F172A] border-r border-[#1E293B] flex flex-col shrink-0 overflow-y-auto overflow-x-hidden transition-all duration-200 scrollbar-none",
        collapsed ? "w-[60px]" : "w-60"
      )}
    >
      {/* Logo + Collapse Toggle */}
      <div className={cn(
        "border-b border-[#1E293B]",
        collapsed ? "flex flex-col items-center pt-[18px] pb-2 gap-2" : "px-[14px] pt-[18px] pb-3.5 flex items-center justify-between"
      )}>
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-[#0A1628] border border-[#1E293B] rounded-[7px] flex items-center justify-center font-extrabold text-sm text-white shrink-0">
            m
          </div>
          {!collapsed && (
            <span className="font-extrabold text-lg tracking-tight whitespace-nowrap text-white">
              mazou<span className="text-[#00E5A0]">.</span>
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebarCollapse}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#1E293B] text-[#64748B] hover:text-[#94A3B8] transition-colors cursor-pointer shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      {NAV_SECTIONS.map((section, si) => (
        <div key={si}>
          {!collapsed && (
            <div className="px-3 pt-3.5 pb-1">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[#475569] font-semibold pl-2">
                {section.label}
              </div>
            </div>
          )}
          {collapsed && si === 0 && <div className="pt-2" />}
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                to={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-2.5 py-[7px] mx-2 my-px rounded-md text-[13px] font-medium transition-all duration-150",
                  collapsed ? "px-0 justify-center" : "px-2.5",
                  isActive
                    ? "text-white bg-[#1E293B] shadow-sm"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60 hover:translate-x-0.5"
                )}
              >
                <span className={cn("flex items-center justify-center shrink-0", collapsed ? "w-full" : "w-[18px]")}>
                  {(() => { const Icon = ICON_MAP[item.icon]; return Icon ? <Icon size={16} /> : item.icon; })()}
                </span>
                {!collapsed && <span className="flex-1 whitespace-nowrap">{item.name}</span>}
                {!collapsed && item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-px rounded-full font-mono",
                      "badgeWarn" in item && item.badgeWarn
                        ? "bg-amber-900/30 text-amber-400"
                        : "bg-[#3B82F6]/15 text-[#60A5FA]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          {si < NAV_SECTIONS.length - 1 && (
            <div className="h-px bg-[#1E293B] mx-3 my-1.5" />
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="mt-auto border-t border-[#1E293B]">
        <div className={cn("flex items-center gap-2.5 p-3.5", collapsed ? "justify-center" : "")}>
          <div className="w-7 h-7 rounded-md bg-[#00E5A0] flex items-center justify-center text-[11px] font-bold text-[#0A1628] shrink-0">
            MO
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white">Vaigence Org</div>
            </div>
          )}
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/login");
          }}
          title="Sign out"
          className={cn(
            "flex items-center gap-2.5 w-full py-2 text-[13px] font-medium text-[#64748B] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer",
            collapsed ? "justify-center px-0" : "px-[22px]"
          )}
        >
          <LogOut size={15} />
          {!collapsed && <span>Sign out</span>}
        </button>
        <div className="h-2" />
      </div>
    </aside>
  );
}
