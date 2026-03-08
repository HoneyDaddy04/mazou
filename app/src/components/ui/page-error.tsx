import { AlertTriangle, RefreshCw } from "lucide-react";

interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function PageError({ message = "Failed to load data", onRetry }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle size={32} className="text-text-dim mb-3" />
      <div className="text-sm font-medium text-text mb-1">{message}</div>
      <div className="text-xs text-text-dim mb-4">Please check your connection and try again.</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-surface border border-border rounded-md text-xs font-medium text-text hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
