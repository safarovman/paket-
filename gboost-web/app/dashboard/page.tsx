"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const QUICK_LINKS = [
  { href:"/sell",        icon:"💰", label:"Akkaunt Sotish",   color:"#FF6B00" },
  { href:"/rent",        icon:"🔄", label:"Ijaraga Berish",   color:"#FFD600" },
  { href:"/boosting",    icon:"🚀", label:"Boosting",         color:"#00C853" },
  { href:"/marketplace", icon:"🏪", label:"Bozor",            color:"#9B59B6" },
  { href:"/wallet",      icon:"💳", label:"Hamyon",           color:"#FF6B00" },
  { href:"/profile",     icon:"👤", label:"Profil",           color:"#888"    },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const welcome  = searchParams.get("welcome");
  const listingSc = searchParams.get("listing");

  const [listings, setListings]   = useState<any[]>([]);
  const [orders, setOrders]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [balance] = useState(325000);
  const [showWelcome, setShowWelcome] = useState(!!welcome);
  const [showListing, setShowListing] = useState(!!listingSc);

  useEffect(() => {
    fetchData();
    setTimeout(() => { setShowWelcome(false); setShowListing(false); }, 5000);
  }, []);

  const fetchData = async () => {
    setLoading(false);
    // Real loyihada auth user ga qarab filter qilinadi
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    pending:   { label:"⏳ Kutilmoqda", cls:"gbadge-yellow" },
    approved:  { label:"✅ Tasdiqlandi",cls:"gbadge-green"  },
    rejected:  { label:"❌ Rad etildi", cls:"gbadge-red"    },
    completed: { label:"🏁 Tugadi",     cls:"gbadge-green"  },
  };

  return (
    <div className="gsection py-8">
      {/* Welcome notifications */}
      {showWelcome && (
        <div className="bg-green-500/15 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-green-400 font-bold">Xush kelibsiz, GBoost ga!</p>
              <p className="text-gray-500 text-sm">Akkauntingiz muvaffaqiyatli yaratildi</p>
            </div>
          </div>
          <button onClick={() => setShowWelcome(false)} className="text-gray-500 hover:text-white">✕</button>
        </div>
      )}
      {showListing && (
        <div className="bg-orange-500/15 border border-orange-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-orange-400 font-bold">E'lon admin tekshiruviga yuborildi!</p>
              <p className="text-gray-500 text-sm">Tasdiqlangandan keyin bozorda ko'rinadi</p>
            </div>
          </div>
          <button onClick={() => setShowListing(false)} className="text-gray-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Salom! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Akkauntingizni boshqaring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5">
            <p className="text-gray-500 text-xs">Balans</p>
            <p className="text-orange-400 font-black text-lg">{fmt(balance)} so'm</p>
          </div>
          <Link href="/wallet" className="gbtn text-sm px-4 py-2.5 rounded-xl">
            + To'ldirish
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label:"Mening e'lonlarim",  value:"3",       icon:"📦", color:"text-orange-400", href:"/dashboard" },
          { label:"Faol buyurtmalar",   value:"1",       icon:"🔄", color:"text-green-400",  href:"/dashboard" },
          { label:"Jami savdolar",      value:"8",       icon:"✅", color:"text-white",      href:"/dashboard" },
          { label:"Balans",             value:`${fmt(balance)} so'm`, icon:"💰", color:"text-orange-400", href:"/wallet" },
        ].map(s => (
          <Link key={s.label} href={s.href}>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 hover:border-orange-500/30 transition-all">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-xs mt-0.5">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">⚡ Tezkor harakatlar</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_LINKS.map(q => (
            <Link key={q.href} href={q.href}>
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-orange-500/30 transition-all group">
                <span className="text-2xl group-hover:animate-float">{q.icon}</span>
                <span className="text-xs font-medium text-gray-400 text-center leading-tight">{q.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mening e'lonlarim */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">📦 Mening E'lonlarim</h2>
            <Link href="/sell" className="text-orange-400 text-sm hover:underline">+ Yangi e'lon</Link>
          </div>
          {listings.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] border-dashed rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-500 text-sm mb-4">Hali e'lon yo'q</p>
              <Link href="/sell" className="gbtn inline-flex px-5 py-2 rounded-xl text-sm">
                💰 Akkaunt Sotish
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((l, i) => (
                <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl shrink-0">🎮</div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{l.game}</p>
                    <p className="text-gray-500 text-xs">{l.rank}</p>
                  </div>
                  <div className="text-right">
                    <span className={statusMap[l.status]?.cls || "gbadge-gray"}>{statusMap[l.status]?.label}</span>
                    <p className="text-orange-400 font-bold text-sm mt-1">{fmt(l.price)} so'm</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mening buyurtmalarim */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">🛒 Buyurtmalarim</h2>
            <Link href="/marketplace" className="text-orange-400 text-sm hover:underline">Bozorga →</Link>
          </div>
          {orders.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] border-dashed rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-gray-500 text-sm mb-4">Hali buyurtma yo'q</p>
              <Link href="/marketplace" className="gbtn-outline inline-flex px-5 py-2 rounded-xl text-sm">
                🏪 Bozorga o'tish
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o, i) => (
                <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                  <p className="text-white font-semibold text-sm">{o.game}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
