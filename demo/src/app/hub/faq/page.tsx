"use client";

import { useState } from "react";

/* ── FAQ data ───────────────────────────────────────────────── */

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  color: string;
  items: FaqItem[];
}

const faqSections: FaqSection[] = [
  {
    title: "Product & Market",
    color: "#00D26A",
    items: [
      {
        q: "What is Mazou in one sentence?",
        a: "Mazou is a unified AI gateway that gives African developers one API for every AI model, billing in local currency, smart cost routing, and full spend visibility.",
      },
      {
        q: "Who is the target customer?",
        a: "Any team building with AI in Africa — startups embedding AI features, enterprises managing multi-model strategies, and individual developers building side projects. Our initial focus is Nigerian tech companies (fintech, SaaS, healthtech) with 5-50 developers.",
      },
      {
        q: "Why can't developers just use OpenAI directly?",
        a: "Three reasons: (1) Payment — OpenAI, Anthropic, and Google require USD credit cards that most African developers don't have, and those who do face 3-5% FX fees plus currency volatility. (2) Fragmentation — using multiple providers means multiple accounts, keys, dashboards, and invoices. (3) Visibility — no existing tool tells you what each feature or agent is costing in local currency.",
      },
      {
        q: "How is this different from OpenRouter?",
        a: "OpenRouter is a US-focused multi-model gateway. It doesn't support local African currencies, doesn't integrate African language models, doesn't offer per-feature cost tracking, and doesn't integrate with Paystack. We share the 'unified gateway' concept but solve fundamentally different problems for different markets.",
      },
      {
        q: "What about AWS Bedrock or Azure OpenAI?",
        a: "Both are USD-only, require enterprise cloud accounts, and don't support African language models or local payment methods. They also don't provide per-feature cost attribution or smart cost-based routing. They're great for US enterprises — we're built for Africa.",
      },
      {
        q: "Why focus on Africa specifically?",
        a: "Africa has 500K+ developers in Nigeria alone (growing 50%+ YoY), rapid AI adoption across fintech and healthtech, and zero local-currency AI infrastructure. The same pattern that made Paystack necessary for payments makes Mazou necessary for AI. Plus, African language model support is something only a local player will prioritize.",
      },
    ],
  },
  {
    title: "Business Model & Revenue",
    color: "#FFB800",
    items: [
      {
        q: "How does Mazou make money?",
        a: "Primary revenue: 15% margin on all API spend flowing through the platform (Managed Mode). Secondary: platform fees from enterprises using their own API keys (BYOK Mode). We convert provider USD costs to Naira and add our margin. Users pay upfront via prepaid wallet, providers bill us monthly — positive cash flow from day one.",
      },
      {
        q: "What are the unit economics?",
        a: "Example: Provider charges us $0.01/request. At 1,580 NGN/USD, that's 15.80 NGN. With 15% margin, user pays 18.17 NGN (1,817 kobo). Gross profit: 2.37 NGN/request. At 1M requests/day, that's 2.37M NGN/day (~$1,500/day). Margins improve with volume as we negotiate better provider rates.",
      },
      {
        q: "Is 15% margin sustainable?",
        a: "Yes. For context, Paystack charges 1.5% + NGN 100 per transaction. Payment processing has thin margins but massive volume. Our 15% margin is justified because we add significant value: smart routing (saves users 15-40%), per-feature analytics, African model access, and local currency billing. Users net-save money even after our margin.",
      },
      {
        q: "What's the BYOK (Bring Your Own Keys) model?",
        a: "Enterprise customers with existing provider contracts can plug in their own API keys but still get Mazou's routing, analytics, and cost control layer. They pay a monthly platform fee or per-request fee instead of the 15% margin. This captures customers who already have USD billing sorted but need visibility and optimization.",
      },
      {
        q: "What's the path to $1M ARR?",
        a: "50 teams spending an average of NGN 1.67M/month on AI (roughly $1,000/month). With our 15% take rate, that's $150/team/month = $90K ARR from 50 teams. Scale to 200 teams averaging $2,000/month spend = $1.44M ARR. Nigeria alone has thousands of companies already using AI APIs.",
      },
    ],
  },
  {
    title: "Technology & Product",
    color: "#4D8AFF",
    items: [
      {
        q: "How does the smart routing engine work?",
        a: "Three routing strategies: (1) Budget-based — set 'low', 'balanced', or 'quality' and we pick the cheapest model that meets the quality bar. (2) Complexity-based — analyze request complexity and route simple queries to cheap models, complex ones to frontier. (3) Language-based — detect African languages and route to specialized models. All strategies use fallback chains for reliability.",
      },
      {
        q: "What does 'OpenAI-compatible' mean?",
        a: "Our API endpoint accepts the exact same request format as OpenAI's /v1/chat/completions. Any code that works with the OpenAI SDK works with Mazou by changing two lines: the base URL and the API key. Zero refactoring needed. This is the standard that OpenRouter, LiteLLM, and most gateways follow.",
      },
      {
        q: "How do you handle financial transactions safely?",
        a: "All money is stored as integers in kobo (100 kobo = 1 Naira) — never floats, preventing rounding errors. Wallet debits use atomic SQL: 'UPDATE wallets SET balance = balance - cost WHERE balance >= cost'. This single statement prevents race conditions, overdrafts, and double-spending. Payment webhooks are verified with HMAC-SHA512.",
      },
      {
        q: "What's the latency overhead?",
        a: "Sub-50ms on top of the provider's response time. The bulk of latency is the provider's model inference (typically 500ms-30s depending on model and tokens). Our routing decision, authentication, and billing happen in parallel or take negligible time compared to the model call.",
      },
      {
        q: "How mature is the product?",
        a: "The backend has 30 API endpoints, 12 database models, and 198 automated tests. The frontend has 15 pages including a full analytics dashboard. We support 40+ models through LiteLLM. The core infrastructure is built and tested — we need provider API accounts and a live Paystack key to launch beta.",
      },
      {
        q: "What about security?",
        a: "JWT authentication in httpOnly cookies (XSS-resistant). API keys are SHA-256 hashed with 5-minute cache. BYOK keys are encrypted with AES-256-GCM. All payment webhooks verified with HMAC-SHA512. Test mode keys skip wallet debits but still log usage for debugging.",
      },
    ],
  },
  {
    title: "Competition & Moats",
    color: "#A855F7",
    items: [
      {
        q: "What stops OpenRouter from adding Naira billing?",
        a: "Three things: (1) Paystack integration and African regulatory compliance require local expertise and entity. (2) African language model relationships and routing optimization aren't on their roadmap — it's a niche market for them. (3) Per-feature cost attribution is a fundamentally different product vision than what they offer.",
      },
      {
        q: "What if OpenAI starts accepting Naira?",
        a: "Even if they do, Mazou still provides: multi-model access (why lock into one provider?), smart routing across providers, per-feature cost tracking, and African model access. OpenAI accepting Naira would actually validate the market and drive more AI adoption — which benefits us.",
      },
      {
        q: "What are the moats?",
        a: "Four compounding advantages: (1) Payment infrastructure — Paystack integration, local currency compliance, African banking relationships. (2) African language routing data — more usage = smarter routing. (3) Network effects — more users = better model selection data = lower costs. (4) Control plane lock-in — as AI agents need wallets, tools, and commerce, they all plug into Mazou. You can't rip it out.",
      },
      {
        q: "Could a large African tech company build this?",
        a: "Possible but unlikely. Paystack, Flutterwave, and similar companies are focused on payments. Building an AI gateway requires deep ML infrastructure knowledge AND payment expertise. It's a different discipline. The most likely threat is an OpenRouter-like company partnering with a local payment provider — but that partnership model is slower than a purpose-built solution.",
      },
    ],
  },
  {
    title: "Fundraise & Vision",
    color: "#00D26A",
    items: [
      {
        q: "How much are you raising?",
        a: "We're raising $500K in a pre-seed round. This gives us 18 months of runway to launch beta, onboard the first 50 teams, validate the smart routing savings thesis, and demonstrate product-market fit.",
      },
      {
        q: "How will the funds be used?",
        a: "45% Engineering & Product (hire 2 engineers, product iteration). 25% Go-to-Market (developer relations, content, first customer acquisition). 20% Infrastructure & API Credits (server costs, provider API credits to seed the platform). 10% Operations & Legal (company registration, compliance, accounting).",
      },
      {
        q: "What are the key milestones for the next 12 months?",
        a: "0-6 months: Launch beta in Nigeria, onboard 50 teams, validate 15-40% cost savings claim, achieve NGN 10M monthly GMV. 6-12 months: Expand to Ghana & Kenya, build agent wallet infrastructure, launch enterprise BYOK tier, reach NGN 50M monthly GMV.",
      },
      {
        q: "What's the long-term vision?",
        a: "Mazou becomes the default AI infrastructure layer for Africa. Every AI-powered product on the continent runs through us — not because we lock them in, but because we make it cheaper, easier, and more visible. As AI agents become autonomous (with their own wallets, tools, and commerce), Mazou is the control plane they all plug into.",
      },
      {
        q: "What are the biggest risks?",
        a: "Three main risks: (1) Provider pricing volatility — mitigated by real-time pricing updates and margin buffer. (2) FX volatility — mitigated by prepaid wallet model (we collect before we pay) and frequent rate updates. (3) Slow developer adoption — mitigated by the zero-code-change integration (just swap the base URL).",
      },
      {
        q: "Why invest now?",
        a: "AI spend in Africa is at an inflection point — growing fast but with zero dedicated infrastructure. The product is built (30 endpoints, 198 tests, 40+ models). We need capital to launch and acquire customers. First-mover advantage in defining the 'AI infrastructure layer for Africa' category is significant. The Paystack analogy isn't just marketing — it's the actual playbook.",
      },
    ],
  },
];

