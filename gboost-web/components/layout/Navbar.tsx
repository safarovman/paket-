"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";

const NAV = [
  { href: "/marketplace", label: "Bozor",    icon: "🏪" },
  { href: "/sell",        label: "Sotish",   icon: "💰" },
  { href: "/rent",        label: "Ijara",    icon: "🔄" },
  { href: "/boosting",    label: "Boosting", icon: "🚀" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser]         = useState<any>(null);
  const [balance]               = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Foydalanuvchini tekshirish
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Auth holati o'zgarganda yangilash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowDropdown(false);
    router.push("/");
  };

  const isAuth = pathname === "/login" || pathname === "/register";
  const userName = user?.user_metadata?.full_name ||
                   user?.user_metadata?.name ||
                   user?.email?.split("@")[0] || "";
  const userAvatar = userName?.[0]?.toUpperCase() || "?";

  return (
    <header className={clsx(
      "sticky top-0 z-50 transition-all duration-300",
      scrolled
        ? "bg-[#0E0E0E]/95 backdrop-blur-md border-b border-[#2A2A2A]"
        : "bg-[#0E0E0E] border-b border-[#1A1A1A]"
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

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuth ? (
              <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                ← Bosh sahifa
              </Link>
            ) : user ? (
              // ─── Kirgan foydalanuvchi ───
              <>
                {/* Balans */}
                <Link href="/wallet"
                  className="hidden sm:flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-orange-500/30 rounded-xl px-3 py-2 transition-all">
                  <span className="text-orange-400 font-bold text-sm">{balance.toLocaleString()} so'm</span>
                  <span className="text-orange-400 text-xs font-bold">+</span>
                </Link>

                {/* Avatar + Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-9 h-9 rounded-xl bg-orange-gradient flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform">
                    {userAvatar}
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-12 w-56 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-[#2A2A2A]">
                        <p className="text-white font-bold text-sm truncate">{userName}</p>
                        <p className="text-gray-500 text-xs truncate">{user.email}</p>
                      </div>
                      {/* Menu items */}
                      {[
                        { href:"/dashboard", icon:"📊", label:"Dashboard" },
                        { href:"/wallet",    icon:"💰", label:"Hamyon" },
                        { href:"/profile",   icon:"👤", label:"Profil" },
                      ].map(item => (
                        <Link key={item.href} href={item.href}
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                      <div className="border-t border-[#2A2A2A]">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all">
                          <span>🚪</span>
                          <span>Chiqish</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Backdrop */}
                  {showDropdown && (
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  )}
                </div>

                {/* Mobile menu btn */}
                <button onClick={() => setOpen(!open)}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400">
                  {open ? "✕" : "☰"}
                </button>
              </>
            ) : (
              // ─── Kirmagan foydalanuvchi ───
              <>
                <Link href="/login"
                  className="hidden sm:flex text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all">
                  Kirish
                </Link>
                <Link href="/register"
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-lg">
                  Ro'yxat
                </Link>
                {/* Mobile */}
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
                  pathname === n.href
                    ? "bg-orange-500/15 text-orange-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5")}>
                {n.icon} {n.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-[#2A2A2A] mt-1 space-y-1">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                    📊 Dashboard
                  </Link>
                  <Link href="/wallet" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-400 font-semibold">
                    💰 Balans: {balance.toLocaleString()} so'm
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    🚪 Chiqish
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                    🔐 Kirish
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-400 font-bold">
                    ✨ Ro'yxatdan o'tish
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
