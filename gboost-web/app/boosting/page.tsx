"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, GradientCard } from "@/components/ui/Card";
import { GAMES, SERVICE_TYPES, PAYMENT_METHODS, COMMISSION, formatPrice } from "@/lib/constants";
import clsx from "clsx";

type Step = 1 | 2 | 3 | 4;

export default function BoostingPage() {
  const [step, setStep]           = useState<Step>(1);
  const [gameIdx, setGameIdx]     = useState(0);
  const [service, setService]     = useState("solo");
  const [fromRank, setFromRank]   = useState(0);
  const [toRank, setToRank]       = useState(2);
  const [payment, setPayment]     = useState("humo");
  const [ordered, setOrdered]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const game = GAMES[gameIdx];
  const svcObj = SERVICE_TYPES.find(s => s.id === service)!;
  const rankDiff = Math.max(toRank - fromRank, 1);
  const base = game.basePrice * rankDiff * (1 - svcObj.discount);
  const commission = base * COMMISSION;
  const total = base + commission;

  const handleOrder = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setOrdered(true);
  };

  if (ordered) return <SuccessScreen gameIcon={game.icon} game={game.short} fromRank={game.ranks[fromRank]} toRank={game.ranks[toRank]} total={total} />;

  const stepLabels = ["O'yin","Xizmat","Rank & Narx","To'lov"];

  return (
    <div className="gsection py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-text-white mb-2">⚔️ Boosting Xizmati</h1>
          <p className="text-text-gray">Reytingingizni ko'taring — xavfsiz va tez</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {stepLabels.map((lbl, i) => {
            const s = (i + 1) as Step;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    done   ? "bg-green text-white" :
                    active ? "bg-gradient-primary text-white shadow-cyan" :
                             "bg-card border border-border text-text-gray")}>
                    {done ? "✓" : s}
                  </div>
                  <span className={clsx("text-xs mt-1 hidden sm:block", active ? "text-cyan font-semibold" : "text-text-gray")}>{lbl}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={clsx("flex-1 h-0.5 mx-2", done ? "bg-green" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Game */}
        {step === 1 && (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-xl font-bold text-text-white mb-1">O'yin tanlang</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {GAMES.map((g, i) => (
                <button key={g.id} onClick={() => setGameIdx(i)}
                  className={clsx("p-5 rounded-2xl border text-left transition-all hover:scale-[1.02]",
                    gameIdx===i ? "shadow-cyan scale-[1.02]" : "border-border hover:border-current/30")}
                  style={{ background:`${g.color}${gameIdx===i?"20":"10"}`, borderColor: gameIdx===i ? `${g.color}80` : undefined }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{g.icon}</span>
                    <div>
                      <p className="font-black text-base" style={{ color: g.color }}>{g.short}</p>
                      <p className="text-text-gray text-xs">{g.name}</p>
                    </div>
                    {gameIdx===i && <span className="ml-auto text-xl">✅</span>}
                  </div>
                  <p className="text-text-gray text-xs">{g.ranks.length} rank darajasi • Solo & Duo</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: g.color }}>
                    {formatPrice(g.basePrice)} so'mdan
                  </p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="gbtn-primary w-full mt-2">Davom etish →</button>
          </div>
        )}

        {/* Step 2 — Service */}
        {step === 2 && (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-xl font-bold text-text-white mb-1">Xizmat turini tanlang</h2>
            <div className="space-y-3">
              {SERVICE_TYPES.map(s => (
                <button key={s.id} onClick={() => setService(s.id)}
                  className={clsx("w-full p-5 rounded-2xl border text-left transition-all",
                    service===s.id ? "border-cyan bg-cyan/10 shadow-cyan" : "border-border bg-card hover:border-cyan/30")}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className={clsx("font-bold text-base", service===s.id?"text-cyan":"text-text-white")}>{s.name}</p>
                        {s.discount > 0 && (
                          <span className="text-xs bg-green/15 text-green border border-green/30 rounded-full px-2.5 py-0.5 font-bold">
                            {(s.discount*100).toFixed(0)}% chegirma 🎉
                          </span>
                        )}
                        {s.discount < 0 && (
                          <span className="text-xs bg-purple/15 text-purple-light border border-purple/30 rounded-full px-2.5 py-0.5 font-bold">
                            Premium xizmat
                          </span>
                        )}
                      </div>
                      <p className="text-text-gray text-sm mt-1">{s.desc}</p>
                    </div>
                    {service===s.id && <span className="text-xl text-cyan shrink-0">✅</span>}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(1)} className="flex-1 border border-border rounded-xl py-3 text-text-gray hover:bg-card text-sm transition-colors">← Orqaga</button>
              <button onClick={() => setStep(3)} className="flex-1 gbtn-primary">Davom etish →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Rank & Price */}
        {step === 3 && (
          <div className="animate-slide-up space-y-5">
            <h2 className="text-xl font-bold text-text-white mb-1">Rank va narx</h2>

            {/* Game info */}
            <GradientCard gradient="from-card to-navy" className="border flex items-center gap-4"
              style={{ borderColor:`${game.color}40` }}>
              <span className="text-4xl">{game.icon}</span>
              <div>
                <p className="font-black" style={{ color: game.color }}>{game.name}</p>
                <p className="text-text-gray text-sm">{svcObj.name}</p>
              </div>
            </GradientCard>

            {/* Rank selectors */}
            <div className="grid grid-cols-2 gap-4">
              <RankSelector label="Hozirgi Rank 🔴" ranks={game.ranks} selected={fromRank} color={game.color}
                onChange={v => { setFromRank(v); if(toRank<=v) setToRank(Math.min(v+1,game.ranks.length-1)); }} />
              <RankSelector label="Maqsad Rank 🟢" ranks={game.ranks} selected={toRank} color="#00C853"
                onChange={v => { if(v>fromRank) setToRank(v); }} />
            </div>

            {/* Rank diff badge */}
            <div className="flex items-center justify-center gap-4">
              <span className="px-4 py-2 rounded-xl border text-sm font-bold" style={{ background:`${game.color}20`, color:game.color, borderColor:`${game.color}40` }}>
                {game.ranks[fromRank]}
              </span>
              <span className="text-text-gray text-xl">→</span>
              <span className="px-4 py-2 rounded-xl border border-green/40 bg-green/15 text-green text-sm font-bold">
                {game.ranks[toRank]}
              </span>
              <span className="text-cyan text-sm font-bold">+{rankDiff} rank</span>
            </div>

            {/* Price calculator */}
            <Card className="border-gold/25">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💰</span>
                <h3 className="font-bold text-gold">Narx Kalkulyatori</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { label:"Boosting narxi", value:`${formatPrice(Math.round(base))} so'm`, color:"text-text-light" },
                  { label:`GBoost komissiyasi (${(COMMISSION*100).toFixed(0)}%)`, value:`${formatPrice(Math.round(commission))} so'm`, color:"text-text-gray" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-text-gray text-sm">{r.label}</span>
                    <span className={`text-sm font-semibold ${r.color}`}>{r.value}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2.5 flex justify-between items-center">
                  <span className="font-bold text-text-white">Jami:</span>
                  <span className="text-gold font-black text-xl">{formatPrice(Math.round(total))} so'm</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-border rounded-xl py-3 text-text-gray hover:bg-card text-sm transition-colors">← Orqaga</button>
              <button onClick={() => setStep(4)} className="flex-1 gbtn-primary">Davom etish →</button>
            </div>
          </div>
        )}

        {/* Step 4 — Payment & Confirm */}
        {step === 4 && (
          <div className="animate-slide-up space-y-5">
            <h2 className="text-xl font-bold text-text-white mb-1">To'lov va tasdiqlash</h2>

            {/* Order summary */}
            <GradientCard gradient="from-card to-navy" className="border border-border">
              <h3 className="font-bold text-text-white mb-3">📋 Buyurtma xulosasi</h3>
              <div className="space-y-2">
                {[
                  { l:"O'yin",    v:`${game.icon} ${game.name}` },
                  { l:"Xizmat",  v:svcObj.name },
                  { l:"Rank",    v:`${game.ranks[fromRank]} → ${game.ranks[toRank]}` },
                  { l:"Himoya",  v:"🛡️ 3 kunlik Escrow", vc:"text-green" },
                  { l:"Vaqt",    v:"⏰ 12-24 soat", vc:"text-gold" },
                ].map(r => (
                  <div key={r.l} className="flex justify-between text-sm">
                    <span className="text-text-gray">{r.l}:</span>
                    <span className={r.vc || "text-text-light font-medium"}>{r.v}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold text-text-white">Jami:</span>
                  <span className="font-black text-xl text-gold">{formatPrice(Math.round(total))} so'm</span>
                </div>
              </div>
            </GradientCard>

            {/* Payment methods */}
            <div>
              <p className="text-text-gray text-sm font-medium mb-3">💳 To'lov usuli:</p>
              <div className="grid grid-cols-4 gap-2.5">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => setPayment(m.id)}
                    className={clsx("flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all",
                      payment===m.id ? "border-cyan bg-cyan/10 text-cyan shadow-cyan" : "border-border bg-card text-text-gray hover:border-cyan/30")}>
                    <span className="text-xl">{m.icon}</span>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Escrow info */}
            <GradientCard gradient="from-green/10 to-card" className="border border-green/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">🛡️</span>
                <div className="text-sm text-text-gray leading-relaxed">
                  To'lovingiz <span className="text-green font-semibold">3 kun Escrow himoyasida</span> saqlanadi.
                  Boosting tugagach avtomatik o'tkaziladi. Muammo chiqsa — pul qaytariladi.
                </div>
              </div>
            </GradientCard>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 border border-border rounded-xl py-3 text-text-gray hover:bg-card text-sm transition-colors">← Orqaga</button>
              <button onClick={handleOrder} disabled={loading}
                className="flex-1 gbtn-primary disabled:opacity-60">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Yuborilmoqda...</span>
                  : `✅ Buyurtma berish — ${formatPrice(Math.round(total))} so'm`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RankSelector({ label, ranks, selected, color, onChange }: {
  label:string; ranks:string[]; selected:number; color:string; onChange:(v:number)=>void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <p className="text-xs font-semibold mb-2" style={{ color }}>{label}</p>
      <button onClick={() => setOpen(!open)} type="button"
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all"
        style={{ background:`${color}15`, borderColor:`${color}50`, color }}>
        <span>{ranks[selected]}</span>
        <span className={clsx("transition-transform", open && "rotate-180")}>▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
          {ranks.map((r, i) => (
            <button key={r} onClick={() => { onChange(i); setOpen(false); }} type="button"
              className={clsx("w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                selected===i ? "bg-cyan/10 text-cyan font-bold" : "text-text-light hover:bg-card/80")}>
              {selected===i && "✓ "}{r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SuccessScreen({ gameIcon, game, fromRank, toRank, total }: {
  gameIcon:string; game:string; fromRank:string; toRank:string; total:number;
}) {
  return (
    <div className="gsection py-16 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-green/15 border-2 border-green flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">✅</span>
        </div>
        <h1 className="text-3xl font-black text-text-white mb-3">Buyurtma qabul qilindi! 🎉</h1>
        <p className="text-text-gray mb-2">{gameIcon} {game}: <span className="text-red font-semibold">{fromRank}</span> → <span className="text-green font-semibold">{toRank}</span></p>
        <p className="text-gold font-black text-xl mb-4">{formatPrice(Math.round(total))} so'm</p>
        <GradientCard gradient="from-green/10 to-card" className="border border-green/20 mb-6 text-sm text-text-gray">
          🛡️ To'lovingiz Escrow himoyasida. Booster tez orada buyurtmangizni qabul qiladi.
        </GradientCard>
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1 gbtn-outline text-sm py-3 rounded-xl">🏠 Dashboard</Link>
          <Link href="/escrow" className="flex-1 gbtn-primary text-sm py-3 rounded-xl">🛡️ Escrowni Ko'rish</Link>
        </div>
      </div>
    </div>
  );
}
