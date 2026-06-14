"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, Listing, fmt } from "@/lib/supabase";
import { KarmaBadge, StatusBadge } from "@/components/ui/Badge";
import { Card, GradientCard } from "@/components/ui/Card";
import clsx from "clsx";

type Filter = "all" | "sale" | "rent";
type GameFilter = "all" | "MLBB" | "PUBG" | "CS2" | "Free Fire";

export default function MarketplacePage() {
  const [listings, setListings]     = useState<Listing[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<Filter>("all");
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");
  const [selected, setSelected]     = useState<Listing | null>(null);

  useEffect(() => {
    fetchListings();

    // Real-time: Admin tasdiqlasa darhol ko'rinadi!
    const channel = supabase
      .channel("marketplace-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "listings",
        filter: "status=eq.approved"
      }, () => fetchListings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    // Faqat TASDIQLANGAN e'lonlar ko'rinadi
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (!error && data) setListings(data);
    setLoading(false);
  };

  const filtered = listings.filter(l =>
    (filter === "all" || l.type === filter) &&
    (gameFilter === "all" || l.game === gameFilter)
  );

  const colorMap: Record<string, string> = {
    MLBB: "#00E5FF", "PUBG": "#FFD600", CS2: "#6C3FB5", "Free Fire": "#FF8C00",
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
    </div>
  );
    <div className="gsection py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-white mb-1">🏪 Akkaunt Bozori</h1>
          <p className="text-text-gray text-sm">
            Faqat admin tomonidan tasdiqlangan akkauntlar • Real-time yangilanadi
          </p>
        </div>
        <Link href="/login"
          className="flex items-center gap-2 bg-gradient-to-r from-purple to-cyan text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all self-start">
          ➕ Akkaunt qo'shish
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1.5 bg-card border border-border rounded-xl p-1">
          {(["all","sale","rent"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={clsx("text-xs px-4 py-2 rounded-lg font-semibold transition-all",
                filter===f ? "bg-cyan/20 text-cyan" : "text-text-gray hover:text-text-light")}>
              {f==="all"?"Barchasi":f==="sale"?"🛒 Sotish":"🔄 Ijara"}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 bg-card border border-border rounded-xl p-1 flex-wrap">
          {(["all","MLBB","PUBG","CS2","Free Fire"] as GameFilter[]).map(g => (
            <button key={g} onClick={() => setGameFilter(g)}
              className={clsx("text-xs px-3 py-2 rounded-lg font-semibold transition-all",
                gameFilter===g ? "bg-purple/20 text-purple-light" : "text-text-gray hover:text-text-light")}>
              {g==="all" ? "Barchasi" : g}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏪</div>
          <h3 className="text-text-white font-bold text-lg mb-2">Hozircha e'lon yo'q</h3>
          <p className="text-text-gray text-sm">Admin tasdiqlagan e'lonlar bu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(a => {
            const c = colorMap[a.game] || "#00E5FF";
            return (
              <button key={a.id} onClick={() => setSelected(a)} className="text-left">
                <Card hover style={{ borderColor: `${c}30` } as any} className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${c}15` }}>
                        {a.game==="MLBB"?"🗡️":a.game==="PUBG"?"🎯":a.game==="CS2"?"💣":"🔥"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm" style={{ color: c }}>{a.game}</p>
                          {a.verified && <span className="text-cyan text-xs">✅</span>}
                        </div>
                        <p className="text-text-white font-black text-base">{a.rank}</p>
                      </div>
                    </div>
                    <StatusBadge status={a.type} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { l:"Win Rate", v:`${a.win_rate}%`,  c:"text-green" },
                      { l:"O'yinlar", v:`${a.matches}`,    c:"text-cyan"  },
                    ].map(s => (
                      <div key={s.l} className="text-center bg-bg/50 rounded-xl py-2">
                        <p className={`font-black text-sm ${s.c}`}>{s.v}</p>
                        <p className="text-text-gray text-xs">{s.l}</p>
                      </div>
                    ))}
                    <div className="text-center bg-bg/50 rounded-xl py-2">
                      <p className="font-black text-sm text-gold">{a.type==="rent"?"Ijara":"Sotish"}</p>
                      <p className="text-text-gray text-xs">Turi</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-white text-xs font-bold">
                        {a.user_name[0]}
                      </div>
                      <span className="text-text-gray text-xs">{a.user_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-black">{fmt(a.price)} so'm</p>
                      {a.type === "rent" && <p className="text-text-gray text-xs">/kun</p>}
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-text-white">
                {selected.game === "MLBB"?"🗡️":selected.game==="PUBG"?"🎯":selected.game==="CS2"?"💣":"🔥"}{" "}
                {selected.game} — {selected.rank}
              </h2>
              <button onClick={() => setSelected(null)} className="text-text-gray hover:text-text-light text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                {l:"Win Rate",v:`${selected.win_rate}%`, c:"text-green"},
                {l:"O'yinlar", v:`${selected.matches}`,  c:"text-cyan" },
              ].map(s => (
                <div key={s.l} className="text-center bg-bg rounded-xl py-3">
                  <p className={`font-black ${s.c}`}>{s.v}</p>
                  <p className="text-text-gray text-xs">{s.l}</p>
                </div>
              ))}
            </div>

            {selected.description && (
              <div className="bg-bg border border-border rounded-xl p-3 mb-4">
                <p className="text-text-gray text-xs mb-1 font-semibold">Tavsif:</p>
                <p className="text-text-light text-sm">{selected.description}</p>
              </div>
            )}

            <div className="flex items-center gap-3 bg-bg rounded-xl p-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-white font-bold shrink-0">
                {selected.user_name[0]}
              </div>
              <div className="flex-1">
                <p className="text-text-white font-semibold text-sm">{selected.user_name}</p>
                <p className="text-text-gray text-xs">Sotuvchi</p>
              </div>
              {selected.verified && <span className="abadge-cyan text-xs">✅ Verified</span>}
            </div>

            <GradientCard gradient="from-green/10 to-card" className="border border-green/20 mb-5 text-sm text-text-gray">
              🛡️ Bu tranzaksiya <span className="text-green font-semibold">3 kunlik Escrow</span> bilan himoyalangan.
            </GradientCard>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-gray text-sm">{selected.type==="rent"?"Ijara narxi":"Sotish narxi"}</p>
                <p className="text-gold font-black text-2xl">
                  {fmt(selected.price)} so'm{selected.type==="rent"?" /kun":""}
                </p>
              </div>
              <StatusBadge status={selected.type} />
            </div>

            <Link href="/escrow"
              className="gbtn-primary block text-center py-3 rounded-xl font-bold"
              onClick={() => setSelected(null)}>
              {selected.type==="rent"?"🔄 Ijaraga olish":"🛒 Sotib olish"} — Escrow orqali
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