/* ── accordion item ─────────────────────────────────────────── */

function FaqAccordion({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#222228] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className={`text-sm font-medium transition-colors ${isOpen ? "text-[#E8E8ED]" : "text-[#8888A0] group-hover:text-[#E8E8ED]"}`}>
          {item.q}
        </span>
        <span className={`text-lg shrink-0 transition-transform duration-200 ${isOpen ? "rotate-45 text-[#00D26A]" : "text-[#8888A0]"}`}>
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? "500px" : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <p className="text-sm text-[#8888A0] leading-relaxed pb-5 pr-8">{item.a}</p>
      </div>
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────── */

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    faqSections.forEach((sec) => sec.items.forEach((item) => all.add(`${sec.title}-${item.q}`)));
    setOpenItems(all);
  };

  const collapseAll = () => setOpenItems(new Set());

  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[#00D26A] mb-4">Investor FAQ</div>
        <h1
          className="text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.1] tracking-tight mb-4"
          style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.03em" }}
        >
          Frequently Asked Questions
        </h1>
        <p className="text-base text-[#8888A0] max-w-lg mx-auto mb-6">
          Everything investors and partners typically ask about Mazou — product, business model, technology, competition, and vision.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={expandAll}
            className="px-4 py-2 text-xs font-medium text-[#8888A0] bg-[#111114] border border-[#222228] rounded-lg hover:text-[#E8E8ED] transition-all"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 text-xs font-medium text-[#8888A0] bg-[#111114] border border-[#222228] rounded-lg hover:text-[#E8E8ED] transition-all"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* FAQ sections */}
      <div className="space-y-10">
        {faqSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: section.color }} />
              <h2 className="text-lg font-bold" style={{ color: section.color }}>{section.title}</h2>
              <span className="font-mono text-xs text-[#8888A0]">({section.items.length})</span>
            </div>
            <div className="bg-[#111114] border border-[#222228] rounded-xl px-6">
              {section.items.map((item) => {
                const key = `${section.title}-${item.q}`;
                return (
                  <FaqAccordion
                    key={key}
                    item={item}
                    isOpen={openItems.has(key)}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="text-center py-16 mt-8 border-t border-[#222228]">
        <p className="text-lg font-semibold mb-2">Have more questions?</p>
        <p className="text-sm text-[#8888A0] mb-6">We&apos;d love to walk you through a live demo.</p>
        <div className="flex gap-4 justify-center">
          <a href="mailto:team@mazou.ai" className="bg-[#00A854] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#00D26A] transition-all">
            Contact Us
          </a>
          <a href="/hub/pitch" className="bg-[#111114] border border-[#222228] text-[#E8E8ED] px-6 py-3 rounded-lg font-semibold text-sm hover:border-[#8888A0] transition-all">
            View Pitch Deck
          </a>
        </div>
      </div>
    </div>
  );
}
