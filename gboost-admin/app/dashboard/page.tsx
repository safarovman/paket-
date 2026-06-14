"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import { STATS, MOCK_ORDERS, MOCK_COMPLAINTS, MOCK_PAYMENTS, formatPrice } from "@/lib/db";

const formatPrice2 = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [time, setTime]       = useState(new Date());

  useEffect(() => {
    const s = localStorage.getItem("gboost_admin_session");
    if (s) setSession(JSON.parse(s));
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pendingOrders    = MOCK_ORDERS.filter(o => o.status === "pending").length;
  const disputedOrders   = MOCK_ORDERS.filter(o => o.status === "disputed").length;
  const newComplaints    = MOCK_COMPLAINTS.filter(c => c.status === "new").length;
  const frozenPayments   = MOCK_PAYMENTS.filter(p => p.status === "frozen").length;
  const frozenTotal      = MOCK_PAYMENTS.filter(p => p.status === "frozen").reduce((s, p) => s + p.amount, 0);

  const STAT_CARDS = [
    { label:"Jami foydalanuvchilar", value: STATS.totalUsers.toLocaleString(),    icon:"👥", color:"text-cyan",   bg:"bg-cyan/10",   border:"border-cyan/20",   href:"/users"      },
    { label:"Faol foydalanuvchilar", value: STATS.activeUsers.toLocaleString(),   icon:"🟢", color:"text-green",  bg:"bg-green/10",  border:"border-green/20",  href:"/users"      },
    { label:"Jami buyurtmalar",      value: STATS.totalOrders.toLocaleString(),   icon:"📦", color:"text-purple", bg:"bg-purple/10", border:"border-purple/20", href:"/orders"     },
    { label:"Kutilayotgan buyurtma", value: pendingOrders.toString(),             icon:"⏳", color:"text-gold",   bg:"bg-gold/10",   border:"border-gold/20",   href:"/orders"     },
    { label:"Jami daromad",          value: formatPrice2(STATS.totalRevenue)+" so'm", icon:"💰", color:"text-green", bg:"bg-green/10", border:"border-green/20", href:"/payments"  },
    { label:"Muzlatilgan mablag'",   value: formatPrice2(frozenTotal)+" so'm",    icon:"🔒", color:"text-orange", bg:"bg-orange/10", border:"border-orange/20", href:"/payments"   },
    { label:"Ochiq shikoyatlar",     value: newComplaints.toString(),             icon:"⚠️", color:"text-red",    bg:"bg-red/10",    border:"border-red/20",    href:"/complaints" },
    { label:"Tasdiq kutayotgan e'lon",value:STATS.pendingListings.toString(),     icon:"🏪", color:"text-cyan",   bg:"bg-cyan/10",   border:"border-cyan/20",   href:"/listings"   },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">
            Xush kelibsiz, {session?.role === "superadmin" ? "👑" : "🛡️"} {session?.name}!
          </h1>
          <p className="text-text-gray text-sm mt-1">
            {time.toLocaleDateString("uz-UZ", { weekday:"long", year:"numeric", month:"long", day:"numeric" })} •{" "}
            {time.toLocaleTimeString("uz-UZ")}
          </p>
        </div>
        {/* Alert badges */}
        <div className="flex gap-2 flex-wrap">
          {pendingOrders > 0 && (
            <Link href="/orders">
              <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 rounded-xl px-3 py-1.5 hover:bg-gold/20 transition-colors">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="text-gold text-xs font-bold">{pendingOrders} yangi buyurtma</span>
              </div>
            </Link>
          )}
          {newComplaints > 0 && (
            <Link href="/complaints">
              <div className="flex items-center gap-1.5 bg-red/10 border border-red/30 rounded-xl px-3 py-1.5 hover:bg-red/20 transition-colors">
                <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
                <span className="text-red text-xs font-bold">{newComplaints} yangi shikoyat</span>
              </div>
            </Link>
          )}
          {disputedOrders > 0 && (
            <Link href="/orders">
              <div className="flex items-center gap-1.5 bg-orange/10 border border-orange/30 rounded-xl px-3 py-1.5 hover:bg-orange/20 transition-colors">
                <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
                <span className="text-orange text-xs font-bold">{disputedOrders} nizoli buyurtma</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(s => (
          <Link key={s.label} href={s.href}>
            <div className={`acard ${s.bg} ${s.border} border hover:scale-[1.02] transition-all cursor-pointer h-full`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-text-gray text-xs">→</span>
              </div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-text-gray text-xs mt-1 leading-snug">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* So'nggi buyurtmalar */}
        <div className="acard">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>📦</span> So'nggi Buyurtmalar
            </h2>
            <Link href="/orders" className="text-cyan text-xs hover:underline">Barchasi →</Link>
          </div>
          <div className="space-y-3">
            {MOCK_ORDERS.slice(0,5).map(o => {
              const statusMap: Record<string, string> = {
                pending:"abadge-gold", approved:"abadge-cyan",
                completed:"abadge-green", rejected:"abadge-red", disputed:"abadge-red"
              };
              const statusLabel: Record<string, string> = {
                pending:"⏳ Kutilmoqda", approved:"✅ Tasdiqlandi",
                completed:"🏁 Tugadi", rejected:"❌ Rad etildi", disputed:"⚠️ Nizo"
              };
              return (
                <div key={o.id} className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-xl bg-purple/20 flex items-center justify-center text-lg shrink-0">
                    {o.game==="MLBB"?"🗡️":o.game==="PUBG"?"🎯":o.game==="Free Fire"?"🔥":"💣"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{o.userName}</p>
                    <p className="text-text-gray text-xs">{o.game} • {o.service}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={statusMap[o.status]}>{statusLabel[o.status]}</span>
                    <p className="text-gold text-xs font-bold mt-1">{formatPrice2(o.price)} so'm</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* So'nggi shikoyatlar */}
        <div className="acard">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>⚠️</span> Shikoyatlar
            </h2>
            <Link href="/complaints" className="text-cyan text-xs hover:underline">Barchasi →</Link>
          </div>
          <div className="space-y-3">
            {MOCK_COMPLAINTS.map(c => {
              const sMap: Record<string, string> = {
                new:"abadge-red", reviewing:"abadge-gold", resolved:"abadge-green", rejected:"abadge-red"
              };
              const sLabel: Record<string, string> = {
                new:"🆕 Yangi", reviewing:"🔍 Ko'rilmoqda", resolved:"✅ Hal qilindi", rejected:"❌ Rad etildi"
              };
              return (
                <div key={c.id} className="p-3 bg-bg rounded-xl border border-border">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-white text-sm font-semibold">{c.fromUser}</p>
                      <p className="text-text-gray text-xs">vs {c.againstUser} • {c.orderId}</p>
                    </div>
                    <span className={sMap[c.status]}>{sLabel[c.status]}</span>
                  </div>
                  <p className="text-text-gray text-xs leading-relaxed line-clamp-2">{c.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* To'lovlar */}
        <div className="acard">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>💰</span> So'nggi To'lovlar
            </h2>
            <Link href="/payments" className="text-cyan text-xs hover:underline">Barchasi →</Link>
          </div>
          <div className="space-y-3">
            {MOCK_PAYMENTS.map(p => {
              const typeLabel: Record<string, string> = {
                deposit:"💳 To'ldirildi", withdrawal:"💸 Chiqarildi",
                escrow_hold:"🔒 Muzlatildi", escrow_release:"✅ O'tkazildi", refund:"↩️ Qaytarildi"
              };
              const statusCls: Record<string, string> = {
                completed:"abadge-green", pending:"abadge-gold",
                frozen:"abadge-cyan", failed:"abadge-red"
              };
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-lg shrink-0">💰</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{p.userName}</p>
                    <p className="text-text-gray text-xs">{typeLabel[p.type]} • {p.method.toUpperCase()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gold text-sm font-black">{formatPrice2(p.amount)} so'm</p>
                    <span className={statusCls[p.status]}>{p.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tezkor harakatlar */}
        <div className="acard">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <span>⚡</span> Tezkor Harakatlar
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href:"/orders",     icon:"📦", label:"Buyurtmalarni ko'rish",     color:"bg-purple/15 border-purple/30 text-purple", count: pendingOrders    },
              { href:"/complaints", icon:"⚠️", label:"Shikoyatlarni hal qilish",  color:"bg-red/10 border-red/30 text-red",           count: newComplaints   },
              { href:"/listings",   icon:"🏪", label:"E'lonlarni tasdiqlash",     color:"bg-cyan/10 border-cyan/30 text-cyan",         count: STATS.pendingListings },
              { href:"/payments",   icon:"🔒", label:"Muzlatilgan pullar",        color:"bg-orange/10 border-orange/30 text-orange",   count: frozenPayments  },
              { href:"/users",      icon:"👥", label:"Foydalanuvchilar",          color:"bg-green/10 border-green/30 text-green",      count: null            },
              { href:"/admins",     icon:"🛡️", label:"Admin boshqaruv",           color:"bg-gold/10 border-gold/30 text-gold",         count: null            },
            ].map(a => (
              <Link key={a.href} href={a.href}>
                <div className={`p-4 rounded-xl border ${a.color} hover:scale-[1.03] transition-all cursor-pointer`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{a.icon}</span>
                    {a.count !== null && a.count > 0 && (
                      <span className="bg-red text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                        {a.count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold leading-snug">{a.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
