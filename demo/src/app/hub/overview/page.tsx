"use client";

import { useEffect, useRef } from "react";

/* ── reusable section wrapper with fade-in ──────────────────── */

function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add("opacity-100", "translate-y-0"); },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref} id={id} className={`opacity-0 translate-y-8 transition-all duration-700 ease-out ${className}`}>
      {children}
    </section>
  );
}

/* ── page table of contents ─────────────────────────────────── */

const toc = [
  { id: "problem", label: "The Problem" },
  { id: "solution", label: "The Solution" },
  { id: "architecture", label: "Architecture" },
  { id: "routing", label: "Smart Routing" },
  { id: "billing", label: "Billing Flow" },
  { id: "dashboard", label: "Dashboard" },
  { id: "models", label: "Models" },
  { id: "why-africa", label: "Why Africa" },
];

/* ── main page ──────────────────────────────────────────────── */

export default function OverviewPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">Deep Dive</div>
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight mb-4" style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.03em" }}>
          Why Mazou Exists &<br />How It Works
        </h1>
        <p className="text-lg text-[#8888A0] max-w-xl mx-auto">
          A comprehensive overview of the AI infrastructure gap in Africa, and how Mazou fills it.
        </p>
      </div>

      {/* Table of contents */}
      <div className="bg-[#111114] border border-[#222228] rounded-xl p-6 mb-16">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888A0] mb-4">Contents</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {toc.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#8888A0] hover:text-[#E8E8ED] hover:bg-[#1C1C26] transition-all"
            >
              <span className="font-mono text-xs text-[#00D26A]">{String(i + 1).padStart(2, "0")}</span>
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── 1. THE PROBLEM ─────────────────────────────────── */}
      <Section id="problem" className="mb-20">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#FF4D4D] mb-4">01 &mdash; The Problem</div>
        <h2 className="text-3xl font-extrabold mb-6" style={{ letterSpacing: "-0.02em" }}>
          AI is transforming every industry. Africa is being left behind.
        </h2>
        <div className="prose-custom space-y-4 text-[#8888A0] leading-relaxed">
          <p>
            Across the world, companies are embedding AI into every product &mdash; customer support, fraud detection,
            content generation, data analysis. The AI API market hit <strong className="text-[#E8E8ED]">$13.3 billion in 2025</strong> and
            is growing 40%+ year-over-year.
          </p>
          <p>
            But African developers face a unique set of barriers that make building with AI unnecessarily difficult, expensive,
            and opaque.
          </p>
        </div>

        {/* Pain point diagram */}
        <div className="mt-8 bg-[#111114] border border-[#222228] rounded-xl p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8888A0] mb-6 text-center">The African Developer Experience Today</h3>
          <div className="flex flex-col items-center gap-4 font-mono text-sm">
            <div className="px-6 py-3 border border-[#E8E8ED] rounded-lg text-center">African Developer</div>
            <div className="text-[#FF4D4D]">&#x2193; needs AI</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
              {[
                { provider: "OpenAI", problem: "USD card required" },
                { provider: "Anthropic", problem: "USD card required" },
                { provider: "Google", problem: "USD card required" },
                { provider: "African AI", problem: "Fragmented access" },
              ].map((p) => (
                <div key={p.provider} className="border border-[#222228] rounded-lg p-4 text-center">
                  <div className="text-xs text-[#E8E8ED] mb-2">{p.provider}</div>
                  <div className="text-xs text-[#FF4D4D]">{p.problem}</div>
                </div>
              ))}
            </div>
            <div className="text-[#FF4D4D] text-xs text-center mt-2">
              &#x2193; Result: 4 accounts, 4 dashboards, 4 USD invoices, zero visibility
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <div className="bg-[#111114] border border-[#222228] rounded-xl p-6">
            <h3 className="font-semibold text-[#FFB800] mb-3">The Payment Problem</h3>
            <p className="text-sm text-[#8888A0] leading-relaxed">
              OpenAI, Anthropic, and Google only accept USD credit cards. Most African developers don&apos;t have
              international cards. Those who do face 3-5% FX fees, frequent transaction failures, and currency
              volatility. When the Naira went from 460 to 1,500/$, every API bill tripled overnight.
            </p>
          </div>
          <div className="bg-[#111114] border border-[#222228] rounded-xl p-6">
            <h3 className="font-semibold text-[#4D8AFF] mb-3">The Visibility Problem</h3>
            <p className="text-sm text-[#8888A0] leading-relaxed">
              No existing tool tells you &ldquo;your customer support bot spent NGN 1.9M last month and could
              save NGN 890K by switching models.&rdquo; Teams discover their AI costs in the monthly invoice &mdash;
              too late to act.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 2. THE SOLUTION ────────────────────────────────── */}
      <Section id="solution" className="mb-20">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">02 &mdash; The Solution</div>
        <h2 className="text-3xl font-extrabold mb-6" style={{ letterSpacing: "-0.02em" }}>
          One API. Local currency. Full visibility.
        </h2>
        <p className="text-[#8888A0] leading-relaxed mb-8">
          Mazou is a unified AI gateway that sits between your applications and every AI provider. It solves all three
          problems simultaneously: access, payment, and visibility.
        </p>

        {/* Before/After */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#111114] border border-[#FF4D4D] border-opacity-30 rounded-xl p-6">
            <div className="text-xs font-mono uppercase tracking-wider text-[#FF4D4D] mb-4">Before Mazou</div>
            <ul className="space-y-3">
              {[
                "Multiple API keys across providers",
                "USD credit card for each provider",
                "FX fees + currency volatility",
                "Separate dashboards, no unified view",
                "No per-feature cost tracking",
                "Manual model selection (often overkill)",
                "African models inaccessible",
              ].map((item) => (
                <li key={item} className="text-sm text-[#8888A0] flex items-start gap-2">
                  <span className="text-[#FF4D4D] shrink-0">&#x2717;</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#111114] border border-[#00D26A] border-opacity-30 rounded-xl p-6">
            <div className="text-xs font-mono uppercase tracking-wider text-[#00D26A] mb-4">After Mazou</div>
            <ul className="space-y-3">
              {[
                "One API key for 40+ models",
                "Pay in Naira via Paystack",
                "Transparent kobo-level pricing",
                "One dashboard for everything",
                "Per-feature, per-agent cost tracking",
                "Smart routing saves 15-40%",
                "African language models built in",
              ].map((item) => (
                <li key={item} className="text-sm text-[#8888A0] flex items-start gap-2">
                  <span className="text-[#00D26A] shrink-0">&#x2713;</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── 3. ARCHITECTURE ────────────────────────────────── */}
      <Section id="architecture" className="mb-20">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">03 &mdash; Architecture</div>
        <h2 className="text-3xl font-extrabold mb-6" style={{ letterSpacing: "-0.02em" }}>
          How the system is built.
        </h2>
        <p className="text-[#8888A0] leading-relaxed mb-8">
          Mazou is a two-part system: a Python/FastAPI backend that acts as the intelligent gateway, and a Next.js
          dashboard for visibility and control.
        </p>

        {/* Architecture diagram */}
        <div className="bg-[#111114] border border-[#222228] rounded-xl p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8888A0] mb-6 text-center">System Architecture</h3>
          <div className="flex flex-col items-center gap-4 font-mono text-xs">
            {/* Client layer */}
            <div className="flex gap-3 flex-wrap justify-center">
              <div className="px-4 py-2.5 border border-[#8888A0] rounded-lg">Your Python App</div>
              <div className="px-4 py-2.5 border border-[#8888A0] rounded-lg">Your Node.js App</div>
              <div className="px-4 py-2.5 border border-[#8888A0] rounded-lg">AI Agents</div>
              <div className="px-4 py-2.5 border border-[#8888A0] rounded-lg">No-Code Tools</div>
            </div>
            <div className="text-[#8888A0]">&#x2193; OpenAI-compatible API calls &#x2193;</div>

            {/* Gateway */}
            <div className="w-full max-w-lg border-2 border-[#00D26A] rounded-xl p-5 text-center">
              <div className="text-base font-semibold text-[#00D26A] mb-3">Mazou Gateway</div>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#0A0A0C] rounded-lg p-2 text-[10px]">
                  <div className="text-[#00D26A] font-semibold mb-1">Auth</div>
                  API keys, JWT
                </div>
                <div className="bg-[#0A0A0C] rounded-lg p-2 text-[10px]">
                  <div className="text-[#FFB800] font-semibold mb-1">Router</div>
                  Model selection
                </div>
                <div className="bg-[#0A0A0C] rounded-lg p-2 text-[10px]">
                  <div className="text-[#4D8AFF] font-semibold mb-1">Billing</div>
                  Wallet debits
                </div>
                <div className="bg-[#0A0A0C] rounded-lg p-2 text-[10px]">
                  <div className="text-[#A855F7] font-semibold mb-1">Analytics</div>
                  Usage logs
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-[#8888A0]">
              <span>&#x2199;</span>
              <span>&#x2193;</span>
              <span>&#x2198;</span>
            </div>

            {/* Providers */}
            <div className="flex gap-3 flex-wrap justify-center">
              {[
                { name: "OpenAI", color: "#10A37F" },
                { name: "Anthropic", color: "#D4A274" },
                { name: "Google", color: "#4285F4" },
                { name: "DeepSeek", color: "#4D6BFE" },
                { name: "Mistral", color: "#FF7200" },
                { name: "African AI", color: "#FFB800" },
              ].map((p) => (
                <div key={p.name} className="px-3 py-2 border rounded-lg" style={{ borderColor: p.color, color: p.color }}>
                  {p.name}
                </div>
              ))}
            </div>

            <div className="text-[#8888A0] mt-2">&#x2193;</div>

            {/* Data stores */}
            <div className="flex gap-3">
              <div className="px-4 py-2.5 bg-[#1C1C26] border border-[#222228] rounded-lg">PostgreSQL</div>
              <div className="px-4 py-2.5 bg-[#1C1C26] border border-[#222228] rounded-lg">Redis Cache</div>
            </div>
          </div>
        </div>

        {/* Tech stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <div className="bg-[#111114] border border-[#222228] rounded-xl p-6">
            <h3 className="font-semibold text-sm mb-3">Backend</h3>
            <ul className="space-y-2 text-sm text-[#8888A0]">
              <li><strong className="text-[#E8E8ED]">FastAPI</strong> &mdash; async Python, 30 API endpoints</li>
              <li><strong className="text-[#E8E8ED]">LiteLLM</strong> &mdash; embedded multi-provider abstraction</li>
              <li><strong className="text-[#E8E8ED]">SQLAlchemy</strong> &mdash; 12 data models, Alembic migrations</li>
              <li><strong className="text-[#E8E8ED]">Atomic wallet</strong> &mdash; UPDATE WHERE balance &gt;= amount</li>
            </ul>
          </div>
          <div className="bg-[#111114] border border-[#222228] rounded-xl p-6">
            <h3 className="font-semibold text-sm mb-3">Frontend</h3>
            <ul className="space-y-2 text-sm text-[#8888A0]">
              <li><strong className="text-[#E8E8ED]">Next.js 16</strong> &mdash; React 19, App Router</li>
              <li><strong className="text-[#E8E8ED]">Tailwind v4</strong> &mdash; custom dark design system</li>
              <li><strong className="text-[#E8E8ED]">SWR + Zustand</strong> &mdash; data fetching &amp; state</li>
              <li><strong className="text-[#E8E8ED]">Recharts</strong> &mdash; spend visualization</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ── 4. SMART ROUTING ───────────────────────────────── */}
      <Section id="routing" className="mb-20">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">04 &mdash; Smart Routing</div>
        <h2 className="text-3xl font-extrabold mb-6" style={{ letterSpacing: "-0.02em" }}>
          The right model for every request.
        </h2>
        <p className="text-[#8888A0] leading-relaxed mb-8">
          Instead of hard-coding a model, developers send <code className="text-[#00D26A] bg-[#111114] px-1.5 py-0.5 rounded text-xs">model=&quot;auto&quot;</code> and
          let Mazou&apos;s routing engine pick the optimal model based on cost, complexity, and language.
        </p>

        {/* Routing strategies */}
        <div className="space-y-5">
          {[
            {
              title: "Budget-Based Routing",
              color: "#00D26A",
              desc: "Set budget='low', 'balanced', or 'quality'. Low routes to the cheapest capable model, quality to the frontier.",
              example: "\"Translate this to English\" → budget=low → DeepSeek V3 (90% cheaper than GPT-4o)",
            },
            {
              title: "Complexity-Based Routing",
              color: "#FFB800",
              desc: "Analyze request complexity automatically. Simple FAQ? Use a cheap model. Multi-step reasoning? Use a frontier model.",
              example: "\"What are your opening hours?\" → Haiku ($0.25/M) vs \"Analyze this contract\" → Opus ($15/M)",
            },
            {
              title: "Language-Based Routing",
              color: "#4D8AFF",
              desc: "Detect African languages (Yoruba, Hausa, Igbo, Pidgin, Swahili) and route to specialized models that outperform global ones by up to 40%.",
              example: "\"Bawo ni o se n se?\" → Detected: Yoruba → InkubaLM (40% better accuracy)",
            },
            {
              title: "Fallback Chains",
              color: "#A855F7",
              desc: "If the primary model times out or errors, automatically switch to the next best option. Zero downtime for your users.",
              example: "GPT-4o timeout → auto-fallback → Claude Sonnet → response in <2s",
            },
          ].map((strategy) => (
            <div key={strategy.title} className="bg-[#111114] border border-[#222228] rounded-xl p-6" style={{ borderLeftColor: strategy.color, borderLeftWidth: 3 }}>
              <h3 className="font-semibold mb-2" style={{ color: strategy.color }}>{strategy.title}</h3>
              <p className="text-sm text-[#8888A0] leading-relaxed mb-3">{strategy.desc}</p>
              <div className="bg-[#0A0A0C] rounded-lg px-4 py-3 font-mono text-xs text-[#8888A0]">
                {strategy.example}
              </div>
            </div>
          ))}
        </div>

        {/* Savings diagram */}
        <div className="bg-[#111114] border border-[#222228] rounded-xl p-8 mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8888A0] mb-6 text-center">Cost Savings Example</h3>
          <div className="space-y-4 max-w-lg mx-auto">
            {[
              { feature: "Customer Support Bot", before: "GPT-4o — NGN 1,940,000", after: "Claude Sonnet — NGN 1,050,000", saving: "NGN 890,000", pct: 46 },
              { feature: "Transaction Summaries", before: "Claude Sonnet — NGN 620,000", after: "Haiku — NGN 372,000", saving: "NGN 248,000", pct: 40 },
              { feature: "Content Moderation", before: "GPT-4 — NGN 485,000", after: "DeepSeek V3 — NGN 48,500", saving: "NGN 436,500", pct: 90 },
            ].map((row) => (
              <div key={row.feature} className="bg-[#0A0A0C] rounded-lg p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-medium">{row.feature}</span>
                  <span className="font-mono text-sm text-[#00D26A]">-{row.pct}%</span>
                </div>
                <div className="text-xs text-[#8888A0] flex justify-between mb-2">
                  <span>{row.before}</span>
                  <span>&#x2192;</span>
                  <span className="text-[#00D26A]">{row.after}</span>
                </div>
                <div className="h-1.5 bg-[#1C1C26] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D26A] rounded-full" style={{ width: `${100 - row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 5. BILLING FLOW ────────────────────────────────── */}
      <Section id="billing" className="mb-20">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">05 &mdash; Billing Flow</div>
        <h2 className="text-3xl font-extrabold mb-6" style={{ letterSpacing: "-0.02em" }}>
          Prepaid wallet. Positive cash flow. Zero credit risk.
        </h2>
        <p className="text-[#8888A0] leading-relaxed mb-8">
          All money is stored in kobo (100 kobo = 1 Naira) as integers, never floats. This prevents rounding errors
          and ensures perfect financial accuracy.
        </p>

        {/* Billing flow diagram */}
        <div className="bg-[#111114] border border-[#222228] rounded-xl p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8888A0] mb-6 text-center">Money Flow</h3>
          <div className="flex flex-col items-center gap-4 font-mono text-xs max-w-md mx-auto">
            {[
              { step: "1", label: "User funds wallet", detail: "Paystack (bank transfer, card, USSD)", color: "#FFB800" },
              { step: "2", label: "Webhook confirms payment", detail: "HMAC-SHA512 verified", color: "#FFB800" },
              { step: "3", label: "Wallet credited", detail: "Balance += amount (atomic)", color: "#00D26A" },
              { step: "4", label: "API request made", detail: "model='auto', budget='low'", color: "#4D8AFF" },
              { step: "5", label: "Cost calculated", detail: "tokens x price_per_token x 1.15 margin", color: "#4D8AFF" },
              { step: "6", label: "Wallet debited atomically", detail: "UPDATE WHERE balance >= cost", color: "#00D26A" },
              { step: "7", label: "Usage logged", detail: "Feature, model, tokens, cost, latency", color: "#A855F7" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4 w-full">
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: s.color, color: s.color }}>
                  {s.step}
                </div>
                <div className="flex-1 bg-[#0A0A0C] rounded-lg px-4 py-3">
                  <div className="text-sm text-[#E8E8ED] mb-0.5 font-sans">{s.label}</div>
                  <div className="text-[10px] text-[#8888A0]">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0A0A0C] border border-[#00D26A] rounded-xl p-5 text-center mt-6">
          <span className="text-sm text-[#00D26A] font-medium">
            Users pay upfront (prepaid) &rarr; Providers bill monthly (post-paid) &rarr; Mazou always has positive cash flow
          </span>
        </div>
      </Section>

      {/* ── 6. DASHBOARD ───────────────────────────────────── */}
      <Section id="dashboard" className="mb-20">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">06 &mdash; Dashboard</div>
        <h2 className="text-3xl font-extrabold mb-6" style={{ letterSpacing: "-0.02em" }}>
          Complete spend visibility.
        </h2>
        <p className="text-[#8888A0] leading-relaxed mb-8">
          The dashboard isn&apos;t just analytics &mdash; it&apos;s a control centre. Teams see exactly where every
          naira goes, and get actionable recommendations to reduce spend.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: "Spend by Feature", desc: "Tag every API call with a feature name. See exactly how much your support bot, fraud detector, and search engine each cost.", color: "#00D26A" },
            { title: "Spend by Agent", desc: "Track individual AI agents — their request volume, cost per action, and trend over time. Identify expensive agents before they drain wallets.", color: "#FFB800" },
            { title: "Model Analytics", desc: "Which models are you using? What's the cost distribution? Are you overpaying for simple tasks? See it all in one view.", color: "#4D8AFF" },
            { title: "Optimization Engine", desc: "One-click recommendations: 'Switch your support bot from GPT-4o to Sonnet, save NGN 890K/month.' Mazou finds savings automatically.", color: "#A855F7" },
          ].map((card) => (
            <div key={card.title} className="bg-[#111114] border border-[#222228] rounded-xl p-6" style={{ borderTopColor: card.color, borderTopWidth: 3 }}>
              <h3 className="font-semibold mb-2" style={{ color: card.color }}>{card.title}</h3>
              <p className="text-sm text-[#8888A0] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 7. MODELS ──────────────────────────────────────── */}
      <Section id="models" className="mb-20">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">07 &mdash; Models</div>
        <h2 className="text-3xl font-extrabold mb-6" style={{ letterSpacing: "-0.02em" }}>
          40+ models. One endpoint.
        </h2>
        <p className="text-[#8888A0] leading-relaxed mb-8">
          Access every major global model and a growing catalog of African language models &mdash; all through the same
          OpenAI-compatible API.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#111114] border border-[#222228] rounded-xl p-6">
            <h3 className="font-semibold text-sm mb-4">Global Models</h3>
            <div className="flex flex-wrap gap-2">
              {["GPT-5.2", "GPT-5", "GPT-4o", "Claude Opus 4.6", "Claude Sonnet 4.6", "Claude Haiku", "Gemini 2.5 Pro", "Gemini 2.5 Flash", "DeepSeek R1", "DeepSeek V3", "Llama 4 Maverick", "Mistral Large", "Cohere Command R+"].map((m) => (
                <span key={m} className="px-3 py-1.5 bg-[#1C1C26] border border-[#222228] rounded-full text-xs">{m}</span>
              ))}
            </div>
          </div>
          <div className="bg-[#111114] border border-[#FFB800] border-opacity-30 rounded-xl p-6">
            <h3 className="font-semibold text-sm text-[#FFB800] mb-4">African Language Models</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "InkubaLM", lang: "Multi-African" },
                { name: "Vulavula", lang: "South African" },
                { name: "Khaya AI", lang: "West African" },
                { name: "Lesan AI", lang: "Amharic, Tigrinya" },
                { name: "Sunflower", lang: "Swahili" },
                { name: "UlizaLlama", lang: "Swahili" },
                { name: "Awarri", lang: "Yoruba, Igbo" },
                { name: "Stratify AI", lang: "Pidgin, Hausa" },
              ].map((m) => (
                <span key={m.name} className="px-3 py-1.5 border border-[#FFB800] text-[#FFB800] bg-[rgba(255,184,0,0.08)] rounded-full text-xs" title={m.lang}>
                  {m.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-[#8888A0] mt-4">
              African models are automatically selected when the routing engine detects local languages, providing
              up to 40% better accuracy than global models on these tasks.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 8. WHY AFRICA ──────────────────────────────────── */}
      <Section id="why-africa" className="mb-20">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#FFB800] mb-4">08 &mdash; Why Africa</div>
        <h2 className="text-3xl font-extrabold mb-6" style={{ letterSpacing: "-0.02em" }}>
          The analogy that matters.
        </h2>
        <div className="bg-[#111114] border border-[#222228] rounded-xl p-8 mb-8">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-0.5 bg-[#00D26A] mx-auto mb-6" />
            <p className="text-xl font-semibold leading-relaxed mb-4">
              Paystack built the payment rails for Africa&apos;s internet economy.
            </p>
            <p className="text-xl font-semibold text-[#00D26A] leading-relaxed">
              Mazou is building the infrastructure layer for Africa&apos;s AI economy.
            </p>
            <div className="w-16 h-0.5 bg-[#00D26A] mx-auto mt-6" />
          </div>
        </div>

        <div className="bg-[#111114] border border-[#222228] rounded-xl p-6">
          <h3 className="font-semibold text-sm mb-4">The Pattern</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222228]">
                  <th className="text-left p-3 text-xs uppercase tracking-wider text-[#8888A0] font-semibold" />
                  <th className="text-left p-3 text-xs uppercase tracking-wider text-[#8888A0] font-semibold">2015 &mdash; Payments</th>
                  <th className="text-left p-3 text-xs uppercase tracking-wider text-[#00D26A] font-semibold">2026 &mdash; AI</th>
                </tr>
              </thead>
              <tbody className="text-[#8888A0]">
                {[
                  { label: "Problem", payments: "Can't accept payments in local currency", ai: "Can't access AI in local currency" },
                  { label: "Existing solutions", payments: "Stripe (USD only), manual bank transfers", ai: "OpenAI, Anthropic (USD only)" },
                  { label: "Solution", payments: "Paystack — local currency payment rails", ai: "Mazou — local currency AI infrastructure" },
                  { label: "Outcome", payments: "$2B acquisition by Stripe", ai: "?" },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-[#222228]">
                    <td className="p-3 font-medium text-[#E8E8ED]">{row.label}</td>
                    <td className="p-3">{row.payments}</td>
                    <td className="p-3 text-[#00D26A]">{row.ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Footer CTA */}
      <div className="text-center py-16 border-t border-[#222228]">
        <p className="text-xl font-semibold mb-4">Want to learn more?</p>
        <div className="flex gap-4 justify-center">
          <a href="/hub/pitch" className="bg-[#00A854] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#00D26A] transition-all">
            View Pitch Deck
          </a>
          <a href="/hub/faq" className="bg-[#111114] border border-[#222228] text-[#E8E8ED] px-6 py-3 rounded-lg font-semibold text-sm hover:border-[#8888A0] transition-all">
            Investor FAQ
          </a>
        </div>
      </div>
    </div>
  );
}
