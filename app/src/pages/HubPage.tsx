import { Link } from "react-router";
import { Monitor, FileText, HelpCircle } from "lucide-react";

const sections = [
  {
    href: "/hub/pitch",
    label: "Pitch Deck",
    color: "#00E5A0",
    desc: "13-slide interactive pitch deck with keyboard navigation. Covers problem, solution, business model, market, traction, competition, and the ask.",
    detail: "Arrow keys or click to navigate",
    icon: <Monitor size={32} className="text-[#00E5A0]" />,
  },
  {
    href: "/hub/overview",
    label: "Deep Dive",
    color: "#4D8AFF",
    desc: "Comprehensive document explaining why Mazou exists and how it works. Includes architecture diagrams, routing logic, billing flow, and the Africa thesis.",
    detail: "8 sections with visual diagrams",
    icon: <FileText size={32} className="text-[#4D8AFF]" />,
  },
  {
    href: "/hub/faq",
    label: "Investor FAQ",
    color: "#00E5A0",
    desc: "26 questions across 5 categories: product & market, business model, technology, competition & moats, and fundraise & vision.",
    detail: "Expand/collapse accordion format",
    icon: <HelpCircle size={32} className="text-[#00E5A0]" />,
  },
];

export default function HubPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00E5A0] mb-4">Investor Hub</div>
        <h1
          className="text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[1.1] tracking-tight mb-4"
          style={{ letterSpacing: "-0.03em" }}
        >
          mazou<span className="text-[#00E5A0]">.</span>
        </h1>
        <p className="text-lg text-[#6B7280] max-w-md mx-auto leading-relaxed">
          AI infrastructure layer for Africa. Everything you need to understand the opportunity.
        </p>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16 animate-in-stagger">
        {sections.map((s) => (
          <Link
            key={s.href}
            to={s.href}
            className="group bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6 hover:border-[#6B7280] hover-lift transition-all"
            style={{}}
          >
            <div className="mb-4">{s.icon}</div>
            <h2 className="text-lg font-bold mb-2 group-hover:text-[#0A1628] transition-colors" style={{ color: s.color }}>
              {s.label}
            </h2>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-3">{s.desc}</p>
            <div className="font-mono text-xs text-[#9CA3AF]">{s.detail}</div>
          </Link>
        ))}
      </div>

      {/* Quick stats */}
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-8 mb-16">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B7280] mb-6 text-center">At a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "40+", label: "AI models accessible", color: "#3B82F6" },
            { value: "15-40%", label: "Cost savings via smart routing", color: "#00E5A0" },
            { value: "198", label: "Automated tests passing", color: "#4D8AFF" },
            { value: "$500K", label: "Pre-seed raise", color: "#A855F7" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-mono text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#6B7280]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* One-liner */}
      <div className="text-center">
        <div className="w-16 h-0.5 bg-[#00E5A0] mx-auto mb-6" />
        <p className="text-xl font-semibold leading-relaxed max-w-lg mx-auto">
          Paystack built the payment rails for Africa&apos;s internet economy.
        </p>
        <p className="text-xl font-semibold text-[#00E5A0] leading-relaxed max-w-lg mx-auto mt-2">
          Mazou is building the infrastructure layer for Africa&apos;s AI economy.
        </p>
        <div className="w-16 h-0.5 bg-[#00E5A0] mx-auto mt-6" />
        <div className="mt-8">
          <a href="mailto:team@mazou.ai" className="text-sm text-[#6B7280] hover:text-[#0A1628] transition-colors">
            team@mazou.ai &middot; Lagos, Nigeria
          </a>
        </div>
      </div>
    </div>
  );
}
