"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, GradientCard } from "@/components/ui/Card";
import { KarmaBadge, StatusBadge, GameBadge } from "@/components/ui/Badge";
import { GAMES, TOP_BOOSTERS, STATS, formatPrice } from "@/lib/constants";

const RECENT_ORDERS = [
  { id:"ORD-001", game:"MLBB",      icon:"🗡️", service:"Solo Boosting", from:"Epic",   to:"Legend",    price:120000, status:"active",    booster:"ProGamer99" },
  { id:"ORD-002", game:"PUBG",      icon:"🎯", service:"Duo Boosting",  from:"Gold",   to:"Platinum",  price:80000,  status:"completed",  booster:"SniperKing" },
  { id:"ORD-003", game:"Free Fire", icon:"🔥", service:"Coaching",      from:"Diamond",to:"Heroic",    price:60000,  status:"pending",    booster:"FireLord"   },
];

const QUICK_ACTIONS = [
  { href:"/boosting",    icon:"⚔️", label:"Boosting",   color:"#00E5FF" },
  { href:"/marketplace", icon:"🏪", label:"Bozor",       color:"#FFD600" },
  { href:"/escrow",      icon:"🛡️", label:"Escrow",      color:"#00C853" },
  { href:"/karma",       icon:"⭐", label:"Karma",       color:"#FF3D3D" },
  { href:"/profile",     icon:"👤", label:"Profil",      color:"#6C3FB5" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"all"|"active"|"completed">("all");

  const filtered = activeTab === "all" ? RECENT_ORDERS
    : RECENT_ORDERS.filter(o => o.status === activeTab);

  return (
    <div className="gsection py-8 space-y-8">
      {/* Welcome banner */}
      <GradientCard gradient="from-purple/25 via-card to-cyan/10" className="border border-cyan/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-black text-2xl shadow-cyan shrink-0">
              A
            </div>
            <div>
              <p className="text-text-gray text-sm">Xush kelibsiz 👋</p>
              <h1 className="text-2xl font-black text-text-white">Abdulloh Karimov</h1>
              <KarmaBadge karma={78} />
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/boosting" className="gbtn-primary text-sm px-4 py-2 rounded-xl">
              ⚔️ Yangi Buyurtma
            </Link>
            <Link href="/profile" className="gbtn-outline text-sm px-4 py-2 rounded-xl">
              👤 Profil
            </Link>
          </div>
        </div>
      </GradientCard>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Jami Buyurtmalar", value:"12",    icon:"📦", color:"text-cyan"  },
          { label:"Tugallangan",       value:"10",    icon:"✅", color:"text-green" },
          { label:"Karma Ball",        value:"78/100",icon:"⭐", color:"text-gold"  },
          { label:"Sarflangan",        value:"1.2M",  icon:"💰", color:"text-purple-light" },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-text-gray text-xs mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-text-white mb-4">Tezkor harakatlar</h2>
        <div className="grid grid-cols-5 gap-3">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border hover:border-current/40 transition-all duration-150 hover:scale-105 cursor-pointer group"
                style={{ background:`${a.color}10` }}>
                <div className="text-3xl group-hover:animate-float">{a.icon}</div>
                <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-text-white">So'nggi Buyurtmalar</h2>
            <div className="flex gap-1.5 bg-card rounded-xl p-1 border border-border">
              {(["all","active","completed"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab===t ? "bg-cyan/20 text-cyan" : "text-text-gray hover:text-text-light"
                  }`}>
                  {t==="all"?"Barchasi":t==="active"?"Faol":"Tugagan"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filtered.length === 0
              ? <Card className="text-center py-10 text-text-gray">Buyurtma topilmadi</Card>
              : filtered.map(o => (
                <Card key={o.id} hover className="group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background:`${o.status==="active"?"#00E5FF":o.status==="completed"?"#00C853":"#FFD600"}15` }}>
                      {o.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-sm text-text-white">{o.game} • {o.service}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-text-gray text-xs mt-0.5">{o.from} → {o.to}</p>
                      <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
                        <span className="text-cyan text-xs">⚔️ {o.booster}</span>
                        <span className="text-gold text-xs font-bold">{formatPrice(o.price)} so'm</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            }
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Karma card */}
          <Card className="border-gold/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-text-white text-sm">Karma Reytingi</h3>
              <Link href="/karma" className="text-cyan text-xs hover:underline">Batafsil →</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1A2245" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#FFD600" strokeWidth="3.5"
                    strokeDasharray={`${78} ${100}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gold font-black text-sm">78</span>
                </div>
              </div>
              <div>
                <p className="text-gold font-bold">O'rtacha</p>
                <p className="text-text-gray text-xs mt-0.5">Yaxshilanish mumkin 📈</p>
                <p className="text-green text-xs mt-1">+22 → Yuqori daraja</p>
              </div>
            </div>
          </Card>

          {/* Top boosters */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-text-white text-sm">Top Boosterlar</h3>
              <Link href="/boosting" className="text-cyan text-xs hover:underline">Ko'rish →</Link>
            </div>
            <div className="space-y-3">
              {TOP_BOOSTERS.slice(0,4).map((b,i) => (
                <div key={b.name} className="flex items-center gap-3">
                  <span className="text-text-gray text-xs w-4 font-bold">{i+1}</span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {b.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-white text-xs font-semibold truncate">{b.name}</p>
                    <p className="text-text-gray text-xs">{b.game}</p>
                  </div>
                  <KarmaBadge karma={b.karma} />
                </div>
              ))}
            </div>
          </Card>

          {/* Escrow notice */}
          <GradientCard gradient="from-green/10 to-card" className="border border-green/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🛡️</span>
              <div>
                <p className="text-green font-bold text-sm">Escrow Himoyasi Faol</p>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  Barcha buyurtmalaringiz 3 kunlik Escrow tizimi bilan himoyalangan.
                </p>
                <Link href="/escrow" className="text-cyan text-xs mt-2 inline-block hover:underline">
                  Escrowni ko'rish →
                </Link>
              </div>
            </div>
          </GradientCard>
        </div>
      </div>

      {/* Games grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-white">O'yinlar</h2>
          <Link href="/boosting" className="text-cyan text-sm hover:underline">Barchasi →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {GAMES.map(g => (
            <Link key={g.id} href="/boosting">
              <div className="flex items-center gap-3 p-4 rounded-2xl border transition-all duration-150 hover:scale-[1.02] cursor-pointer"
                style={{ background:`${g.color}12`, borderColor:`${g.color}35` }}>
                <span className="text-2xl">{g.icon}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: g.color }}>{g.short}</p>
                  <p className="text-text-gray text-xs">Boosting</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
