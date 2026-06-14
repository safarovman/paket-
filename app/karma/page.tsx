"use client";
import { useState } from "react";
import { Card, GradientCard } from "@/components/ui/Card";
import { KARMA_LEVELS } from "@/lib/constants";
import clsx from "clsx";

const MY_KARMA = 78;

const HISTORY = [
  { type:"gain", pts:5,   reason:"Buyurtma muvaffaqiyatli bajarildi",  date:"2 kun oldin"   },
  { type:"gain", pts:3,   reason:"5 yulduzli sharh olindi",            date:"5 kun oldin"   },
  { type:"loss", pts:-5,  reason:"Kechikish — shikoyat tasdiqlandi",   date:"1 hafta oldin" },
  { type:"gain", pts:5,   reason:"Buyurtma muvaffaqiyatli bajarildi",  date:"2 hafta oldin" },
  { type:"loss", pts:-20, reason:"Takroriy shikoyat — Soft Ban",       date:"3 hafta oldin" },
];

const PENALTIES = [
  { icon:"⚠️", level:"Ogohlantirish",         karma:"-5",  action:"Xabar yuboriladi",    color:"#FFD600", desc:"Birinchi qoidabuzarlik. Akkaunt bloklanmaydi." },
  { icon:"🔒", level:"Soft Ban (vaqtincha)",   karma:"-20", action:"7-30 kunlik bloklash", color:"#FF8C00", desc:"Takroriy buzarlik. Vaqtincha platforma foydalanishdan mahrum." },
  { icon:"🚫", level:"Hard Ban (umrbod)",      karma:"∞",   action:"Doimiy bloklash",      color:"#FF3D3D", desc:"Jiddiy firibgarlik. Akkaunt va pul doimiy muzlatiladi." },
];

