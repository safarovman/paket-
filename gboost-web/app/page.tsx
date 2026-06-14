"use client";
import Link from "next/link";
import { useState } from "react";

const TOP_GAMERS = [
  { name: "Aslaboi",    game: "MLBB",  rank: "Mythic Glory", price: 15000, avatar: "A", wins: 68, color: "#FF6B00" },
  { name: "Yakuza",     game: "PUBG",  rank: "Conqueror",    price: 20000, avatar: "Y", wins: 74, color: "#FFD600" },
  { name: "Abuser",     game: "CS2",   rank: "Global Elite", price: 25000, avatar: "Ab", wins: 71, color: "#9B59B6" },
  { name: "KingSlayer", game: "MLBB",  rank: "Mythic",       price: 12000, avatar: "K", wins: 65, color: "#FF6B00" },
  { name: "ProSniper",  game: "PUBG",  rank: "Ace",          price: 18000, avatar: "P", wins: 70, color: "#FFD600" },
  { name: "ZeroSkill",  game: "Free Fire", rank: "Heroic",   price: 10000, avatar: "Z", wins: 62, color: "#00C853" },
];

const STATS = [
  { label: "Ro'yxatdan o'tgan",   value: "4,500+", icon: "👥" },
  { label: "Tugallangan savdolar", value: "2,100+", icon: "✅" },
  { label: "Faol e'lonlar",        value: "320+",   icon: "🏪" },
  { label: "Top geymerlar",        value: "50+",    icon: "🏆" },
];

const SERVICES = [
  {
    icon: "💰",
    title: "Akkaunt Sotish",
    desc: "Akkauntingizni xavfsiz soting. 3 kunlik Escrow himoyasi. Pul 3 kun ichida hisobingizga tushadi.",
    color: "border-orange-500/30 hover:border-orange-500/60",
    btn: "Sotishga qo'yish",
    href: "/sell",
    badge: "Mashhur",
  },
  {
    icon: "🔄",
    title: "Akkaunt Ijara",
    desc: "Akkauntingizni ijaraga bering. Vaqt va shartlarni o'zingiz belgilang. Buzilsa — pul qaytadi.",
    color: "border-yellow-500/30 hover:border-yellow-500/60",
    btn: "Ijaraga berish",
    href: "/rent",
    badge: "Yangi",
  },
  {
    icon: "🚀",
    title: "Boosting",
    desc: "Top geymerlar bilan birga o'ynang yoki akkauntingizni kuchaytirishiga bering. Tez va xavfsiz.",
    color: "border-green-500/30 hover:border-green-500/60",
    btn: "Boosting buyurtma",
    href: "/boosting",
    badge: "Top",
  },
];

