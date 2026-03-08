import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PanelProps {
  title: ReactNode;
  icon?: ReactNode;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, icon, tabs, activeTab, onTabChange, right, children, className }: PanelProps) {
  return (
    <div className={cn("bg-surface border border-border rounded-lg overflow-hidden hover-lift animate-in", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          {icon && <span className="text-text-dim">{icon}</span>}
          {title}
        </div>
        {tabs && (
          <div className="flex bg-surface rounded-md p-0.5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => onTabChange?.(t)}
                className={cn(
                  "relative text-[11px] px-2.5 py-1 rounded font-medium transition-colors cursor-pointer",
                  activeTab === t
                    ? "text-text bg-white shadow-sm"
                    : "text-text-dim hover:text-text-sec"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
