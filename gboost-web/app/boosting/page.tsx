"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";
import Link from "next/link";

const TOP_GAMERS = [
  { id:"aslaboi",    name:"Aslaboi",    game:"MLBB",      rank:"Mythic Glory", wins:68, price:15000, avatar:"A", color:"#FF6B00", games:2341, rating:4.9, reviews:142, bio:"MLBB da 3 yillik tajriba. Mythic Glory darajasida. Solo va Duo boosting." },
  { id:"yakuza",     name:"Yakuza",     game:"PUBG",      rank:"Conqueror",    wins:74, price:20000, avatar:"Y", color:"#FFD600", games:1890, rating:4.8, reviews:97,  bio:"PUBG Conqueror. Sniper va assault rifle mutaxassisi." },
  { id:"abuser",     name:"Abuser",     game:"CS2",       rank:"Global Elite", wins:71, price:25000, avatar:"Ab",color:"#9B59B6", games:3200, rating:4.9, reviews:201, bio:"CS2 Global Elite. AWP va rifle bilan professional o'yinchi." },
  { id:"kingslayer", name:"KingSlayer", game:"MLBB",      rank:"Mythic",       wins:65, price:12000, avatar:"K", color:"#FF6B00", games:1654, rating:4.7, reviews:88,  bio:"MLBB Mythic darajasi. Tank va jungler ixtisoslik." },
  { id:"prosniper",  name:"ProSniper",  game:"PUBG",      rank:"Ace",          wins:70, price:18000, avatar:"P", color:"#FFD600", games:1234, rating:4.8, reviews:134, bio:"PUBG Ace. Sniper va close range mutaxassis." },
  { id:"zeroskill",  name:"ZeroSkill",  game:"Free Fire", rank:"Heroic",       wins:62, price:10000, avatar:"Z", color:"#00C853", games:987,  rating:4.6, reviews:63,  bio:"Free Fire Heroic. Aggressive o'yin uslubi." },
];

