"use client";

import Link from "next/link";

const sections = [
  {
    href: "/hub/pitch",
    label: "Pitch Deck",
    color: "#00D26A",
    desc: "13-slide interactive pitch deck with keyboard navigation. Covers problem, solution, business model, market, traction, competition, and the ask.",
    detail: "Arrow keys or click to navigate",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D26A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
      </svg>
    ),
  },
  {
    href: "/hub/overview",
    label: "Deep Dive",
    color: "#4D8AFF",
    desc: "Comprehensive document explaining why Mazou exists and how it works. Includes architecture diagrams, routing logic, billing flow, and the Africa thesis.",
    detail: "8 sections with visual diagrams",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4D8AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: "/hub/faq",
    label: "Investor FAQ",
    color: "#FFB800",
    desc: "26 questions across 5 categories: product & market, business model, technology, competition & moats, and fundraise & vision.",
    detail: "Expand/collapse accordion format",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function HubPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">Investor Hub</div>
        <h1
          className="text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[1.1] tracking-tight mb-4"
          style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.03em" }}
        >
          mazou<span className="text-[#00D26A]">.</span>
        </h1>
        <p className="text-lg text-[#8888A0] max-w-md mx-auto leading-relaxed">
          AI infrastructure layer for Africa. Everything you need to understand the opportunity.
        </p>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group bg-[#111114] border border-[#222228] rounded-xl p-6 hover:border-[#8888A0] transition-all hover:-translate-y-1"
            style={{ borderTopColor: s.color, borderTopWidth: 3 }}
          >
            <div className="mb-4">{s.icon}</div>
            <h2 className="text-lg font-bold mb-2 group-hover:text-white transition-colors" style={{ color: s.color }}>
              {s.label}
            </h2>
            <p className="text-sm text-[#8888A0] leading-relaxed mb-3">{s.desc}</p>
            <div className="font-mono text-xs text-[#555566]">{s.detail}</div>
          </Link>
        ))}
      </div>

      {/* Quick stats */}
      <div className="bg-[#111114] border border-[#222228] rounded-xl p-8 mb-16">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888A0] mb-6 text-center">At a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "40+", label: "AI models accessible", color: "#00D26A" },
            { value: "15-40%", label: "Cost savings via smart routing", color: "#FFB800" },
            { value: "198", label: "Automated tests passing", color: "#4D8AFF" },
            { value: "$500K", label: "Pre-seed raise", color: "#A855F7" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-mono text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8888A0]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* One-liner */}
      <div className="text-center">
        <div className="w-16 h-0.5 bg-[#00D26A] mx-auto mb-6" />
        <p className="text-xl font-semibold leading-relaxed max-w-lg mx-auto">
          Paystack built the payment rails for Africa&apos;s internet economy.
        </p>
        <p className="text-xl font-semibold text-[#00D26A] leading-relaxed max-w-lg mx-auto mt-2">
          Mazou is building the infrastructure layer for Africa&apos;s AI economy.
        </p>
        <div className="w-16 h-0.5 bg-[#00D26A] mx-auto mt-6" />
        <div className="mt-8">
          <a href="mailto:team@mazou.ai" className="text-sm text-[#8888A0] hover:text-[#E8E8ED] transition-colors">
            team@mazou.ai &middot; Lagos, Nigeria
          </a>
        </div>
      </div>
    </div>
  );
}
