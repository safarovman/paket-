"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  STATS, MOCK_ORDERS, MOCK_COMPLAINTS,
  MOCK_PAYMENTS, MOCK_USERS,
} from "@/lib/db";
import clsx from "clsx";

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// ─── P&L hisoblash
function calcPL() {
  const completed = MOCK_ORDERS.filter(o => o.status === "completed");
  const grossRevenue   = completed.reduce((s, o) => s + o.price, 0);
  const commissionRate = 0.13;
  const commission     = Math.round(grossRevenue * commissionRate);
  const refunds        = MOCK_PAYMENTS.filter(p => p.type === "refund" && p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);
  const netRevenue     = commission - refunds;

  // Xarajatlar (demo)
  const serverCost   = 150000;
  const smsCost      = 45000;
  const supportCost  = 200000;
  const totalExpense = serverCost + smsCost + supportCost;

  const profit = netRevenue - totalExpense;

  // Oylik ma'lumotlar (demo)
  const monthly = [
    { month:"Okt", income:1200000, expense:350000 },
    { month:"Noy", income:2100000, expense:420000 },
    { month:"Dek", income:3400000, expense:490000 },
    { month:"Yan", income:commission, expense:totalExpense },
  ];

  return { grossRevenue, commission, refunds, netRevenue, serverCost, smsCost, supportCost, totalExpense, profit, monthly };
}

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [time, setTime]       = useState(new Date());
  const [activeTab, setActiveTab] = useState<"overview"|"pl">("overview");

  useEffect(() => {
    const s = localStorage.getItem("gboost_admin_session");
    if (s) setSession(JSON.parse(s));
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pendingOrders   = MOCK_ORDERS.filter(o => o.status === "pending").length;
  const disputedOrders  = MOCK_ORDERS.filter(o => o.status === "disputed").length;
  const newComplaints   = MOCK_COMPLAINTS.filter(c => c.status === "new").length;
  const frozenTotal     = MOCK_PAYMENTS.filter(p => p.status === "frozen")
    .reduce((s, p) => s + p.amount, 0);
  const frozenCount     = MOCK_PAYMENTS.filter(p => p.status === "frozen").length;

  const pl = calcPL();

  const STAT_CARDS = [
    { label:"Jami foydalanuvchilar", value: STATS.totalUsers.toLocaleString(),    icon:"👥", color:"text-cyan",   bg:"bg-cyan/10   border-cyan/20",   href:"/users"      },
    { label:"Faol foydalanuvchilar", value: STATS.activeUsers.toLocaleString(),   icon:"🟢", color:"text-green",  bg:"bg-green/10  border-green/20",  href:"/users"      },
    { label:"Jami buyurtmalar",      value: STATS.totalOrders.toLocaleString(),   icon:"📦", color:"text-purple", bg:"bg-purple/10 border-purple/20", href:"/orders"     },
    { label:"Kutilayotgan",          value: pendingOrders.toString(),             icon:"⏳", color:"text-gold",   bg:"bg-gold/10   border-gold/20",   href:"/orders"     },
    { label:"Muzlatilgan mablag'",   value: fmt(frozenTotal)+" so'm",             icon:"🔒", color:"text-cyan",   bg:"bg-cyan/10   border-cyan/20",   href:"/payments"   },
    { label:"Ochiq shikoyatlar",     value: newComplaints.toString(),             icon:"⚠️", color:"text-red",    bg:"bg-red/10    border-red/20",    href:"/complaints" },
    { label:"Tasdiq kutgan e'lon",   value: STATS.pendingListings.toString(),     icon:"🏪", color:"text-gold",   bg:"bg-gold/10   border-gold/20",   href:"/listings"   },
    { label:"Nizoli buyurtmalar",    value: disputedOrders.toString(),            icon:"⚔️", color:"text-orange", bg:"bg-orange/10 border-orange/20", href:"/orders"     },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">
            {session?.role === "superadmin" ? "👑" : "🛡️"} Xush kelibsiz, {session?.name || "Admin"}!
          </h1>
          <p className="text-text-gray text-sm mt-1">
            {time.toLocaleDateString("uz-UZ", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
            {" • "}{time.toLocaleTimeString("uz-UZ")}
          </p>
        </div>
        {/* Alert badges */}
        <div className="flex flex-wrap gap-2">
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
                <span className="text-orange text-xs font-bold">{disputedOrders} nizo</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-card border border-border rounded-xl p-1 w-fit mb-6">
        {[
          { id:"overview", label:"📊 Umumiy ko'rinish" },
          { id:"pl",       label:"💹 Foyda / Zarar"   },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={clsx("px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === t.id
                ? "bg-gradient-to-r from-purple/40 to-cyan/20 text-white border border-cyan/30"
                : "text-text-gray hover:text-text-light")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ TAB: OVERVIEW ════ */}
      {activeTab === "overview" && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_CARDS.map(s => (
              <Link key={s.label} href={s.href}>
                <div className={`acard border ${s.bg} hover:scale-[1.02] transition-all cursor-pointer h-full`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-text-gray/50 text-xs">→</span>
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
                <h2 className="font-bold text-white flex items-center gap-2">📦 So'nggi Buyurtmalar</h2>
                <Link href="/orders" className="text-cyan text-xs hover:underline">Barchasi →</Link>
              </div>
              <div className="space-y-3">
                {MOCK_ORDERS.slice(0, 5).map(o => {
                  const sMap: Record<string, string> = {
                    pending:"abadge-gold", approved:"abadge-cyan",
                    completed:"abadge-green", rejected:"abadge-red", disputed:"abadge-red",
                  };
                  const sLabel: Record<string, string> = {
                    pending:"⏳ Kutilmoqda", approved:"✅ Tasdiqlandi",
                    completed:"🏁 Tugadi", rejected:"❌ Rad", disputed:"⚠️ Nizo",
                  };
                  const gameIcon: Record<string, string> = { MLBB:"🗡️", PUBG:"🎯", "Free Fire":"🔥", CS2:"💣" };
                  return (
                    <div key={o.id} className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border">
                      <div className="w-10 h-10 rounded-xl bg-purple/20 flex items-center justify-center text-lg shrink-0">
                        {gameIcon[o.game] || "🎮"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{o.userName}</p>
                        <p className="text-text-gray text-xs">{o.game} • {o.fromRank} → {o.toRank}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={sMap[o.status]}>{sLabel[o.status]}</span>
                        <p className="text-gold text-xs font-bold mt-1">{fmt(o.price)} so'm</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shikoyatlar */}
            <div className="acard">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2">⚠️ Shikoyatlar</h2>
                <Link href="/complaints" className="text-cyan text-xs hover:underline">Barchasi →</Link>
              </div>
              <div className="space-y-3">
                {MOCK_COMPLAINTS.map(c => {
                  const sMap: Record<string, string> = {
                    new:"abadge-red", reviewing:"abadge-gold",
                    resolved:"abadge-green", rejected:"abadge-red",
                  };
                  const sLabel: Record<string, string> = {
                    new:"🆕 Yangi", reviewing:"🔍 Ko'rilmoqda",
                    resolved:"✅ Hal qilindi", rejected:"❌ Rad",
                  };
                  return (
                    <div key={c.id} className="p-3 bg-bg rounded-xl border border-border">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-white text-sm font-semibold">{c.fromUser}</p>
                          <p className="text-text-gray text-xs">↳ {c.againstUser} • {c.orderId}</p>
                        </div>
                        <span className={sMap[c.status]}>{sLabel[c.status]}</span>
                      </div>
                      <p className="text-text-gray text-xs line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Muzlatilgan pullar */}
            <div className="acard border-cyan/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2">🔒 Muzlatilgan Mablag'</h2>
                <Link href="/payments" className="text-cyan text-xs hover:underline">Barchasi →</Link>
              </div>
              <div className="text-center py-4 mb-4">
                <p className="text-4xl font-black text-cyan">{fmt(frozenTotal)}</p>
                <p className="text-text-gray text-sm mt-1">so'm • {frozenCount} ta Escrow</p>
              </div>
              <div className="space-y-2">
                {MOCK_PAYMENTS.filter(p => p.status === "frozen").map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-bg rounded-xl border border-border text-sm">
                    <span className="text-text-light">{p.userName}</span>
                    <span className="text-cyan font-bold">{fmt(p.amount)} so'm</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tezkor harakatlar */}
            <div className="acard">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">⚡ Tezkor Harakatlar</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href:"/orders",     icon:"📦", label:"Buyurtmalarni tekshirish", color:"bg-purple/15 border-purple/30 text-purple", count: pendingOrders   },
                  { href:"/complaints", icon:"⚠️", label:"Shikoyatlarni hal qilish", color:"bg-red/10 border-red/30 text-red",           count: newComplaints  },
                  { href:"/listings",   icon:"🏪", label:"E'lonlarni tasdiqlash",    color:"bg-cyan/10 border-cyan/30 text-cyan",         count: STATS.pendingListings },
                  { href:"/payments",   icon:"🔒", label:"Muzlatilgan pullar",       color:"bg-gold/10 border-gold/30 text-gold",         count: frozenCount    },
                  { href:"/users",      icon:"👥", label:"Foydalanuvchilar",         color:"bg-green/10 border-green/30 text-green",      count: null           },
                  { href:"/admins",     icon:"🛡️", label:"Admin boshqaruv",          color:"bg-orange/10 border-orange/30 text-orange",   count: null           },
                ].map(a => (
                  <Link key={a.href} href={a.href}>
                    <div className={`p-4 rounded-xl border ${a.color} hover:scale-[1.02] transition-all cursor-pointer h-full`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{a.icon}</span>
                        {a.count !== null && a.count > 0 && (
                          <span className="bg-red text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0">
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
        </>
      )}

      {/* ════ TAB: FOYDA / ZARAR (P&L) ════ */}
      {activeTab === "pl" && (
        <div className="space-y-6">
          {/* Asosiy P&L kartalar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:"Umumiy savdo hajmi", value:`${fmt(pl.grossRevenue)} so'm`, icon:"📊", color:"text-cyan",   bg:"bg-cyan/10 border-cyan/20",   desc:"Barcha buyurtmalar summasi" },
              { label:"GBoost komissiyasi", value:`${fmt(pl.commission)} so'm`,   icon:"💰", color:"text-green",  bg:"bg-green/10 border-green/20", desc:"13% komissiya daromadi"     },
              { label:"Qaytarilgan pullar", value:`${fmt(pl.refunds)} so'm`,      icon:"↩️", color:"text-red",    bg:"bg-red/10 border-red/20",     desc:"Refund + Escrow qaytarish"  },
              { label:"Sof daromad",        value:`${fmt(pl.netRevenue)} so'm`,   icon:"✅", color:"text-gold",   bg:"bg-gold/10 border-gold/20",   desc:"Komissiya - Qaytarilganlar" },
            ].map(s => (
              <div key={s.label} className={`acard border ${s.bg}`}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-text-white text-xs font-semibold mt-1">{s.label}</p>
                <p className="text-text-gray text-xs mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Xarajatlar */}
            <div className="acard">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <span>📉</span> Xarajatlar (Oylik)
              </h2>
              <div className="space-y-3">
                {[
                  { label:"Server (Vercel/Railway)", value: pl.serverCost,  icon:"🖥️", color:"text-red"    },
                  { label:"SMS (Eskiz)",              value: pl.smsCost,     icon:"📱", color:"text-orange" },
                  { label:"Qo'llab-quvvatlash",       value: pl.supportCost, icon:"🎧", color:"text-gold"   },
                ].map(e => (
                  <div key={e.label} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{e.icon}</span>
                      <span className="text-text-light text-sm">{e.label}</span>
                    </div>
                    <span className={`font-bold text-sm ${e.color}`}>- {fmt(e.value)} so'm</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-red/10 rounded-xl border border-red/20 mt-2">
                  <span className="text-red font-bold text-sm">📊 Jami xarajatlar</span>
                  <span className="text-red font-black">- {fmt(pl.totalExpense)} so'm</span>
                </div>
              </div>
            </div>

            {/* Foyda/Zarar xulosasi */}
            <div className="acard">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <span>💹</span> Foyda / Zarar Xulosasi
              </h2>

              {/* P&L vizual */}
              <div className={clsx(
                "rounded-2xl p-5 border text-center mb-4",
                pl.profit >= 0
                  ? "bg-green/10 border-green/30"
                  : "bg-red/10 border-red/30"
              )}>
                <p className="text-text-gray text-sm mb-1">Oylik sof natija</p>
                <p className={clsx("text-3xl font-black", pl.profit >= 0 ? "text-green" : "text-red")}>
                  {pl.profit >= 0 ? "+" : ""}{fmt(pl.profit)} so'm
                </p>
                <p className={clsx("text-sm mt-1 font-semibold", pl.profit >= 0 ? "text-green" : "text-red")}>
                  {pl.profit >= 0 ? "✅ Foyda" : "❌ Zarar"}
                </p>
              </div>

              {/* Hisob-kitob */}
              <div className="space-y-2">
                {[
                  { label:"(+) Komissiya daromadi", value:`+ ${fmt(pl.commission)} so'm`, color:"text-green"  },
                  { label:"(-) Qaytarilgan pullar", value:`- ${fmt(pl.refunds)} so'm`,    color:"text-red"    },
                  { label:"(-) Jami xarajatlar",    value:`- ${fmt(pl.totalExpense)} so'm`,color:"text-red"   },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm border-b border-border pb-2">
                    <span className="text-text-gray">{r.label}</span>
                    <span className={`font-semibold ${r.color}`}>{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <span className="text-white font-bold">= Sof foyda</span>
                  <span className={clsx("font-black text-lg", pl.profit >= 0 ? "text-green" : "text-red")}>
                    {pl.profit >= 0 ? "+" : ""}{fmt(pl.profit)} so'm
                  </span>
                </div>
              </div>
            </div>

            {/* Oylik trend */}
            <div className="acard lg:col-span-2">
              <h2 className="font-bold text-white mb-5 flex items-center gap-2">
                <span>📈</span> Oylik Daromad Trendi
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {pl.monthly.map((m, i) => {
                  const maxVal = Math.max(...pl.monthly.map(x => x.income));
                  const barH   = Math.round((m.income / maxVal) * 100);
                  const profit = m.income - m.expense;
                  return (
                    <div key={m.month} className="flex flex-col items-center gap-2">
                      {/* Bar */}
                      <div className="w-full h-32 flex items-end justify-center gap-1">
                        {/* Income bar */}
                        <div className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan/60 to-cyan transition-all relative group"
                          style={{ height: `${barH}%` }}>
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs text-cyan font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-card px-1.5 py-0.5 rounded-lg border border-cyan/30">
                            {fmt(m.income)}
                          </div>
                        </div>
                        {/* Expense bar */}
                        <div className="flex-1 rounded-t-lg bg-red/50 transition-all relative group"
                          style={{ height: `${Math.round((m.expense / maxVal) * 100)}%` }}>
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs text-red font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-card px-1.5 py-0.5 rounded-lg border border-red/30">
                            {fmt(m.expense)}
                          </div>
                        </div>
                      </div>
                      {/* Label */}
                      <p className="text-text-gray text-xs font-semibold">{m.month}</p>
                      <p className={clsx("text-xs font-bold", profit >= 0 ? "text-green" : "text-red")}>
                        {profit >= 0 ? "+" : ""}{fmt(profit)}
                      </p>
                      {i === pl.monthly.length - 1 && (
                        <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-bold">Hozir</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-cyan/60" />
                  <span className="text-text-gray text-xs">Daromad</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red/50" />
                  <span className="text-text-gray text-xs">Xarajat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
