import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          org_name: orgName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-[#0A1628] rounded-md flex items-center justify-center font-extrabold text-base text-white">
              m
            </div>
            <span className="font-extrabold text-xl tracking-tight text-text">
              mazou<span className="text-[#00E5A0]">.</span>
            </span>
          </div>
          <p className="text-text-dim text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red text-xs rounded-md p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-text-dim font-medium mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent transition-colors"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-text-dim font-medium mb-1.5">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent transition-colors"
              placeholder="Paystack"
              required
            />
          </div>

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
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E5A0] text-[#0A1628] py-2 rounded-md text-[13px] font-semibold cursor-pointer hover-glow disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-text-dim mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
