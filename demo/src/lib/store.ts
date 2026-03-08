import { create } from "zustand";
import type { CurrencyCode } from "@/lib/constants";

interface AppState {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),
  dateRange: { from: "2026-02-01", to: "2026-02-28" },
  setDateRange: (range) => set({ dateRange: range }),
  sidebarOpen: true,
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  currency: "NGN",
  setCurrency: (c) => set({ currency: c }),
}));
