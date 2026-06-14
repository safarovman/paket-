"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  { href: "/marketplace", label: "Bozor",    icon: "🏪" },
  { href: "/sell",        label: "Sotish",   icon: "💰" },
  { href: "/rent",        label: "Ijara",    icon: "🔄" },
  { href: "/boosting",    label: "Boosting", icon: "🚀" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [balance] = useState(0); // Keyinchalik Supabase dan keladi

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAuth = pathname === "/login" || pathname === "/register";

  return (
    <header className={clsx(
      "sticky top-0 z-50 transition-all duration-300",
      scrolled ? "bg-[#0E0E0E]/95 backdrop-blur-md border-b border-[#2A2A2A]" : "bg-[#0E0E0E]"
    )}>
      <div className="gsection">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-orange-gradient flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
              <span className="text-white font-black text-lg">G</span>
            </div>
            <span className="font-black text-xl text-gradient">GBoost</span>
          </Link>

          {/* Desktop nav */}
          {!isAuth && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(n => (
                <Link key={n.href} href={n.href}
                  className={clsx(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    pathname === n.href || pathname.startsWith(n.href + "/")
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}>
                  {n.icon} {n.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuth ? (
              <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                ← Bosh sahifa
              </Link>
            ) : (
              <>
                {/* Balance */}
                <Link href="/wallet"
                  className="hidden sm:flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 hover:border-orange-500/30 transition-all">
                  <span className="text-orange-400 font-bold text-sm">{balance.toLocaleString()} so'm</span>
                  <span className="text-xs text-gray-500">+</span>
                </Link>

                {/* Profile */}
                <Link href="/profile"
                  className="w-9 h-9 rounded-xl bg-orange-gradient flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform">
                  A
                </Link>

                {/* Mobile menu */}
                <button onClick={() => setOpen(!open)}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400">
                  {open ? "✕" : "☰"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {!isAuth && open && (
          <div className="md:hidden border-t border-[#2A2A2A] py-3 space-y-1 animate-fade-in">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className={clsx("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  pathname === n.href ? "bg-orange-500/15 text-orange-400" : "text-gray-400 hover:text-white hover:bg-white/5")}>
                {n.icon} {n.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#2A2A2A] mt-2">
              <Link href="/wallet" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-400 font-semibold">
                💰 Balans: {balance.toLocaleString()} so'm
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
