"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";

interface Listing {
  id: string; user_name: string; game: string; rank: string;
  price: number; type: string; status: string; description: string | null;
  win_rate: number; matches: number; verified: boolean; created_at: string;
}

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const gameIcon = (g: string) => g==="MLBB"?"🗡️":g==="PUBG"?"🎯":g==="CS2"?"💣":"🔥";
const gameColor = (g: string) => g==="MLBB"?"#FF6B00":g==="PUBG"?"#FFD600":g==="CS2"?"#9B59B6":"#00C853";

export default function MarketplacePage() {
  const [listings, setListings]   = useState<Listing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [gameFilter, setGameFilter] = useState("all");
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState("newest");
  const [selected, setSelected]   = useState<Listing | null>(null);

  useEffect(() => {
    fetchListings();
    const ch = supabase.channel("mp-realtime")
      .on("postgres_changes" as any, { event:"*", schema:"public", table:"listings" }, fetchListings)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase.from("listings").select("*")
      .eq("status", "approved").order("created_at", { ascending: false });
    if (data) setListings(data);
    setLoading(false);
  };

  let filtered = listings.filter(l => {
    const mt = filter === "all" || l.type === filter;
    const mg = gameFilter === "all" || l.game === gameFilter;
    const ms = !search || l.game.toLowerCase().includes(search.toLowerCase()) ||
               l.rank.toLowerCase().includes(search.toLowerCase()) ||
               l.user_name.toLowerCase().includes(search.toLowerCase());
    return mt && mg && ms;
  });

  if (sortBy === "price_asc")  filtered = [...filtered].sort((a,b) => a.price - b.price);
  if (sortBy === "price_desc") filtered = [...filtered].sort((a,b) => b.price - a.price);
  if (sortBy === "winrate")    filtered = [...filtered].sort((a,b) => b.win_rate - a.win_rate);

  return (
    <div className="gsection py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">🏪 Akkaunt Bozori</h1>
          <p className="text-gray-500 text-sm">Admin tasdiqlagan akkauntlar • Real-time yangilanadi</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sell" className="gbtn text-sm px-4 py-2.5 rounded-xl">💰 Sotish</Link>
          <Link href="/rent" className="gbtn-outline text-sm px-4 py-2.5 rounded-xl">🔄 Ijara</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Type filter */}
        <div className="flex gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1">
          {[["all","Barchasi"],["sale","🛒 Sotish"],["rent","🔄 Ijara"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={clsx("text-xs px-3 py-1.5 rounded-lg font-semibold transition-all",
                filter===k ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-white")}>
              {l}
            </button>
          ))}
        </div>
        {/* Game filter */}
        <div className="flex gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 flex-wrap">
          {["all","MLBB","PUBG","CS2","Free Fire"].map(g => (
            <button key={g} onClick={() => setGameFilter(g)}
              className={clsx("text-xs px-3 py-1.5 rounded-lg font-semibold transition-all",
                gameFilter===g ? "bg-[#2A2A2A] text-white" : "text-gray-500 hover:text-white")}>
              {g==="all"?"Barchasi":g}
            </button>
          ))}
        </div>
        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-1.5 text-xs text-gray-400 outline-none">
          <option value="newest">🕐 Yangi</option>
          <option value="price_asc">💰 Arzon avval</option>
          <option value="price_desc">💰 Qimmat avval</option>
          <option value="winrate">🏆 Win rate</option>
        </select>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 O'yin, rank yoki sotuvchi bo'yicha qidirish..."
          className="ginput pl-10 max-w-sm" />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">🔍</span>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-gray-500">{filtered.length} ta e'lon topildi</span>
        {filter !== "all" && <span className="text-orange-400 font-semibold">• {filter==="sale"?"Sotish":"Ijara"} filtri</span>}
        {gameFilter !== "all" && <span className="text-orange-400 font-semibold">• {gameFilter}</span>}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl">
          <div className="text-5xl mb-3">🏪</div>
          <h3 className="text-white font-bold text-lg mb-2">E'lon topilmadi</h3>
          <p className="text-gray-500 text-sm mb-5">Admin tasdiqlagan e'lonlar bu yerda ko'rinadi</p>
          <Link href="/sell" className="gbtn inline-flex px-6 py-2.5 rounded-xl">
            💰 Akkaunt Sotish
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(a => {
            const c = gameColor(a.game);
            return (
              <button key={a.id} onClick={() => setSelected(a)} className="text-left w-full">
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all group h-full">
                  {/* Image placeholder */}
                  <div className="h-36 flex items-center justify-center text-5xl"
                    style={{ background:`${c}15` }}>
                    {gameIcon(a.game)}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm" style={{ color: c }}>{a.game}</p>
                        <p className="text-white font-black text-base">{a.rank}</p>
                      </div>
                      <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border",
                        a.type==="rent" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-green-500/15 text-green-400 border-green-500/30")}>
                        {a.type==="rent" ? "🔄 Ijara" : "🛒 Sotish"}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-2">
                      {"⭐".repeat(Math.min(5, Math.floor(a.win_rate / 15)))}
                      <span className="text-gray-600 text-xs ml-1">{a.win_rate}% win</span>
                    </div>

                    {a.description && (
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">{a.description}</p>
                    )}

                    <div className="flex items-center justify-between border-t border-[#2A2A2A] pt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-lg bg-orange-gradient flex items-center justify-center text-white text-xs font-bold">
                          {a.user_name[0]}
                        </div>
                        <span className="text-gray-600 text-xs">{a.user_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-400 font-black text-sm">{fmt(a.price)} so'm</p>
                        {a.type==="rent" && <p className="text-gray-600 text-xs">/kun</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-lg overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}>
            {/* Header image */}
            <div className="h-40 flex items-center justify-center text-6xl"
              style={{ background:`${gameColor(selected.game)}15` }}>
              {gameIcon(selected.game)}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-base" style={{ color: gameColor(selected.game) }}>{selected.game}</p>
                  <h2 className="text-2xl font-black text-white">{selected.rank}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { l:"Win Rate",  v:`${selected.win_rate}%`,  c:"text-green-400" },
                  { l:"O'yinlar",  v:`${selected.matches}`,    c:"text-orange-400"},
                  { l:"Turi",      v:selected.type==="rent"?"Ijara":"Sotish", c:"text-white" },
                ].map(s => (
                  <div key={s.l} className="bg-[#111] rounded-xl p-3 text-center">
                    <p className={`font-black ${s.c}`}>{s.v}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div className="bg-[#111] rounded-xl p-3 mb-4">
                  <p className="text-gray-500 text-xs font-semibold mb-1">📝 Tavsif:</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.description}</p>
                </div>
              )}

              <div className="flex items-center gap-3 bg-[#111] rounded-xl p-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-orange-gradient flex items-center justify-center text-white font-bold shrink-0">
                  {selected.user_name[0]}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{selected.user_name}</p>
                  <p className="text-gray-500 text-xs">Sotuvchi</p>
                </div>
                {selected.verified && <span className="ml-auto gbadge-orange text-xs">✅ Verified</span>}
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 text-xs text-gray-500">
                🛡️ <span className="text-green-400 font-semibold">3 kunlik Escrow himoyasi</span> — pul tekshirish tugagandan keyin o'tkaziladi
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-500 text-sm">{selected.type==="rent"?"Ijara narxi (kunlik)":"Sotish narxi"}</p>
                  <p className="text-orange-400 font-black text-2xl">{fmt(selected.price)} so'm{selected.type==="rent"?" /kun":""}</p>
                </div>
              </div>

              <Link href={`/checkout?listing=${selected.id}`}
                className="gbtn block text-center py-3.5 rounded-xl font-bold text-base"
                onClick={() => setSelected(null)}>
                {selected.type==="rent" ? "🔄 Ijaraga Olish" : "🛒 Sotib Olish"} — Escrow orqali
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
