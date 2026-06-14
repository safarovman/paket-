"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
  superOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard",  icon: "📊", label: "Dashboard"         },
  { href: "/orders",     icon: "📦", label: "Buyurtmalar",  badge: 5  },
  { href: "/complaints", icon: "⚠️", label: "Shikoyatlar",  badge: 3  },
  { href: "/users",      icon: "👥", label: "Foydalanuvchilar"   },
  { href: "/listings",   icon: "🏪", label: "Akkaunt e'lonlari", badge: 4 },
  { href: "/payments",   icon: "💰", label: "To'lovlar"          },
  { href: "/admins",     icon: "🛡️", label: "Adminlar",  superOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [session, setSession] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("gboost_admin_session");
    if (!s) { router.push("/login"); return; }
    const parsed = JSON.parse(s);
    // Session 8 soat
    if (Date.now() - parsed.loginTime > 8 * 60 * 60 * 1000) {
      localStorage.removeItem("gboost_admin_session");
      router.push("/login");
      return;
    }
    setSession(parsed);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("gboost_admin_session");
    router.push("/login");
  };

  const visibleNav = NAV.filter(n => !n.superOnly || session?.role === "superadmin");

  return (
    <aside className={clsx(
      "h-screen sticky top-0 flex flex-col bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center shrink-0">
              <span className="text-white font-black text-sm">G</span>
            </div>
            <div>
              <p className="font-black text-sm text-white leading-none">GBoost</p>
              <p className="text-cyan text-xs">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center mx-auto">
            <span className="text-white font-black text-sm">G</span>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-text-gray hover:text-white transition-colors text-sm">◀</button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="p-3 text-text-gray hover:text-white transition-colors text-center">▶</button>
      )}

      {/* Admin info */}
      {!collapsed && session && (
        <div className="p-3 mx-3 mt-3 rounded-xl bg-bg border border-border">
          <div className="flex items-center gap-2.5">
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0",
              session.role === "superadmin" ? "bg-gradient-to-br from-gold to-orange" : "bg-gradient-to-br from-purple to-cyan"
            )}>
              {session.name?.[0] || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{session.name}</p>
              <span className={clsx("text-xs font-bold px-1.5 py-0.5 rounded-full",
                session.role === "superadmin"
                  ? "bg-gold/20 text-gold"
                  : "bg-cyan/20 text-cyan"
              )}>
                {session.role === "superadmin" ? "👑 Super Admin" : "🛡️ Admin"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
        {visibleNav.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
                isActive
                  ? "bg-gradient-to-r from-purple/30 to-cyan/10 border border-cyan/20 text-white"
                  : "text-text-gray hover:bg-bg hover:text-text-light"
              )}>
                <span className="text-lg shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button onClick={handleLogout}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-gray hover:bg-red/10 hover:text-red transition-all",
            collapsed && "justify-center"
          )}>
          <span className="text-lg">🚪</span>
          {!collapsed && <span className="text-sm font-medium">Chiqish</span>}
        </button>
      </div>
    </aside>
  );
}
