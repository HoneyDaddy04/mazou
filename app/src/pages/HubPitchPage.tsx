import { useState, useCallback, useEffect } from "react";
import { Key, DollarSign, EyeOff, Globe, Wallet, BarChart3, Plug, Check, ChevronDown, ChevronLeft, ChevronRight, Minus, Circle } from "lucide-react";

/* -- slide data --------------------------------------------------------- */

interface Slide {
  label: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

const slides: Slide[] = [
  /* 0 - TITLE */
  {
    label: "Title",
    title: "mazou.",
    subtitle: "One API for All Your AI. Pay in Local Currency. Waste Nothing.",
    content: (
      <div className="flex flex-col items-center gap-8 mt-4">
        <div className="flex gap-6 flex-wrap justify-center text-sm text-[#6B7280]">
          <span className="px-4 py-2 border border-[#E5E7EB] rounded-full">AI Infrastructure</span>
          <span className="px-4 py-2 border border-[#00E5A0] text-[#00E5A0] rounded-full">Built for Africa</span>
          <span className="px-4 py-2 border border-[#E5E7EB] rounded-full">Pre-Seed</span>
        </div>
        <p className="text-[#6B7280] text-base max-w-md text-center">team@mazou.ai &middot; Lagos, Nigeria</p>
      </div>
    ),
  },
  /* 1 - PROBLEM */
  {
    label: "Problem",
    title: "Building with AI in Africa is broken.",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {[
          { icon: <Key size={24} className="text-[#00E5A0]" />, head: "Fragmented access", body: "10 providers, 10 dashboards, 10 API keys. No single view." },
          { icon: <DollarSign size={24} className="text-[#00E5A0]" />, head: "USD-only billing", body: "Most African devs can't get USD cards. FX fees eat margins." },
          { icon: <EyeOff size={24} className="text-[#00E5A0]" />, head: "Zero visibility", body: "Teams can't see what each feature or agent costs in AI spend." },
          { icon: <Globe size={24} className="text-[#00E5A0]" />, head: "African models invisible", body: "Yoruba, Hausa, Igbo, Swahili models exist but are hard to reach." },
        ].map((c) => (
          <div key={c.head} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
            <div className="mb-3">{c.icon}</div>
            <h3 className="font-semibold text-base mb-1">{c.head}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    ),
  },
  /* 2 - WHY NOW */
  {
    label: "Why Now",
    title: "AI spend is the new cloud spend.",
    content: (
      <div className="mt-6 space-y-6 max-w-2xl mx-auto">
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6 space-y-4">
          {[
            { stat: "$13.3B", desc: "spent on AI APIs globally in 2025, growing 40%+ YoY" },
            { stat: "500K+", desc: "software developers in Nigeria alone, growing 50%+ annually" },
            { stat: "0", desc: "AI cost management platforms built for Africa" },
          ].map((s) => (
            <div key={s.stat} className="flex items-baseline gap-4">
              <span className="font-mono text-2xl font-bold text-[#3B82F6] shrink-0 w-24 text-right">{s.stat}</span>
              <span className="text-[#6B7280] text-sm">{s.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[#6B7280] text-sm text-center leading-relaxed">
          When the Naira collapsed, every AWS bill tripled overnight. AI API costs are following the same trajectory &mdash;
          dollar-denominated, invisible until they&apos;re not, and growing faster than anyone expects.
        </p>
      </div>
    ),
  },
  /* 3 - SOLUTION */
  {
    label: "Solution",
    title: "One API. Local billing. Full visibility.",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {[
          {
            color: "#00E5A0",
            head: "Unified Gateway",
            items: ["One API key for 40+ models", "OpenAI-compatible format", "Drop-in replacement -- zero code changes", "Global + African models"],
          },
          {
            color: "#00E5A0",
            head: "Local Currency Billing",
            items: ["Fund wallet in Naira via Paystack", "Bank transfer, card, or USSD", "No USD card required", "Transparent pricing in kobo"],
          },
          {
            color: "#4D8AFF",
            head: "Smart Cost Control",
            items: ["Per-feature, per-agent cost tracking", "Smart routing saves 15-40%", "Auto-optimize: cheap model for simple tasks", "Real-time spend dashboard"],
          },
        ].map((col) => (
          <div key={col.head} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="font-semibold text-base mb-4" style={{ color: col.color }}>{col.head}</h3>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item} className="text-sm text-[#6B7280] flex items-start gap-2">
                  <span style={{ color: col.color }} className="font-bold shrink-0 mt-0.5"><Check size={14} /></span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },
  /* 4 - HOW IT WORKS */
  {
    label: "How It Works",
    title: "Three-layer architecture.",
    content: (
      <div className="mt-6 max-w-2xl mx-auto space-y-4">
        {/* Flow diagram */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-8">
          <div className="flex flex-col items-center gap-3 font-mono text-sm">
            <div className="px-6 py-3 border border-[#6B7280] rounded-lg text-[#0A1628]">Your App / Agent</div>
            <div className="text-[#6B7280]"><ChevronDown size={14} /></div>
            <div className="px-6 py-3 bg-[#00E5A0] text-[#0A1628] rounded-lg font-semibold">Mazou Gateway</div>
            <div className="flex items-center gap-4 text-[#6B7280]">
              <span><ChevronDown size={14} className="rotate-45" /></span>
              <span><ChevronDown size={14} /></span>
              <span><ChevronDown size={14} className="-rotate-45" /></span>
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              <div className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280]">Smart Routing</div>
              <div className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#00E5A0]">Billing Engine</div>
              <div className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#4D8AFF]">Analytics</div>
            </div>
            <div className="text-[#6B7280]"><ChevronDown size={14} /></div>
            <div className="flex gap-3 flex-wrap justify-center">
              {["OpenAI", "Anthropic", "Google", "DeepSeek", "African AI"].map((p) => (
                <span key={p} className="px-3 py-1.5 bg-[#E5E7EB] border border-[#E5E7EB] rounded text-xs">{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { n: "1", t: "Request comes in", d: "OpenAI-compatible format" },
            { n: "2", t: "Route & optimize", d: "Pick cheapest model that fits" },
            { n: "3", t: "Track & bill", d: "Debit wallet in Naira, log everything" },
          ].map((s) => (
            <div key={s.n} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
              <div className="w-8 h-8 rounded-full bg-white border border-[#00E5A0] flex items-center justify-center font-mono text-xs text-[#00E5A0] mx-auto mb-2">{s.n}</div>
              <div className="text-sm font-medium mb-1">{s.t}</div>
              <div className="text-xs text-[#6B7280]">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  /* 5 - BUSINESS MODEL */
  {
    label: "Business Model",
    title: "Positive unit economics from day one.",
    content: (
      <div className="mt-6 max-w-2xl mx-auto space-y-5">
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-[#00E5A0] mb-4">How money flows</h3>
          <div className="space-y-3 font-mono text-sm">
            {[
              { step: "1", text: "User funds wallet in Naira (prepaid via Paystack)" },
              { step: "2", text: "User makes API request (model='auto', budget='low')" },
              { step: "3", text: "Mazou calls provider using our API keys (post-paid)" },
              { step: "4", text: "Mazou debits user wallet with 15% margin applied" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs text-[#00E5A0] shrink-0">{s.step}</span>
                <span className="text-[#6B7280]">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
            <div className="text-xs uppercase tracking-wider text-[#6B7280] mb-2">Primary Revenue</div>
            <h3 className="font-semibold mb-1">Managed Mode</h3>
            <p className="text-sm text-[#6B7280]">15% margin on all API spend flowing through the platform. Users pay upfront, providers bill monthly.</p>
          </div>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
            <div className="text-xs uppercase tracking-wider text-[#6B7280] mb-2">Secondary Revenue</div>
            <h3 className="font-semibold mb-1">BYOK Mode</h3>
            <p className="text-sm text-[#6B7280]">Platform fee for enterprises using their own API keys. They get routing, analytics, and cost control.</p>
          </div>
        </div>
        <div className="bg-white border border-[#00E5A0] rounded-xl p-5 text-center">
          <span className="text-sm text-[#00E5A0] font-medium">Users pay upfront &rarr; Providers bill monthly &rarr; Positive cash flow from day one</span>
        </div>
      </div>
    ),
  },
  /* 6 - MARKET */
  {
    label: "Market",
    title: "The African AI infrastructure gap.",
    content: (
      <div className="mt-6 max-w-2xl mx-auto space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "TAM", value: "$4.5B", desc: "Africa AI market by 2030 (Frost & Sullivan)" },
            { label: "SAM", value: "$800M", desc: "AI API & infrastructure spend, Sub-Saharan Africa" },
            { label: "SOM", value: "$25M", desc: "Nigeria + Ghana + Kenya, first 3 years" },
          ].map((m) => (
            <div key={m.label} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6 text-center">
              <div className="text-xs font-mono uppercase tracking-wider text-[#6B7280] mb-2">{m.label}</div>
              <div className="font-mono text-3xl font-bold text-[#3B82F6] mb-2">{m.value}</div>
              <p className="text-xs text-[#6B7280]">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="font-semibold text-sm mb-4">Why Africa, why now?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "500K+ developers in Nigeria, growing 50%+ YoY",
              "AI adoption accelerating across fintech, healthtech, agritech",
              "No local-currency AI billing infrastructure exists",
              "African language models emerging but fragmented",
              "Paystack/Flutterwave proved payment rails unlock growth",
              "First mover advantage in defining the category",
            ].map((p) => (
              <div key={p} className="text-sm text-[#6B7280] flex items-start gap-2">
                <span className="text-[#00E5A0] shrink-0"><Circle size={6} className="fill-current" /></span> {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  /* 7 - TRACTION */
  {
    label: "Traction",
    title: "Built. Tested. Ready to launch.",
    content: (
      <div className="mt-6 max-w-2xl mx-auto space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "30", label: "API endpoints" },
            { value: "198", label: "Automated tests" },
            { value: "40+", label: "AI models integrated" },
            { value: "12", label: "Database models" },
          ].map((s) => (
            <div key={s.label} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5 text-center">
              <div className="font-mono text-2xl font-bold text-[#3B82F6] mb-1">{s.value}</div>
              <div className="text-xs text-[#6B7280]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="font-semibold text-sm mb-4">What&apos;s built</h3>
          <div className="space-y-2">
            {[
              "Full gateway: unified API with OpenAI-compatible format",
              "Smart routing engine: budget, complexity, and language-based",
              "Wallet system: atomic debits, Paystack integration, Naira billing",
              "Dashboard: real-time spend tracking, per-feature analytics",
              "Auth + API key management with rate limiting",
              "BYOK (Bring Your Own Keys) mode for enterprises",
              "Cost optimization recommendation engine",
            ].map((item) => (
              <div key={item} className="text-sm text-[#6B7280] flex items-start gap-2">
                <span className="text-[#00E5A0] font-bold shrink-0"><Check size={14} /></span> {item}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#00E5A0] rounded-xl p-5 text-center">
          <span className="text-sm text-[#00E5A0] font-medium">Ready for beta &mdash; just needs provider API accounts and a live Paystack key</span>
        </div>
      </div>
    ),
  },
  /* 8 - COMPETITIVE LANDSCAPE */
  {
    label: "Competition",
    title: "No one owns this space in Africa.",
    content: (
      <div className="mt-6 max-w-3xl mx-auto">
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-px bg-[#E5E7EB]">
            <div className="bg-[#F3F4F6] p-4 text-xs uppercase tracking-wider text-[#6B7280] font-semibold" />
            <div className="bg-[#F3F4F6] p-4 text-xs uppercase tracking-wider text-[#6B7280] font-semibold text-center">Mazou</div>
            <div className="bg-[#F3F4F6] p-4 text-xs uppercase tracking-wider text-[#6B7280] font-semibold text-center">OpenRouter</div>
            <div className="bg-[#F3F4F6] p-4 text-xs uppercase tracking-wider text-[#6B7280] font-semibold text-center">AWS Bedrock</div>
            <div className="bg-[#F3F4F6] p-4 text-xs uppercase tracking-wider text-[#6B7280] font-semibold text-center">Direct APIs</div>
          </div>
          {[
            { feature: "Local currency billing", mazou: true, openrouter: false, aws: false, direct: false },
            { feature: "African language models", mazou: true, openrouter: false, aws: false, direct: false },
            { feature: "Smart cost routing", mazou: true, openrouter: false, aws: false, direct: false },
            { feature: "Per-feature cost tracking", mazou: true, openrouter: false, aws: false, direct: false },
            { feature: "Multi-provider gateway", mazou: true, openrouter: true, aws: true, direct: false },
            { feature: "Paystack integration", mazou: true, openrouter: false, aws: false, direct: false },
            { feature: "BYOK support", mazou: true, openrouter: false, aws: false, direct: false },
          ].map((row) => (
            <div key={row.feature} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-px bg-[#E5E7EB]">
              <div className="bg-[#F9FAFB] p-3 text-sm text-[#6B7280]">{row.feature}</div>
              {[row.mazou, row.openrouter, row.aws, row.direct].map((v, i) => (
                <div key={i} className="bg-[#F9FAFB] p-3 text-center">
                  {v ? <span className="text-[#00E5A0]"><Check size={14} /></span> : <span className="text-[#9CA3AF]"><Minus size={14} /></span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="text-sm text-[#6B7280] text-center mt-5">
          OpenRouter and Bedrock are US-focused. Neither supports local African currencies, African models, or per-feature cost attribution.
        </p>
      </div>
    ),
  },
  /* 9 - MOATS */
  {
    label: "Moats",
    title: "Compounding advantages.",
    content: (
      <div className="mt-6 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { icon: <Wallet size={24} className="text-[#00E5A0]" />, color: "#00E5A0", title: "Payment Infrastructure", desc: "Paystack integration, Naira wallet, African regulatory compliance. Hard to replicate from outside the continent." },
          { icon: <Globe size={24} className="text-[#00E5A0]" />, title: "African Language Routing", color: "#00E5A0", desc: "9+ African language models integrated with specialized routing. Global players don't prioritize this." },
          { icon: <BarChart3 size={24} className="text-[#4D8AFF]" />, title: "Network Effects", color: "#4D8AFF", desc: "More usage = better routing data = smarter model selection = lower costs = more users." },
          { icon: <Plug size={24} className="text-[#A855F7]" />, title: "The Control Plane Lock-In", color: "#A855F7", desc: "As AI agents need wallets, tools, and commerce, they all plug into the same Mazou interface. You can't rip it out." },
        ].map((m) => (
          <div key={m.title} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
            <div className="mb-3">{m.icon}</div>
            <h3 className="font-semibold mb-2">{m.title}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  /* 10 - VISION */
  {
    label: "Vision",
    title: "The roadmap.",
    content: (
      <div className="mt-6 max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#00E5A0] via-[#00E5A0] to-[#4D8AFF]" />
          <div className="space-y-8 pl-16">
            {[
              { phase: "Now", color: "#00E5A0", items: ["Launch beta in Nigeria", "Onboard first 50 teams", "Validate smart routing savings"] },
              { phase: "6 months", color: "#00E5A0", items: ["Expand to Ghana & Kenya", "Agent wallet infrastructure", "Enterprise BYOK tier"] },
              { phase: "12 months", color: "#4D8AFF", items: ["Pan-African coverage", "AI agent commerce layer", "Series A readiness"] },
            ].map((p) => (
              <div key={p.phase} className="relative">
                <div className="absolute -left-[2.65rem] w-5 h-5 rounded-full border-2 bg-white" style={{ borderColor: p.color }} />
                <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: p.color }}>{p.phase}</div>
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5 space-y-2">
                  {p.items.map((item) => (
                    <div key={item} className="text-sm text-[#6B7280] flex items-start gap-2">
                      <span style={{ color: p.color }} className="shrink-0"><Circle size={6} className="fill-current" /></span> {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  /* 11 - THE ASK */
  {
    label: "The Ask",
    title: "Pre-seed: $500K to own AI infrastructure in Africa.",
    content: (
      <div className="mt-6 max-w-2xl mx-auto space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Raising", value: "$500K", desc: "Pre-seed round" },
            { label: "Runway", value: "18 months", desc: "At current burn rate" },
            { label: "Use of funds", value: "Build + Launch", desc: "See breakdown below" },
          ].map((s) => (
            <div key={s.label} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6 text-center">
              <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">{s.label}</div>
              <div className="font-mono text-2xl font-bold text-[#3B82F6] mb-1">{s.value}</div>
              <div className="text-xs text-[#6B7280]">{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="font-semibold text-sm mb-4">Use of Funds</h3>
          <div className="space-y-3">
            {[
              { label: "Engineering & Product", pct: 45, color: "#00E5A0" },
              { label: "Go-to-Market", pct: 25, color: "#00E5A0" },
              { label: "Infrastructure & API Credits", pct: 20, color: "#4D8AFF" },
              { label: "Operations & Legal", pct: 10, color: "#A855F7" },
            ].map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">{f.label}</span>
                  <span className="font-mono" style={{ color: f.color }}>{f.pct}%</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#00E5A0] rounded-xl p-6 text-center">
          <p className="text-lg font-semibold mb-2">Paystack built the payment rails for Africa&apos;s internet economy.</p>
          <p className="text-[#00E5A0] font-semibold">Mazou is building the infrastructure layer for Africa&apos;s AI economy.</p>
        </div>
      </div>
    ),
  },
  /* 12 - CONTACT */
  {
    label: "Contact",
    title: "Let's talk.",
    content: (
      <div className="mt-8 flex flex-col items-center gap-6">
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-8 text-center space-y-4 max-w-sm w-full">
          <div className="text-4xl font-extrabold">
            mazou<span className="text-[#00E5A0]">.</span>
          </div>
          <div className="space-y-2 text-sm text-[#6B7280]">
            <p>team@mazou.ai</p>
            <p>Lagos, Nigeria</p>
          </div>
        </div>
        <p className="text-sm text-[#6B7280]">We&apos;d love to walk you through a live demo.</p>
      </div>
    ),
  },
];

/* -- component ---------------------------------------------------------- */

export default function HubPitchPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === current || animating) return;
      setDirection(idx > current ? "next" : "prev");
      setAnimating(true);
      setTimeout(() => {
        setCurrent(idx);
        setAnimating(false);
      }, 300);
    },
    [current, animating]
  );

  const next = useCallback(() => { if (current < slides.length - 1) goTo(current + 1); }, [current, goTo]);
  const prev = useCallback(() => { if (current > 0) goTo(current - 1); }, [current, goTo]);

  /* keyboard nav */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const slide = slides[current];
  const translateClass = animating
    ? direction === "next"
      ? "translate-x-8 opacity-0"
      : "-translate-x-8 opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Slide area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-5xl mx-auto w-full">
        <div className={`w-full transition-all duration-300 ease-out ${translateClass}`}>
          {/* Slide label */}
          <div className="text-center mb-2">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#00E5A0]">
              {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")} &mdash; {slide.label}
            </span>
          </div>
          {/* Title */}
          <h1
            className="text-center text-[clamp(1.75rem,4vw,3rem)] font-extrabold leading-[1.15] tracking-tight mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            {current === 0 ? (
              <>mazou<span className="text-[#00E5A0]">.</span></>
            ) : (
              slide.title
            )}
          </h1>
          {slide.subtitle && <p className="text-center text-lg text-[#6B7280] mb-2">{slide.subtitle}</p>}
          {/* Content */}
          <div className="mt-2">{slide.content}</div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-gray-200 bg-white/90 backdrop-blur-xl px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Slide dots */}
          <div className="flex gap-1.5 overflow-x-auto">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
                  i === current
                    ? "bg-[#00E5A0] text-[#0A1628]"
                    : "bg-[#F9FAFB] text-[#6B7280] hover:text-[#0A1628] border border-[#E5E7EB]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {/* Arrows */}
          <div className="flex items-center gap-3 ml-4 shrink-0">
            <button
              onClick={prev}
              disabled={current === 0}
              className="w-9 h-9 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#0A1628] disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              disabled={current === slides.length - 1}
              className="w-9 h-9 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#0A1628] disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