const GAMES = [
  { name: "MLBB",      icon: "🗡️", color: "#FF6B00", accounts: 142 },
  { name: "PUBG",      icon: "🎯", color: "#FFD600", accounts: 89  },
  { name: "CS2",       icon: "💣", color: "#9B59B6", accounts: 67  },
  { name: "Free Fire", icon: "🔥", color: "#00C853", accounts: 54  },
];

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function HomePage() {
  const [activeGamer, setActiveGamer] = useState<number | null>(null);

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage:"linear-gradient(#FF6B00 1px, transparent 1px),linear-gradient(90deg, #FF6B00 1px, transparent 1px)", backgroundSize:"50px 50px" }} />
        <div className="absolute top-20 right-20 w-72 h-72 bg-orange-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />

        <div className="gsection w-full py-20 relative">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-400 text-sm font-semibold">O'zbekistonning #1 Geyming Bozori</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
              <span className="text-gradient">GBoost</span>
              <br />
              <span className="text-white">Geyming Bozori</span>
            </h1>

            <p className="text-gray-400 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl">
              Akkaunt <span className="text-orange-400 font-semibold">sotish</span>,{" "}
              <span className="text-yellow-400 font-semibold">ijaraga berish</span> va{" "}
              <span className="text-green-400 font-semibold">boosting</span>.
              Uzcard, Humo, Click, Payme. <span className="text-white font-semibold">3 kunlik Escrow himoyasi.</span>
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/marketplace" className="gbtn text-base px-8 py-3.5 rounded-2xl text-lg font-bold">
                🏪 Bozorga o'tish
              </Link>
              <Link href="/sell" className="gbtn-outline text-base px-8 py-3.5 rounded-2xl text-lg">
                💰 Akkaunt Sotish
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map(s => (
                <div key={s.label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xl font-black text-orange-400">{s.value}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ XIZMATLAR ═══ */}
      <section className="py-20 border-t border-[#2A2A2A]">
        <div className="gsection">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Nima qila olasiz?
            </h2>
            <p className="text-gray-500">Uchta asosiy xizmat — hammasi bir joyda</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {SERVICES.map(s => (
              <div key={s.title}
                className={`bg-[#1A1A1A] border rounded-2xl p-6 transition-all duration-200 ${s.color} group`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl group-hover:animate-float inline-block">{s.icon}</span>
                  <span className="gbadge-orange text-xs">{s.badge}</span>
                </div>
                <h3 className="text-white font-black text-xl mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{s.desc}</p>
                <Link href={s.href} className="gbtn w-full text-sm py-2.5 rounded-xl">
                  {s.btn} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ O'YINLAR ═══ */}
      <section className="py-16 bg-[#111]">
        <div className="gsection">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white">🎮 O'yinlar bo'yicha</h2>
            <Link href="/marketplace" className="text-orange-400 text-sm hover:underline">
              Barchasini ko'rish →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {GAMES.map(g => (
              <Link key={g.name} href={`/marketplace?game=${g.name}`}>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 hover:border-orange-500/30 transition-all group text-center">
                  <div className="text-4xl mb-3 group-hover:animate-float inline-block">{g.icon}</div>
                  <p className="font-bold text-base" style={{ color: g.color }}>{g.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{g.accounts} ta e'lon</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TOP GEYMERLAR ═══ */}
      <section className="py-20">
        <div className="gsection">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-black text-white mb-1">
                🏆 Top Geymerlar
              </h2>
              <p className="text-gray-500 text-sm">
                Professional o'yinchilar bilan birga o'ynang yoki boosting oling
              </p>
            </div>
            <Link href="/boosting" className="gbtn-outline text-sm px-4 py-2 rounded-xl">
              Barchasini ko'rish →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOP_GAMERS.map((g, i) => (
              <div key={g.name}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 hover:border-orange-500/30 transition-all cursor-pointer group"
                onClick={() => setActiveGamer(activeGamer === i ? null : i)}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}88)` }}>
                    {g.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-white text-lg">{g.name}</p>
                      <span className="gbadge-orange text-xs">⭐ Top</span>
                    </div>
                    <p className="text-gray-500 text-xs">{g.game} • {g.rank}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#222] rounded-xl p-3 text-center">
                    <p className="text-green-400 font-black">{g.wins}%</p>
                    <p className="text-gray-500 text-xs">Win Rate</p>
                  </div>
                  <div className="bg-[#222] rounded-xl p-3 text-center">
                    <p className="text-orange-400 font-black">{fmt(g.price)} so'm</p>
                    <p className="text-gray-500 text-xs">1 soat</p>
                  </div>
                </div>

                {/* Expanded */}
                {activeGamer === i && (
                  <div className="border-t border-[#2A2A2A] pt-4 mb-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                      <span>✅ 1 soat: {fmt(g.price)} so'm</span>
                      <span>✅ 3 soat: {fmt(g.price * 2.5)} so'm</span>
                      <span>✅ 1 kun: {fmt(g.price * 8)} so'm</span>
                      <span>✅ Boosting: Narx kelishiladi</span>
                    </div>
                  </div>
                )}

                <Link href={`/boosting?gamer=${g.name}`}
                  onClick={e => e.stopPropagation()}
                  className="gbtn w-full text-sm py-2.5 rounded-xl">
                  Buyurtma berish →
                </Link>
              </div>
            ))}
          </div>

          {/* Top gamer bo'lish */}
          <div className="mt-10 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-black text-lg mb-1">🎯 Top Geymer bo'lish istaysizmi?</h3>
              <p className="text-gray-500 text-sm">Arizangizni yuboring — admin ko'rib chiqadi va profilingizni qo'shadi</p>
            </div>
            <Link href="/become-pro" className="gbtn text-sm px-6 py-2.5 rounded-xl whitespace-nowrap">
              Ariza yuborish →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ ESCROW SECTION ═══ */}
      <section className="py-16 bg-[#111] border-t border-[#2A2A2A]">
        <div className="gsection">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">🛡️ Xavfsiz Savdo Tizimi</h2>
            <p className="text-gray-500">3 kunlik Escrow — har ikki tomon ham himoyalangan</p>
          </div>
          <div className="grid sm:grid-cols-4 gap-5">
            {[
              { n:"1", icon:"💰", title:"Pul muzlatiladi",    desc:"Xaridor to'laydi — pul GBoost da saqlanadi",       color:"text-orange-400" },
              { n:"2", icon:"🔑", title:"Akkaunt beriladi",   desc:"Sotuvchi login/parolni darhol beradi",              color:"text-yellow-400" },
              { n:"3", icon:"🔍", title:"3 kun tekshiruv",    desc:"Xaridor sinab ko'radi, muammo bo'lmasa pul o'tadi", color:"text-green-400"  },
              { n:"4", icon:"⚠️", title:"Muammo bo'lsa",      desc:"Moderator aralashadi, pul qaytarilishi mumkin",      color:"text-red-400"    },
            ].map(s => (
              <div key={s.n} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-full bg-[#222] flex items-center justify-center text-xs font-black ${s.color}`}>
                    {s.n}
                  </div>
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <h3 className={`font-bold mb-2 ${s.color}`}>{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TO'LOV USULLARI ═══ */}
      <section className="py-12 border-t border-[#2A2A2A]">
        <div className="gsection">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-black text-xl mb-1">💳 O'zbek To'lov Tizimlari</h3>
              <p className="text-gray-500 text-sm">Uzcard, Humo, Click, Payme — hammasi qabul qilinadi</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { name:"Uzcard",  color:"#0066CC", emoji:"💳" },
                { name:"Humo",    color:"#00A651", emoji:"💳" },
                { name:"Click",   color:"#1976D2", emoji:"📱" },
                { name:"Payme",   color:"#00A4CF", emoji:"📲" },
              ].map(p => (
                <div key={p.name}
                  className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5">
                  <span>{p.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: p.color }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20">
        <div className="gsection">
          <div className="bg-gradient-to-r from-orange-500/15 via-[#1A1A1A] to-orange-500/5 border border-orange-500/20 rounded-3xl p-10 text-center">
            <div className="text-5xl mb-5 animate-float inline-block">🚀</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Bugun Boshlang!
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              O'zbekistondagi minglab geymerlar allaqachon GBoost da. Siz ham qo'shiling!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register" className="gbtn text-base px-8 py-3.5 rounded-2xl font-bold">
                🎮 Bepul Ro'yxatdan O'tish
              </Link>
              <Link href="/marketplace" className="gbtn-outline text-base px-8 py-3.5 rounded-2xl">
                Bozorni Ko'rish
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
