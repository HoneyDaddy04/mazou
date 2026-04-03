import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { IS_DEMO_MODE, demoAuth } from "@/lib/demo-auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (IS_DEMO_MODE) {
      demoAuth.login();
      navigate("/dashboard");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  }

  async function fillDemo() {
    setLoading(true);
    setError("");

    if (IS_DEMO_MODE) {
      demoAuth.login();
      navigate("/dashboard");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: "demo@mazou.io",
      password: "password123",
    });

    if (authError) {
      setError("Demo login failed: " + authError.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-[#0A1628] rounded-md flex items-center justify-center font-extrabold text-base text-white">
              m
            </div>
            <span className="font-extrabold text-xl tracking-tight text-text">
              mazou<span className="text-[#00E5A0]">.</span>
            </span>
          </div>
          <p className="text-text-dim text-sm">Sign in to your dashboard</p>
        </div>

        {/* Form */}
        <form id="login-form" onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red text-xs rounded-md p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-text-dim font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent transition-colors"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-text-dim font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E5A0] text-[#0A1628] py-2 rounded-md text-[13px] font-semibold cursor-pointer hover-glow disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg px-3 text-xs text-text-dim">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={fillDemo}
            disabled={loading}
            className="w-full bg-surface border border-[#00E5A0]/20 text-[#00E5A0] py-2 rounded-md text-[13px] font-medium cursor-pointer hover:bg-[#00E5A0]/5 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Try Demo Account"}
          </button>
        </form>

        <p className="text-center text-xs text-text-dim mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
