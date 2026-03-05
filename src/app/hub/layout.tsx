"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const hubNav = [
  { label: "Hub", href: "/hub" },
  { label: "Pitch Deck", href: "/hub/pitch" },
  { label: "Overview", href: "/hub/overview" },
  { label: "FAQ", href: "/hub/faq" },
];

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="bg-[#0A0A0C] text-[#E8E8ED] font-sans min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 md:px-8 py-4 flex items-center justify-between bg-[rgba(10,10,12,0.9)] backdrop-blur-xl border-b border-[#222228]">
        <Link href="/" className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
          mazou<span className="text-[#00D26A]">.</span>
        </Link>
        <div className="flex items-center gap-1 bg-[#111114] border border-[#222228] rounded-lg p-1">
          {hubNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#1C1C26] text-[#E8E8ED]"
                    : "text-[#8888A0] hover:text-[#E8E8ED]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/login"
          className="bg-[#00A854] text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[#00D26A] transition-all"
        >
          Sign In
        </Link>
      </nav>
      <main className="pt-20">{children}</main>
    </div>
  );
}
