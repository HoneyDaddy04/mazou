"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PanelProps {
  title: ReactNode;
  icon?: string;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, icon, tabs, activeTab, onTabChange, right, children, className }: PanelProps) {
  return (
    <div className={cn("bg-surface border border-border rounded-[10px] overflow-hidden", className)}>
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          {icon && <span className="text-text-dim">{icon}</span>}
          {title}
        </div>
        {tabs && (
          <div className="flex bg-bg rounded-md p-0.5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => onTabChange?.(t)}
                className={cn(
                  "relative text-[11px] px-2.5 py-1 rounded font-medium transition-colors cursor-pointer",
                  activeTab === t
                    ? "text-text bg-surface-2"
                    : "text-text-dim hover:text-text-sec"
                )}
              >
                {t}
                {activeTab === t && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-3/5 rounded-full bg-accent"
                    style={{ opacity: 0.7 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
