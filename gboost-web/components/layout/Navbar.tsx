"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/dashboard",   label: "Dashboard",  icon: "🏠" },
  { href: "/boosting",    label: "Boosting",   icon: "⚔️" },
  { href: "/marketplace", label: "Bozor",      icon: "🏪" },
  { href: "/escrow",      label: "Escrow",     icon: "🛡️" },
  { href: "/karma",       label: "Karma",      icon: "⭐" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuth = pathname === "/login" || pathname === "/register" || pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-navy/90 backdrop-blur-md">
      <div className="gsection">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-cyan group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-lg">G</span>
            </div>
            <span className="font-black text-xl text-shimmer">GBoost</span>
          </Link>

          {/* Desktop nav */}
          {!isAuth && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                    pathname === link.href
                      ? "bg-cyan/10 text-cyan border border-cyan/30"
                      : "text-text-gray hover:text-text-light hover:bg-card"
                  )}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuth ? (
              <>
                <Link href="/login" className="text-sm text-text-gray hover:text-cyan transition-colors px-3 py-2">
                  Kirish
                </Link>
                <Link href="/register" className="gbtn-primary text-sm px-4 py-2 rounded-xl">
                  Boshlash
                </Link>
              </>
            ) : (
              <>
                {/* Notification */}
                <button className="relative p-2 rounded-xl hover:bg-card transition-colors">
                  <span className="text-xl">🔔</span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red rounded-full" />
                </button>
                {/* Avatar */}
                <Link href="/profile" className={clsx(
                  "w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform",
                  pathname === "/profile" && "ring-2 ring-cyan ring-offset-2 ring-offset-navy"
                )}>
                  A
                </Link>
                {/* Mobile hamburger */}
                <button
                  className="md:hidden p-2 rounded-xl hover:bg-card text-text-gray"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? "✕" : "☰"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {!isAuth && mobileOpen && (
          <div className="md:hidden border-t border-border py-3 flex flex-col gap-1 animate-fade-in">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-cyan/10 text-cyan"
                    : "text-text-gray hover:text-text-light hover:bg-card"
                )}
              >
                <span>{link.icon}</span>{link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border mt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-gray hover:text-red transition-colors rounded-xl hover:bg-card">
                🚪 Chiqish
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