const SERVICES = [
  { id:"play",    icon:"🎮", name:"Birga O'ynash",    desc:"Top geymer siz bilan birga o'ynaydi (Duo)" },
  { id:"boost",   icon:"🚀", name:"Akkaunt Boosting", desc:"Akkauntingizni kuchaytiradi, siz kuzatasiz" },
  { id:"coaching",icon:"🎓", name:"Coaching",         desc:"Siz o'ynaysiz, u ko'rsatmalar beradi" },
];

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function BoostingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("gamer");

  const [selectedGamer, setSelectedGamer] = useState<typeof TOP_GAMERS[0] | null>(
    preselected ? TOP_GAMERS.find(g => g.id === preselected) || null : null
  );
  const [service, setService]   = useState("play");
  const [hours, setHours]       = useState(1);
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [filterGame, setFilterGame] = useState("all");
  const [detailGamer, setDetailGamer] = useState<typeof TOP_GAMERS[0] | null>(null);

  const total = selectedGamer ? selectedGamer.price * hours : 0;

  const filtered = filterGame === "all"
    ? TOP_GAMERS
    : TOP_GAMERS.filter(g => g.game === filterGame);

  const handleOrder = async () => {
    if (!selectedGamer) return;
    setLoading(true);
    await supabase.from("orders").insert({
      user_name:   "Foydalanuvchi",
      game:        selectedGamer.game,
      service:     `${SERVICES.find(s => s.id === service)?.name} — ${selectedGamer.name}`,
      from_rank:   "Hozirgi",
      to_rank:     "Keyingi",
      price:       total,
      status:      "pending",
      booster:     selectedGamer.name,
      note:        message || null,
      payment_method: "click",
    });
    setLoading(false);
    setSuccess(true);
  };

  if (success) return (
    <div className="gsection py-20 text-center">
      <div className="text-6xl mb-5 animate-float inline-block">🎉</div>
      <h1 className="text-3xl font-black text-white mb-3">Buyurtma qabul qilindi!</h1>
      <p className="text-gray-500 mb-2">{selectedGamer?.name} bilan {SERVICES.find(s=>s.id===service)?.name}</p>
      <p className="text-orange-400 font-black text-xl mb-6">{fmt(total)} so'm</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/dashboard" className="gbtn px-6 py-3 rounded-xl">🏠 Dashboard</Link>
        <Link href="/marketplace" className="gbtn-outline px-6 py-3 rounded-xl">🏪 Bozor</Link>
      </div>
    </div>
  );

  return (
    <div className="gsection py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">🚀 Boosting & O'ynash</h1>
        <p className="text-gray-500">Top geymerlar bilan birga o'ynang yoki akkauntingizni kuchayting</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Geymerlar ro'yxati */}
        <div className="lg:col-span-2">
          {/* Filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {["all","MLBB","PUBG","CS2","Free Fire"].map(g => (
              <button key={g} onClick={() => setFilterGame(g)}
                className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all",
                  filterGame === g ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "border-[#2A2A2A] text-gray-500 hover:text-white")}>
                {g === "all" ? "Barchasi" : g}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(g => (
              <div key={g.id}
                className={clsx("bg-[#1A1A1A] border rounded-2xl p-5 transition-all cursor-pointer",
                  selectedGamer?.id === g.id ? "border-orange-500 shadow-lg" : "border-[#2A2A2A] hover:border-[#3A3A3A]")}>
                {/* Geymer header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0"
                    style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}66)` }}>
                    {g.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white">{g.name}</p>
                      <span className="gbadge-orange text-xs">⭐ Top</span>
                    </div>
                    <p className="text-gray-500 text-xs">{g.game} • {g.rank}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {"⭐".repeat(Math.round(g.rating))}
                      <span className="text-gray-500 text-xs ml-1">{g.rating} ({g.reviews})</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-[#111] rounded-xl p-2 text-center">
                    <p className="text-green-400 font-bold text-sm">{g.wins}%</p>
                    <p className="text-gray-600 text-xs">Win</p>
                  </div>
                  <div className="bg-[#111] rounded-xl p-2 text-center">
                    <p className="text-orange-400 font-bold text-sm">{(g.games/1000).toFixed(1)}K</p>
                    <p className="text-gray-600 text-xs">O'yin</p>
                  </div>
                  <div className="bg-[#111] rounded-xl p-2 text-center">
                    <p className="text-white font-bold text-sm">{fmt(g.price)}</p>
                    <p className="text-gray-600 text-xs">so'm/soat</p>
                  </div>
                </div>

                <p className="text-gray-500 text-xs mb-4 line-clamp-2">{g.bio}</p>

                <div className="flex gap-2">
                  <button onClick={() => setDetailGamer(g)}
                    className="flex-1 bg-[#2A2A2A] hover:bg-[#333] text-white text-xs py-2 rounded-xl transition-all font-semibold">
                    Batafsil
                  </button>
                  <button onClick={() => setSelectedGamer(g)}
                    className={clsx("flex-1 text-xs py-2 rounded-xl font-bold transition-all",
                      selectedGamer?.id === g.id ? "bg-green-500 text-white" : "gbtn")}>
                    {selectedGamer?.id === g.id ? "✓ Tanlandi" : "Tanlash"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Top geymer bo'lish */}
          <div className="mt-6 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold mb-1">🎯 Top Geymer bo'lishni xohlaysizmi?</p>
              <p className="text-gray-500 text-sm">Arizangizni yuboring — admin ko'rib chiqadi</p>
            </div>
            <Link href="/become-pro" className="gbtn text-sm px-4 py-2 rounded-xl whitespace-nowrap">Ariza →</Link>
          </div>
        </div>

        {/* Buyurtma paneli */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 sticky top-20">
            <h2 className="font-black text-white text-lg mb-4">📋 Buyurtma</h2>

            {!selectedGamer ? (
              <div className="text-center py-8 text-gray-600">
                <div className="text-4xl mb-2">👈</div>
                <p className="text-sm">Chap tarafdan geymer tanlang</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tanlangan geymer */}
                <div className="flex items-center gap-3 bg-[#111] rounded-xl p-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ background: selectedGamer.color }}>
                    {selectedGamer.avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{selectedGamer.name}</p>
                    <p className="text-gray-500 text-xs">{selectedGamer.game}</p>
                  </div>
                  <button onClick={() => setSelectedGamer(null)} className="ml-auto text-gray-500 hover:text-white text-sm">✕</button>
                </div>

                {/* Xizmat turi */}
                <div>
                  <label className="text-gray-500 text-xs mb-2 block font-medium">Xizmat turi</label>
                  <div className="space-y-2">
                    {SERVICES.map(s => (
                      <button key={s.id} onClick={() => setService(s.id)}
                        className={clsx("w-full p-3 rounded-xl border text-left transition-all",
                          service === s.id ? "border-orange-500/60 bg-orange-500/10" : "border-[#2A2A2A] hover:border-[#3A3A3A]")}>
                        <div className="flex items-center gap-2">
                          <span>{s.icon}</span>
                          <div>
                            <p className={`font-semibold text-sm ${service === s.id ? "text-orange-400" : "text-white"}`}>{s.name}</p>
                            <p className="text-gray-600 text-xs">{s.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soatlar */}
                <div>
                  <label className="text-gray-500 text-xs mb-2 block font-medium">Vaqt (soat)</label>
                  <div className="flex gap-2">
                    {[1,2,3,5].map(h => (
                      <button key={h} onClick={() => setHours(h)}
                        className={clsx("flex-1 py-2 rounded-xl border text-sm font-bold transition-all",
                          hours === h ? "border-orange-500 bg-orange-500/20 text-orange-400" : "border-[#2A2A2A] text-gray-500 hover:text-white")}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Izoh */}
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block font-medium">Izoh (ixtiyoriy)</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Qaysi rankdan qaysi rankg, qanday o'yin..."
                    rows={2} className="ginput resize-none text-xs" />
                </div>

                {/* Narx */}
                <div className="bg-[#111] rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{hours} soat × {fmt(selectedGamer.price)} so'm</span>
                    <span className="text-white font-bold">{fmt(total)} so'm</span>
                  </div>
                  <div className="h-px bg-[#2A2A2A]" />
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Jami:</span>
                    <span className="text-orange-400 font-black text-lg">{fmt(total)} so'm</span>
                  </div>
                </div>

                <button onClick={handleOrder} disabled={loading} className="gbtn w-full py-3 rounded-xl disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuklanmoqda...</>
                    : "🎮 Buyurtma Berish"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Geymer detail modal */}
      {detailGamer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDetailGamer(null)}>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-xl">{detailGamer.name}</h3>
              <button onClick={() => setDetailGamer(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl"
                style={{ background: detailGamer.color }}>
                {detailGamer.avatar}
              </div>
              <div>
                <p className="text-gray-400 text-sm">{detailGamer.game} • {detailGamer.rank}</p>
                <div className="flex items-center gap-1 mt-1">
                  {"⭐".repeat(Math.round(detailGamer.rating))}
                  <span className="text-gray-500 text-xs ml-1">{detailGamer.rating} ({detailGamer.reviews} sharh)</span>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">{detailGamer.bio}</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { l:"Win Rate", v:`${detailGamer.wins}%`, c:"text-green-400" },
                { l:"O'yinlar", v:`${detailGamer.games.toLocaleString()}`, c:"text-orange-400" },
                { l:"Narx/soat", v:`${fmt(detailGamer.price)} so'm`, c:"text-white" },
              ].map(s => (
                <div key={s.l} className="bg-[#111] rounded-xl p-3 text-center">
                  <p className={`font-black text-sm ${s.c}`}>{s.v}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setSelectedGamer(detailGamer); setDetailGamer(null); }}
              className="gbtn w-full py-3 rounded-xl">
              ✓ Tanlash va Buyurtma →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default function BoostingPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    }>
      <BoostingContent />
    </Suspense>
  );
}
