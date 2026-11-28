"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { som } from "@/lib/uzdrop";

const NAV = [
  { href: "/market", label: "Akkauntlar", icon: "🛒" },
  { href: "/auction", label: "Auksion", icon: "🔨" },
  { href: "/sell",   label: "Sotish",     icon: "💰" },
  { href: "/wallet", label: "Balans",     icon: "💳" },
  { href: "/orders", label: "Arizalar",   icon: "📥" },
  { href: "/case",   label: "Spin",       icon: "🎰", soon: true },
];

export default function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const { user, profile } = useUser();
  const [menu, setMenu] = useState(false);

  const logout = async () => { await supabase.auth.signOut(); setMenu(false); router.push("/"); };
  const active = (href: string) => path.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur border-b border-line">
      <div className="wrap flex items-center h-16 gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-[#DC2626] grid place-items-center font-black text-[#1B1400] text-lg rotate-[-6deg]">U</span>
          <span className="font-black text-xl tracking-tight">Uz<span className="text-accent">Drop</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className={clsx("px-3.5 py-2 rounded-lg text-[13px] font-extrabold uppercase tracking-wide transition-colors",
                active(n.href) ? "text-accent bg-accent/10" : "text-muted hover:text-white")}>
              <span className="mr-1">{n.icon}</span>{n.label}
              {n.soon && <span className="ml-1.5 chip bg-accent/15 text-accent !text-[9px] !px-1.5">Tez kunda</span>}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" title="Sizning ID raqamingiz"
                className="hidden sm:flex flex-col items-end leading-tight px-2">
                <span className="text-[10px] font-bold uppercase text-muted">ID</span>
                <span className="text-sm font-black text-accent">{profile?.public_id ?? "…"}</span>
              </Link>
              <Link href="/wallet" className="flex items-center rounded-xl bg-panel border border-line overflow-hidden">
                <span className="px-3 py-2 text-sm font-extrabold text-accent whitespace-nowrap">{som(profile?.balance)}</span>
                <span className="bg-accent text-[#1B1400] w-9 h-9 grid place-items-center font-black text-lg">+</span>
              </Link>
              <div className="relative">
                <button onClick={() => setMenu(!menu)}
                  className="w-10 h-10 rounded-xl bg-violet grid place-items-center font-black uppercase">
                  {(profile?.username || user.email || "?")[0]}
                </button>
                {menu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-56 panel p-1.5 shadow-2xl animate-fade-in">
                      <p className="px-3 pt-2 text-sm font-bold truncate">{profile?.username || user.email}</p>
                      <p className="px-3 pb-2 text-xs text-muted">ID: <b className="text-accent">{profile?.public_id ?? "—"}</b></p>
                      {[
                        { href: "/profile", l: "🎒 Inventar va profil" },
                        { href: "/wallet",  l: "💳 Balans" },
                      ].map(i => (
                        <Link key={i.href} href={i.href} onClick={() => setMenu(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-panel2">{i.l}</Link>
                      ))}
                      <button onClick={logout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-lose hover:bg-lose/10">🚪 Chiqish</button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link href="/login" className="btn-accent !py-2.5">Kirish</Link>
          )}
        </div>
      </div>

      {/* Mobil pastki menyu */}
      <nav className="md:hidden flex border-t border-line">
        {NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={clsx("flex-1 py-2 text-center text-[10px] font-extrabold uppercase",
              active(n.href) ? "text-accent" : "text-muted")}>
            <div className="text-base leading-none mb-0.5">{n.icon}</div>{n.label}{n.soon && <span className="block text-[8px] text-accent">tez kunda</span>}
          </Link>
        ))}
      </nav>
    </header>
  );
}
