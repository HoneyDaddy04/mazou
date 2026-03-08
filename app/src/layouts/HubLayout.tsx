import { Link, Outlet, useLocation } from "react-router";

const hubNav = [
  { label: "Hub", href: "/hub" },
  { label: "Pitch Deck", href: "/hub/pitch" },
  { label: "Overview", href: "/hub/overview" },
  { label: "FAQ", href: "/hub/faq" },
];

export default function HubLayout() {
  const { pathname } = useLocation();

  return (
    <div className="bg-white text-[#0A1628] font-sans min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 md:px-8 py-4 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-gray-200">
        <Link to="/" className="text-2xl font-extrabold tracking-tight">
          mazou<span className="text-[#00E5A0]">.</span>
        </Link>
        <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
          {hubNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-[#6B7280] hover:text-[#0A1628]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <Link
          to="/login"
          className="bg-[#00E5A0] text-[#0A1628] px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[#00cc8e] transition-all"
        >
          Sign In
        </Link>
      </nav>
      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
}
