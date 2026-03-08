import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CreditCard, KeyRound, EyeOff, Globe, Check, ArrowRight } from "lucide-react";

const currencies = [
  "Pay in Naira.",
  "Pay in Cedis.",
  "Pay in Rand.",
  "Pay in KES.",
  "Pay in RWF.",
  "Pay in Birr.",
  "Pay in Local Currency.",
];

const globalModels = ["GPT-5.2", "GPT-5", "Claude Opus 4.6", "Claude Sonnet 4.6", "Gemini 2.5 Pro", "Gemini 2.5 Flash", "Llama 4 Maverick", "DeepSeek R1", "Mistral Large", "Cohere"];
const africanModels = ["InkubaLM", "Vulavula", "Awarri", "Oyster Skin", "Stratify AI", "Neural Labs"];

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setValue(Math.round(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { value, ref };
}

export default function LandingPage() {
  const [currencyIdx, setCurrencyIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const fadeRefs = useRef<(HTMLElement | null)[]>([]);

  const modelCount = useCountUp(16);
  const costReduction = useCountUp(40);

  // Currency rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrencyIdx((i) => (i + 1) % currencies.length);
        setFading(false);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Intersection observer for fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("opacity-100", "translate-y-0"); }),
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    fadeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setFadeRef = (i: number) => (el: HTMLElement | null) => { fadeRefs.current[i] = el; };

  return (
    <div className="bg-white text-[#0A1628] font-sans antialiased overflow-x-hidden">
      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 md:px-8 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="text-2xl font-extrabold tracking-tight">
          mazou<span className="text-[#00E5A0]">.</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-[#6B7280] text-sm font-medium hover:text-[#0A1628] transition-colors">How It Works</a>
          <a href="#models" className="text-[#6B7280] text-sm font-medium hover:text-[#0A1628] transition-colors">Models</a>
          <a href="#pricing" className="text-[#6B7280] text-sm font-medium hover:text-[#0A1628] transition-colors">Pricing</a>
          <Link to="/docs" className="text-[#6B7280] text-sm font-medium hover:text-[#0A1628] transition-colors">Docs</Link>
          <Link to="/login" className="bg-[#0A1628] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0d1f36] hover:-translate-y-0.5 hover:shadow-lg transition-all inline-flex items-center gap-2">
            Sign In
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center pt-32 pb-16 px-5 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(0,229,160,0.12)_0%,transparent_70%)] pointer-events-none opacity-60" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F9FAFB] border border-gray-200 text-[0.8125rem] text-[#6B7280] mb-8 relative" style={{ animation: "fadeUp 0.6s ease both" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-pulse" />
          AI infrastructure layer for Africa
        </div>
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.1] tracking-tight max-w-[800px] mb-6 font-[Space_Grotesk]" style={{ letterSpacing: "-0.03em", animation: "fadeUp 0.6s 0.1s ease both" }}>
          One API for all your AI.<br />
          <span
            className="text-[#00E5A0] inline-block transition-all duration-300"
            style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(-10px)" : "translateY(0)" }}
          >
            {currencies[currencyIdx]}
          </span>{" "}
          Waste nothing.
        </h1>
        <p className="text-lg text-[#6B7280] max-w-[560px] mb-10 leading-relaxed" style={{ animation: "fadeUp 0.6s 0.2s ease both" }}>
          Access OpenAI, Anthropic, Google, and other top global and African AI models through one intelligent API. Know what every LLM call, every agent, every AI feature is costing you - and how to spend less.
        </p>
        <div className="flex gap-4 items-center" style={{ animation: "fadeUp 0.6s 0.3s ease both" }}>
          <Link to="/login" className="bg-[#00E5A0] text-[#0A1628] px-6 py-3 rounded-lg font-semibold text-base hover:bg-[#00cc8e] hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,229,160,0.25)] transition-all inline-flex items-center gap-2">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-12 flex gap-10 text-[#6B7280] text-[0.8125rem] flex-wrap justify-center" style={{ animation: "fadeUp 0.6s 0.4s ease both" }}>
          <div><span ref={modelCount.ref} className="font-mono text-xl text-[#0A1628] font-medium block mb-0.5">{modelCount.value}+</span> AI models available</div>
          <div><CreditCard size={20} className="text-[#00E5A0] mb-1" /> Local currency billing</div>
          <div><span ref={costReduction.ref} className="font-mono text-xl text-[#0A1628] font-medium block mb-0.5">~{costReduction.value}%</span> avg. cost reduction</div>
        </div>
      </section>

      {/* CODE PREVIEW */}
      <section className="px-5 pb-24 flex justify-center" style={{ animation: "fadeUp 0.6s 0.5s ease both" }}>
        <div className="bg-[#111114] border border-[#1F1F2E] rounded-2xl w-full max-w-[700px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.15)] text-[#E8E8ED] hover:shadow-[0_32px_100px_rgba(0,0,0,0.2)] transition-shadow duration-500">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1F1F2E] bg-[#18181C]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
            <span className="ml-4 font-mono text-xs text-[#8888A0] px-3 py-1 bg-[#111114] rounded">app.py</span>
          </div>
          <div className="p-6 font-mono text-[0.8125rem] leading-[1.8] overflow-x-auto">
            <span className="text-[#555566]"># Before: Juggling 3 SDKs, 3 API keys, 3 USD invoices</span><br />
            <span className="text-[#555566]"># After: One line.</span><br /><br />
            <span className="text-[#C792EA]">from</span> <span className="text-[#82AAFF]">mazou</span> <span className="text-[#C792EA]">import</span> AI<br /><br />
            response = <span className="text-[#82AAFF]">AI</span>.<span className="text-[#82AAFF]">complete</span><span className="text-[#89DDFF]">(</span><br />
            &nbsp;&nbsp;<span className="text-[#00E5A0]">prompt</span>=<span className="text-[#3B82F6]">&quot;Summarise this customer complaint&quot;</span>,<br />
            &nbsp;&nbsp;<span className="text-[#00E5A0]">model</span>=<span className="text-[#3B82F6]">&quot;auto&quot;</span>,&nbsp;&nbsp;<span className="text-[#555566]"># routes to best model for this task</span><br />
            &nbsp;&nbsp;<span className="text-[#00E5A0]">budget</span>=<span className="text-[#3B82F6]">&quot;low&quot;</span>,&nbsp;&nbsp;&nbsp;<span className="text-[#555566]"># optimises for cost</span><br />
            &nbsp;&nbsp;<span className="text-[#00E5A0]">tag</span>=<span className="text-[#3B82F6]">&quot;support-bot&quot;</span>&nbsp;<span className="text-[#555566]"># tracks spend per feature</span><br />
            <span className="text-[#89DDFF]">)</span>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section ref={setFadeRef(0)} className="py-24 px-5 text-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#FF4D4D] mb-6">The Problem</div>
        <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.2] max-w-[700px] mx-auto mb-14 font-[Space_Grotesk]" style={{ letterSpacing: "-0.02em" }}>
          Your AI spend is a black box. Your team knows it. Your CFO knows it.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px max-w-[960px] mx-auto bg-[#E5E7EB] border border-gray-200 rounded-2xl overflow-hidden">
          {[
            { icon: <KeyRound size={24} className="text-[#6B7280]" />, title: "10 API keys, 10 dashboards", desc: "Every model provider wants their own account, their own billing, their own portal. Nobody has the full picture." },
            { icon: <CreditCard size={24} className="text-[#6B7280]" />, title: "USD-only billing", desc: "Getting a USD virtual card, managing FX, justifying dollar charges to finance - it's a tax on building with AI in Africa." },
            { icon: <EyeOff size={24} className="text-[#6B7280]" />, title: "No visibility, no control", desc: "Which feature is burning tokens? Which agent is expensive? Which model is overkill for simple tasks? Nobody knows." },
            { icon: <Globe size={24} className="text-[#6B7280]" />, title: "African models are invisible", desc: "Local language models exist - for Yoruba, Hausa, Igbo, Swahili - but they're scattered and hard to access." },
          ].map((c, i) => (
            <div key={c.title} className="bg-[#F9FAFB] p-8 text-left hover:bg-white transition-colors duration-300" style={{ animation: `fadeUp 0.5s ${0.1 * i}s ease both` }}>
              <div className="text-2xl mb-4">{c.icon}</div>
              <h3 className="text-base font-semibold mb-2">{c.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PULL QUOTE */}
      <section ref={setFadeRef(1)} className="py-16 px-5 text-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
        <div className="max-w-[680px] mx-auto">
          <div className="w-[60px] h-0.5 bg-[#00E5A0] mx-auto mb-6" />
          <h2 className="text-[2.2rem] font-extrabold tracking-tight mb-4 font-[Space_Grotesk]" style={{ letterSpacing: "-0.03em" }}>AI spend is the new cloud spend.</h2>
          <p className="text-[1.05rem] leading-relaxed text-[#6B7280] max-w-[580px] mx-auto">
            Remember when the Naira collapsed and every AWS bill tripled overnight? AI API costs are following the same trajectory - dollar-denominated, invisible until they&apos;re not, and growing faster than anyone expects. The infrastructure to manage it in Africa doesn&apos;t exist yet.
          </p>
          <div className="w-[60px] h-0.5 bg-[#00E5A0] mx-auto mt-6" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={setFadeRef(2)} id="how" className="py-24 px-5 max-w-[960px] mx-auto opacity-0 translate-y-8 transition-all duration-700 ease-out">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00E5A0] mb-6 text-center">How It Works</div>
        <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold text-center mb-16 leading-[1.2] font-[Space_Grotesk]" style={{ letterSpacing: "-0.02em" }}>
          Three steps. Five minutes. Full control.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-9 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[#E5E7EB] via-[#00E5A0] to-[#E5E7EB] opacity-40" />
          {[
            { n: "1", title: "Sign up & fund", desc: "Create an account and add credits in Naira. No USD card needed - pay via Paystack." },
            { n: "2", title: "Integrate in 2 minutes", desc: "Install the OpenAI SDK, point it at our base URL, and use your Mazou API key. That's it." },
            { n: "3", title: "See everything", desc: "Your dashboard lights up: per-feature costs, per-model usage, and optimization recommendations." },
          ].map((s, i) => (
            <div key={s.n} className="text-center relative group" style={{ animation: `fadeUp 0.5s ${0.15 * i}s ease both` }}>
              <div className="w-12 h-12 rounded-full bg-[#F9FAFB] border-2 border-[#00E5A0] flex items-center justify-center font-mono text-sm font-semibold text-[#00E5A0] mx-auto mb-5 relative z-10 group-hover:bg-[#00E5A0] group-hover:text-[#0A1628] transition-colors duration-300">{s.n}</div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODELS */}
      <section ref={setFadeRef(3)} id="models" className="py-24 px-5 text-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00E5A0] mb-6">Model Catalog</div>
        <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold mb-4 leading-[1.2] font-[Space_Grotesk]" style={{ letterSpacing: "-0.02em" }}>Every model. One endpoint.</h2>
        <p className="text-[#6B7280] mb-12 text-base">Global leaders and African-built models, accessible through the same API.</p>
        <div className="flex gap-3 justify-center flex-wrap max-w-[800px] mx-auto mb-8">
          {globalModels.map((m, i) => (
            <span key={m} className="px-5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-[0.8125rem] font-medium hover:border-[#6B7280] hover:-translate-y-0.5 transition-all cursor-default" style={{ animation: `scaleIn 0.4s ${0.05 * i}s ease both` }}>{m}</span>
          ))}
          {africanModels.map((m, i) => (
            <span key={m} className="px-5 py-2 border border-[#00E5A0] text-[#00E5A0] bg-[rgba(0,229,160,0.08)] rounded-full text-[0.8125rem] font-medium hover:bg-[rgba(0,229,160,0.15)] hover:-translate-y-0.5 transition-all cursor-default" style={{ animation: `scaleIn 0.4s ${0.05 * (globalModels.length + i)}s ease both` }}>{m}</span>
          ))}
        </div>
        <div className="flex gap-8 justify-center text-[0.8125rem] text-[#6B7280]">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#6B7280]" /> Global models</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00E5A0]" /> African models</span>
        </div>
      </section>

      {/* ACCESS / PRICING */}
      <section ref={setFadeRef(4)} id="pricing" className="py-24 px-5 max-w-[960px] mx-auto opacity-0 translate-y-8 transition-all duration-700 ease-out">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00E5A0] mb-6 text-center">Two Ways In</div>
        <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold text-center mb-4 leading-[1.2] font-[Space_Grotesk]" style={{ letterSpacing: "-0.02em" }}>Use ours or bring yours.</h2>
        <p className="text-[#6B7280] text-center mb-14 text-base">Whether you want the full managed experience or just the control layer - we&apos;ve got you.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-10 hover:border-[#00E5A0] hover:shadow-lg transition-all duration-300">
            <div className="font-mono text-[0.6875rem] uppercase tracking-widest text-[#00E5A0] mb-4">Managed</div>
            <h3 className="text-[1.375rem] font-bold mb-2.5">Buy Through Us</h3>
            <p className="text-[#6B7280] text-[0.9375rem] mb-6 leading-relaxed">We hold the keys. You buy credits in Naira. We handle everything.</p>
            <ul className="flex flex-col gap-2.5">
              {["No USD card needed", "No accounts with OpenAI, Anthropic, Google, etc.", "One monthly Naira invoice", "Full dashboard + smart routing + optimisation", "Best for startups and SMEs"].map((f) => (
                <li key={f} className="text-sm text-[#6B7280] flex items-start gap-2"><Check size={14} className="text-[#00E5A0] shrink-0 mt-0.5" /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-10 hover:border-[#3B82F6] hover:shadow-lg transition-all duration-300">
            <div className="font-mono text-[0.6875rem] uppercase tracking-widest text-[#3B82F6] mb-4">Bring Your Own Keys</div>
            <h3 className="text-[1.375rem] font-bold mb-2.5">Use Your Existing Accounts</h3>
            <p className="text-[#6B7280] text-[0.9375rem] mb-6 leading-relaxed">Plug in your existing API keys. Get the control layer on top.</p>
            <ul className="flex flex-col gap-2.5">
              {["Zero switching cost - keep your contracts", "Smart routing across your existing keys", "Full visibility dashboard", "Cost optimisation recommendations", "Best for enterprises with existing agreements"].map((f) => (
                <li key={f} className="text-sm text-[#6B7280] flex items-start gap-2"><Check size={14} className="text-[#3B82F6] shrink-0 mt-0.5" /> {f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section ref={setFadeRef(5)} className="py-24 px-5 text-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00E5A0] mb-6">Visibility</div>
        <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold mb-4 font-[Space_Grotesk]" style={{ letterSpacing: "-0.02em" }}>Know exactly where every naira goes.</h2>
        <p className="text-[#6B7280] mb-12 text-base">Not a graph you&apos;ll never check. A control centre your team actually opens.</p>
        <div className="max-w-[900px] mx-auto bg-[#111114] border border-[#1F1F2E] rounded-2xl overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.15)] text-[#E8E8ED] hover:shadow-[0_40px_120px_rgba(0,0,0,0.2)] transition-shadow duration-500">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F2E] bg-[#18181C]">
            <div className="flex items-center gap-6">
              <span className="font-semibold text-sm">Paystack AI Dashboard</span>
              <span className="text-xs text-[#8888A0] px-3 py-1 bg-[#0A0A0C] rounded">Feb 2026</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1F1F2E] border-b border-[#1F1F2E]">
            <div className="bg-[#111114] p-5 text-left">
              <div className="text-[0.6875rem] uppercase tracking-wider text-[#8888A0] mb-1">Total Spend</div>
              <div className="font-mono text-[1.375rem] font-medium text-[#00E5A0]">&#8358;2,847,200</div>
              <div className="text-[0.6875rem] text-[#FF4D4D] mt-1">&#8593; 12% vs last month</div>
            </div>
            <div className="bg-[#111114] p-5 text-left">
              <div className="text-[0.6875rem] uppercase tracking-wider text-[#8888A0] mb-1">API Calls</div>
              <div className="font-mono text-[1.375rem] font-medium">1.2M</div>
              <div className="text-[0.6875rem] text-[#3B82F6] mt-1">&#8593; 8%</div>
            </div>
            <div className="bg-[#111114] p-5 text-left">
              <div className="text-[0.6875rem] uppercase tracking-wider text-[#8888A0] mb-1">Models Used</div>
              <div className="font-mono text-[1.375rem] font-medium">6</div>
            </div>
            <div className="bg-[#111114] p-5 text-left">
              <div className="text-[0.6875rem] uppercase tracking-wider text-[#8888A0] mb-1">Potential Savings</div>
              <div className="font-mono text-[1.375rem] font-medium text-[#00E5A0]">&#8358;1,138,880</div>
              <div className="text-[0.6875rem] text-[#00E5A0] mt-1">40% of current spend</div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8888A0] mb-4 text-left">Spend by Feature</div>
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] py-3 border-b border-[#1F1F2E] text-[0.6875rem] uppercase tracking-wider text-[#8888A0]">
              <span>Feature</span><span>Model</span><span>Calls</span><span>Cost</span><span>Recommendation</span>
            </div>
            {[
              { feature: "Customer Support Bot", model: "gpt-4o", calls: "842K", cost: "\u20A61,940,000", tip: "\u2192 Switch to Sonnet, save \u20A6890K" },
              { feature: "Transaction Summariser", model: "claude-sonnet", calls: "286K", cost: "\u20A6620,000", tip: "\u2192 Use Haiku, save \u20A6248K" },
              { feature: "Fraud Detection Agent", model: "gpt-4o", calls: "91K", cost: "\u20A6287,200", tip: null },
            ].map((r) => (
              <div key={r.feature} className="grid grid-cols-[1fr_1fr] md:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] py-3 border-b border-[#1F1F2E] text-[0.8125rem] items-center text-left gap-2">
                <span className="font-medium">{r.feature}</span>
                <span className="text-[#8888A0] font-mono text-xs">{r.model}</span>
                <span className="font-mono text-[#8888A0]">{r.calls}</span>
                <span className="font-mono">{r.cost}</span>
                {r.tip ? (
                  <span className="text-xs text-[#3B82F6] bg-[rgba(59,130,246,0.15)] px-2 py-1 rounded inline-block">{r.tip}</span>
                ) : (
                  <span className="text-xs text-[#8888A0]">Optimal</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-5 text-center relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(0,229,160,0.1)_0%,transparent_70%)] pointer-events-none opacity-40" />
        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.1] mb-4 relative font-[Space_Grotesk]" style={{ letterSpacing: "-0.03em" }}>
          Stop guessing.<br />Start building.
        </h2>
        <p className="text-[#6B7280] text-lg mb-10 relative">Ready to optimize your AI infrastructure?</p>
        <div className="flex gap-4 justify-center relative">
          <Link to="/login" className="bg-[#00E5A0] text-[#0A1628] px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-[#00cc8e] hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,229,160,0.25)] transition-all inline-flex items-center gap-2">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="border-t border-[#E5E7EB] max-w-[1100px] mx-auto px-5 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-8">
          <div className="text-center md:text-left">
            <div className="text-2xl font-extrabold mb-2">mazou<span className="text-[#00E5A0]">.</span></div>
            <p className="text-sm text-[#6B7280]">AI infrastructure layer for Africa</p>
          </div>
          <div className="text-center md:text-right">
            <div className="text-[0.6875rem] uppercase tracking-widest text-[#6B7280] mb-3 font-semibold">Contact</div>
            <div className="flex flex-col gap-2 text-sm">
              <a href="mailto:team@mazou.ai" className="hover:text-[#00E5A0] transition-colors">team@mazou.ai</a>
              <span>Lagos, Nigeria</span>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-[#E5E7EB] text-center text-[0.8125rem] text-[#6B7280]">
          &copy; 2026 Mazou. Built for Africa.
        </div>
      </footer>
    </div>
  );
}
