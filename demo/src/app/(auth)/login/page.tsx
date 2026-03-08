"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  function fillDemo() {
    setLoading(true);
    setError("");
    // For demo: skip API call, navigate directly to dashboard
    setTimeout(() => router.push("/dashboard"), 600);
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-extrabold text-base text-black">
              m
            </div>
            <span className="font-extrabold text-xl tracking-tight text-text">
              mazou<span className="text-accent">.</span>
            </span>
          </div>
          <p className="text-text-dim text-sm">Sign in to your dashboard</p>
        </div>

        {/* Form */}
        <form id="login-form" onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-[rgba(255,77,77,0.08)] border border-[rgba(255,77,77,0.2)] text-red text-xs rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-text-dim font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
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
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-colors disabled:opacity-50"
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
            className="w-full bg-surface border border-accent/30 text-accent py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent/10 transition-colors"
          >
            Try Demo Account
          </button>
        </form>

        <p className="text-center text-xs text-text-dim mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