export default function KarmaPage() {
  const [tab, setTab] = useState<"mine"|"history"|"system">("mine");

  const karmaColor = MY_KARMA >= 80 ? "#00C853" : MY_KARMA >= 40 ? "#FFD600" : "#FF3D3D";
  const karmaLabel = MY_KARMA >= 80 ? "Yuqori" : MY_KARMA >= 40 ? "O'rtacha" : "Past";
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - MY_KARMA / 100);

  return (
    <div className="gsection py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-black text-text-white mb-2">⭐ Karma Tizimi</h1>
        <p className="text-text-gray">AI asosidagi xavfsizlik tizimi — Firibgarlik nolga tushadi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-card border border-border rounded-xl p-1 max-w-sm mx-auto">
        {([
          { id:"mine",    label:"Mening Karma" },
          { id:"history", label:"Tarix"        },
          { id:"system",  label:"Jazo tizimi"  },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx("flex-1 text-xs py-2 rounded-lg font-semibold transition-all",
              tab===t.id ? "bg-cyan/20 text-cyan" : "text-text-gray hover:text-text-light")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* My karma */}
      {tab === "mine" && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Karma circle card */}
          <GradientCard gradient="from-card to-navy" className="border"
            style={{ borderColor:`${karmaColor}30` } as any}>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* SVG circle */}
              <div className="relative w-36 h-36 shrink-0">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#1A2245" strokeWidth="8" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke={karmaColor} strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset}
                    strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black" style={{ color: karmaColor }}>{MY_KARMA}</span>
                  <span className="text-text-gray text-xs">/100</span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-2xl font-black mb-1" style={{ color: karmaColor }}>{karmaLabel}</p>
                <p className="text-text-gray text-sm mb-4">
                  {MY_KARMA >= 80
                    ? "Ajoyib! Siz ishonchli foydalanuvchisiz 🏆"
                    : MY_KARMA >= 40
                      ? "Yaxshi, lekin yaxshilanish mumkin 📈"
                      : "Ehtiyot bo'ling! Ban xavfi mavjud ⚠️"}
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-gray">Progress</span>
                      <span style={{ color: karmaColor }}>{MY_KARMA}/100</span>
                    </div>
                    <div className="h-2.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width:`${MY_KARMA}%`, background:karmaColor }} />
                    </div>
                  </div>
                  <p className="text-green text-xs">+{100 - MY_KARMA} ball → Yuqori daraja</p>
                </div>
              </div>
            </div>
          </GradientCard>

          {/* Karma levels */}
          <div>
            <h2 className="text-lg font-bold text-text-white mb-3">Karma darajalari</h2>
            <div className="space-y-3">
              {KARMA_LEVELS.map(lv => {
                const c = { green:"#00C853", gold:"#FFD600", red:"#FF3D3D" }[lv.color];
                const isActive = MY_KARMA >= lv.min && MY_KARMA <= lv.max;
                return (
                  <Card key={lv.label} style={{ borderColor:isActive?`${c}60`:"#1A2245" } as any}
                    className={isActive ? "shadow-lg" : ""}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                        style={{ background:`${c}20`, color:c }}>
                        {lv.min}-{lv.max}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-base" style={{ color:c }}>{lv.label}</span>
                          {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                              style={{ background:`${c}20`, color:c }}>Siz</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {lv.perks.map(p => (
                            <span key={p} className="text-xs text-text-gray">• {p}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* AI info */}
          <Card className="border-purple/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🤖</span>
              <div>
                <h3 className="font-bold text-purple-light mb-1">AI Karma Moduli</h3>
                <p className="text-text-gray text-sm leading-relaxed">
                  GBoost AI tizimi har bir tranzaksiyani kuzatib boradi. Foydalanuvchi shikoyat bergach,
                  AI xatti-harakatni tahlil qiladi, moderator qarorni tasdiqlaydi va karma avtomatik yangilanadi.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3 max-w-2xl mx-auto">
          {HISTORY.map((h, i) => {
            const isGain = h.type === "gain";
            const c = isGain ? "#00C853" : "#FF3D3D";
            return (
              <Card key={i}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background:`${c}15` }}>
                    {isGain ? "📈" : "📉"}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-light text-sm font-medium">{h.reason}</p>
                    <p className="text-text-gray text-xs mt-0.5">{h.date}</p>
                  </div>
                  <span className="text-xl font-black" style={{ color:c }}>
                    {isGain ? "+" : ""}{h.pts}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Penalty system */}
      {tab === "system" && (
        <div className="max-w-2xl mx-auto space-y-4">
          <GradientCard gradient="from-red/10 to-card" className="border border-red/20 text-center py-8">
            <div className="text-5xl mb-3">⚠️</div>
            <h2 className="text-2xl font-black text-red mb-2">Jazo Tizimi</h2>
            <p className="text-text-gray text-sm max-w-md mx-auto leading-relaxed">
              Foydalanuvchi shikoyat beradi → AI tahlil qiladi → Moderator tasdiqlaydi → Jazo qo'llaniladi
            </p>
          </GradientCard>

          {PENALTIES.map((p, i) => (
            <Card key={p.level} style={{ borderColor:`${p.color}40` } as any}>
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">{p.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="font-bold" style={{ color:p.color }}>{p.level}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold border"
                      style={{ background:`${p.color}15`, color:p.color, borderColor:`${p.color}40` }}>
                      {p.action}
                    </span>
                  </div>
                  <p className="text-text-gray text-sm leading-relaxed mb-2">{p.desc}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-gray">Karma o'zgarishi:</span>
                    <span className="text-xs font-bold text-red">{p.karma}</span>
                  </div>
                </div>
              </div>
              {i < PENALTIES.length-1 && (
                <div className="flex justify-center mt-3 text-text-gray text-xs">↓ Kuchayadi</div>
              )}
            </Card>
          ))}

          <Card className="border-green/25">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">💡</span>
              <p className="text-text-gray text-sm leading-relaxed">
                <span className="text-green font-semibold">Karma oshirish uchun:</span>{" "}
                Buyurtmalarni vaqtida bajaring, muloqotda hurmatli bo'ling va hech qachon firibgarlik qilmang!
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
