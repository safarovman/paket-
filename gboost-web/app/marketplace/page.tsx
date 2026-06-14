"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, GradientCard } from "@/components/ui/Card";
import { KarmaBadge, StatusBadge } from "@/components/ui/Badge";
import { MARKET_ACCOUNTS, formatPrice } from "@/lib/constants";
import clsx from "clsx";

type Filter = "all" | "sale" | "rent";
type Game   = "all" | "MLBB" | "PUBG Mobile" | "CS2" | "Free Fire";

export default function MarketplacePage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [gameFilter, setGameFilter] = useState<Game>("all");
  const [selected, setSelected] = useState<(typeof MARKET_ACCOUNTS)[0] | null>(null);

  const accounts = MARKET_ACCOUNTS.filter(a =>
    (filter === "all" || a.type === filter) &&
    (gameFilter === "all" || a.game === gameFilter)
  );

  const colorMap: Record<string, string> = {
    cyan: "#00E5FF", gold: "#FFD600", purple: "#6C3FB5", orange: "#FF8C00",
  };

  return (
    <div className="gsection py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-white mb-1">🏪 Akkaunt Bozori</h1>
          <p className="text-text-gray text-sm">Xavfsiz akkaunt sotish, ijaraga olish va almashish</p>
        </div>
        <button className="gbtn-primary text-sm px-5 py-2.5 rounded-xl self-start sm:self-auto">
          ➕ Akkaunt qo'shish
        </button>
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
          {(["all","MLBB","PUBG Mobile","CS2","Free Fire"] as Game[]).map(g => (
            <button key={g} onClick={() => setGameFilter(g)}
              className={clsx("text-xs px-3 py-2 rounded-lg font-semibold transition-all",
                gameFilter===g ? "bg-purple/20 text-purple-light" : "text-text-gray hover:text-text-light")}>
              {g==="all"?"Barchasi":g}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:"Jami akkauntlar", value:`${MARKET_ACCOUNTS.length}`, color:"text-cyan"  },
          { label:"Sotish",          value:`${MARKET_ACCOUNTS.filter(a=>a.type==="sale").length}`, color:"text-green" },
          { label:"Ijara",           value:`${MARKET_ACCOUNTS.filter(a=>a.type==="rent").length}`, color:"text-gold"  },
        ].map(s => (
          <Card key={s.label} className="text-center py-3">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-text-gray text-xs mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Account grid */}
      {accounts.length === 0 ? (
        <Card className="text-center py-16 text-text-gray">
          <div className="text-4xl mb-3">🔍</div>
          <p>Bu filtr bo'yicha akkaunt topilmadi</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map(a => {
            const c = colorMap[a.color] || "#00E5FF";
            return (
              <button key={a.id} onClick={() => setSelected(a)} className="text-left">
                <Card hover className={`h-full`} style={{ borderColor:`${c}30` } as any}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background:`${c}15` }}>
                        {a.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                      { l:"Win Rate", v:`${a.winRate}%`,    color:"text-green"  },
                      { l:"O'yinlar", v:`${a.matches}`,     color:"text-cyan"   },
                      { l:"Karma",    v:`${a.karma}`,        color:"text-gold"   },
                    ].map(s => (
                      <div key={s.l} className="text-center bg-bg/50 rounded-xl py-2">
                        <p className={`font-black text-sm ${s.color}`}>{s.v}</p>
                        <p className="text-text-gray text-xs">{s.l}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                        {a.seller[0]}
                      </div>
                      <span className="text-text-gray text-xs">{a.seller}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-black">{formatPrice(a.price)} so'm</p>
                      {a.type === "rent" && <p className="text-text-gray text-xs">/kun</p>}
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-text-white">{selected.icon} {selected.game} — {selected.rank}</h2>
              <button onClick={() => setSelected(null)} className="text-text-gray hover:text-text-light text-xl w-8 h-8 rounded-lg hover:bg-border flex items-center justify-center">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { l:"Win Rate", v:`${selected.winRate}%`, c:"text-green"  },
                { l:"O'yinlar", v:`${selected.matches}`,  c:"text-cyan"   },
                { l:"Karma",    v:`${selected.karma}`,     c:"text-gold"   },
              ].map(s => (
                <div key={s.l} className="text-center bg-bg rounded-xl py-3">
                  <p className={`font-black ${s.c}`}>{s.v}</p>
                  <p className="text-text-gray text-xs">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-bg rounded-xl p-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold shrink-0">
                {selected.seller[0]}
              </div>
              <div className="flex-1">
                <p className="text-text-white font-semibold text-sm">{selected.seller}</p>
                <p className="text-text-gray text-xs">Sotuvchi</p>
              </div>
              <KarmaBadge karma={selected.karma} />
            </div>

            <GradientCard gradient="from-green/10 to-card" className="border border-green/20 mb-5 text-sm text-text-gray">
              🛡️ Bu tranzaksiya <span className="text-green font-semibold">3 kunlik Escrow</span> bilan himoyalangan. Akkaun tekshirilgach pul o'tkaziladi.
            </GradientCard>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-gray text-sm">{selected.type==="rent"?"Ijara narxi":"Sotish narxi"}</p>
                <p className="text-gold font-black text-2xl">{formatPrice(selected.price)} so'm{selected.type==="rent"?" /kun":""}</p>
              </div>
              <StatusBadge status={selected.type} />
            </div>

            <Link href="/escrow" className="gbtn-primary w-full block text-center py-3 rounded-xl font-bold" onClick={() => setSelected(null)}>
              {selected.type==="rent"?"🔄 Ijaraga olish":"🛒 Sotib olish"} — Escrow orqali
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
