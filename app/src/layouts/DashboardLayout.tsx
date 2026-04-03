import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { IS_DEMO_MODE, demoAuth } from "@/lib/demo-auth";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    if (IS_DEMO_MODE) {
      setAuthState(demoAuth.isLoggedIn ? "authenticated" : "unauthenticated");
      const unsub = demoAuth.onAuthChange((loggedIn) => {
        setAuthState(loggedIn ? "authenticated" : "unauthenticated");
      });
      return unsub;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session ? "authenticated" : "unauthenticated");
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? "authenticated" : "unauthenticated");
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authState === "unauthenticated") {
      navigate("/login", { replace: true });
    }
  }, [authState, navigate]);

  if (authState === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return null;
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-bg text-text font-sans text-[13px]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-y-auto p-6" data-scroll-container>
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
