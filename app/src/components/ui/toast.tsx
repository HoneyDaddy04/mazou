import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { Check, X, Info } from "lucide-react";
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
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium shadow-lg border animate-in slide-in-from-right duration-200",
              t.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-700",
              t.type === "error" && "bg-red-50 border-red-200 text-red-700",
              t.type === "info" && "bg-accent-light border-[rgba(59,130,246,0.15)] text-blue"
            )}
          >
            {t.type === "success" && <Check size={14} />}
            {t.type === "error" && <X size={14} />}
            {t.type === "info" && <Info size={14} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
