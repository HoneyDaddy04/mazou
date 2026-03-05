"use client";

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "px-4 py-2.5 rounded-lg text-xs font-medium shadow-lg border animate-in slide-in-from-right duration-200",
              t.type === "success" && "bg-[rgba(0,210,106,0.12)] border-[rgba(0,210,106,0.25)] text-accent",
              t.type === "error" && "bg-[rgba(255,77,77,0.12)] border-[rgba(255,77,77,0.25)] text-red",
              t.type === "info" && "bg-[rgba(77,138,255,0.12)] border-[rgba(77,138,255,0.25)] text-blue"
            )}
          >
            {t.type === "success" && "✓ "}
            {t.type === "error" && "✕ "}
            {t.type === "info" && "ℹ "}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
