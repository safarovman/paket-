"use client";
import { useState } from "react";
import { Card, GradientCard } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/constants";
import clsx from "clsx";

const ACTIVE_ESCROWS = [
  {
    id:"ESC-001", type:"boosting", title:"MLBB Solo Boosting", from:"Epic", to:"Legend",
    amount:138000, status:"in_progress", daysLeft:2, daysTotal:3,
    buyer:"Abdulloh K.", seller:"ProGamer99", date:"15 Yanvar 2024",
  },
  {
    id:"ESC-002", type:"account", title:"PUBG Mobile Akkaunt", from:"Conqueror", to:"",
    amount:1200000, status:"waiting", daysLeft:3, daysTotal:3,
    buyer:"Jasur M.", seller:"TopSniper", date:"14 Yanvar 2024",
  },
];

const HISTORY = [
  { id:"ESC-H01", title:"MLBB Duo Boosting",   amount:96000,  status:"completed", date:"10 Yan 2024" },
  { id:"ESC-H02", title:"PUBG Solo Boosting",   amount:72000,  status:"completed", date:"5 Yan 2024"  },
  { id:"ESC-H03", title:"Free Fire Akkaunt",    amount:350000, status:"refunded",  date:"1 Yan 2024"  },
];

const HOW_IT_WORKS = [
  { n:"1", icon:"💰", color:"#00E5FF", title:"To'lov Muzlatiladi",  desc:"Xaridor to'laydi — pul GBoost tranzit hamyonida qulflangan holda saqlanadi." },
  { n:"2", icon:"⚔️", color:"#6C3FB5", title:"Akkaunt Topshiriladi",desc:"Sotuvchi akkaunt login/parolini xaridorga darhol beradi — hech qanday kutish yo'q." },
  { n:"3", icon:"🔍", color:"#00C853", title:"3 Kun Tekshiruv",     desc:"Xaridor akkauntni sinab ko'radi, shikoyat bo'lmasa pul avtomatik sotuvchiga o'tadi." },
  { n:"4", icon:"⚠️", color:"#FF3D3D", title:"Muammo Chiqqanda",    desc:"Shikoyat bo'lsa moderator aralashadi, kerak bo'lsa pul xaridorga qaytariladi." },
];

export default function EscrowPage() {
  const [tab, setTab] = useState<"active"|"history"|"how">("active");
  const [approveId, setApproveId] = useState<string|null>(null);
  const [disputeId, setDisputeId] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;color:string}|null>(null);

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = () => {
    setApproveId(null);
    showToast("✅ Pul muvaffaqiyatli o'tkazildi!", "#00C853");
  };

  const handleDispute = () => {
    setDisputeId(null);
    showToast("⚠️ Shikoyat moderatorga yuborildi!", "#FFD600");
  };

  return (
    <div className="gsection py-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl animate-slide-up"
          style={{ background: toast.color }}>
          {toast.msg}
        </div>
      )}

      <div className="text-center">
        <h1 className="text-3xl font-black text-text-white mb-2">🛡️ Escrow Tizimi</h1>
        <p className="text-text-gray">Xaridor va sotuvchi ikkalasini ham himoya qilamiz</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-card border border-border rounded-xl p-1 max-w-sm mx-auto">
        {([
          { id:"active",  label:"Faol"         },
          { id:"history", label:"Tarix"        },
          { id:"how",     label:"Qanday ishlaydi" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx("flex-1 text-xs py-2 rounded-lg font-semibold transition-all",
              tab===t.id ? "bg-green/20 text-green" : "text-text-gray hover:text-text-light")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active escrows */}
      {tab === "active" && (
        <div className="space-y-5 max-w-2xl mx-auto">
          {ACTIVE_ESCROWS.length === 0
            ? <Card className="text-center py-14"><div className="text-4xl mb-3">🛡️</div><p className="text-text-gray">Faol Escrow yo'q</p></Card>
            : ACTIVE_ESCROWS.map(e => {
              const statusColors: Record<string, string> = { in_progress:"#00E5FF", waiting:"#FFD600", completed:"#00C853" };
              const c = statusColors[e.status] || "#90A4AE";
              const progress = ((e.daysTotal - e.daysLeft) / e.daysTotal) * 100;
              return (
                <Card key={e.id} style={{ borderColor:`${c}40` } as any}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-text-white">{e.title}</h3>
                      <p className="text-text-gray text-xs mt-0.5">{e.id} • {e.date}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                      style={{ background:`${c}20`, color:c, borderColor:`${c}40` }}>
                      {e.status==="in_progress"?"⚔️ Jarayonda":e.status==="waiting"?"⏳ Kutilmoqda":"✅ Tugadi"}
                    </span>
                  </div>

                  {/* Parties flow */}
                  <div className="flex items-center gap-3 bg-bg rounded-xl p-4 mb-4">
                    <PartyBox icon="👤" label="Xaridor" name={e.buyer} />
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-text-gray text-xs">
                        <span>→</span>
                        <span className="text-xs font-bold" style={{ color:c }}>Escrow</span>
                        <span>→</span>
                      </div>
                      <span className="text-lg">🛡️</span>
                      <span className="text-green text-xs font-semibold">{formatPrice(e.amount)} so'm</span>
                    </div>
                    <PartyBox icon="⚔️" label="Sotuvchi" name={e.seller} />
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-gray">Escrow muddati</span>
                      <span style={{ color:c }}>{e.daysLeft}/{e.daysTotal} kun qoldi</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width:`${progress}%`, background:c }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setApproveId(e.id)}
                      className="flex items-center justify-center gap-2 bg-green/15 hover:bg-green/25 border border-green/30 text-green font-semibold text-sm py-2.5 rounded-xl transition-colors">
                      ✅ Tasdiqlash
                    </button>
                    <button onClick={() => setDisputeId(e.id)}
                      className="flex items-center justify-center gap-2 bg-red/10 hover:bg-red/20 border border-red/30 text-red font-semibold text-sm py-2.5 rounded-xl transition-colors">
                      ⚠️ Shikoyat
                    </button>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3 max-w-2xl mx-auto">
          {HISTORY.map(h => (
            <Card key={h.id}>
              <div className="flex items-center gap-4">
                <div className={clsx("w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0",
                  h.status==="completed"?"bg-green/15":"bg-red/10")}>
                  {h.status==="completed"?"✅":"↩️"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text-white text-sm">{h.title}</p>
                  <p className="text-text-gray text-xs mt-0.5">{h.date} • {h.id}</p>
                </div>
                <div className="text-right">
                  <p className={clsx("font-black text-sm", h.status==="completed"?"text-green":"text-red")}>
                    {formatPrice(h.amount)} so'm
                  </p>
                  <p className={clsx("text-xs", h.status==="completed"?"text-green":"text-red")}>
                    {h.status==="completed"?"Tugadi":"Qaytarildi"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* How it works */}
      {tab === "how" && (
        <div className="max-w-2xl mx-auto space-y-4">
          <GradientCard gradient="from-green/15 to-card" className="border border-green/25 text-center py-8">
            <div className="text-5xl mb-4">🛡️</div>
            <h2 className="text-2xl font-black text-green mb-2">3 Kunlik Xavfsiz Savdo Tizimi</h2>
            <p className="text-text-gray text-sm">Escrow — Xaridor va Sotuvchini ikkalasini ham himoya qiladi</p>
          </GradientCard>
          {HOW_IT_WORKS.map((s,i) => (
            <Card key={s.n} style={{ borderColor:`${s.color}35` } as any}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background:`${s.color}20` }}>
                  {s.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background:`${s.color}25`, color:s.color }}>{s.n}</span>
                    <h3 className="font-bold" style={{ color:s.color }}>{s.title}</h3>
                  </div>
                  <p className="text-text-gray text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
              {i < HOW_IT_WORKS.length-1 && <div className="flex justify-center mt-3 text-text-gray">↓</div>}
            </Card>
          ))}
        </div>
      )}

      {/* Approve dialog */}
      {approveId && (
        <Dialog
          title="Tasdiqlash"
          body={`Haqiqatan ham pulni sotuvchiga o'tkazmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`}
          confirmLabel="Ha, tasdiqlash" confirmColor="bg-green text-white"
          onConfirm={handleApprove} onCancel={() => setApproveId(null)} />
      )}

      {/* Dispute dialog */}
      {disputeId && (
        <Dialog
          title="Shikoyat berish"
          body="Moderator tekshiradi va qaror qiladi. Muammo tasdiqlansa pul qaytariladi."
          confirmLabel="Shikoyat berish" confirmColor="bg-red text-white"
          onConfirm={handleDispute} onCancel={() => setDisputeId(null)} />
      )}
    </div>
  );
}

function PartyBox({ icon, label, name }: { icon:string; label:string; name:string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-text-white text-xs font-bold">{name}</span>
      <span className="text-text-gray text-xs">{label}</span>
    </div>
  );
}

function Dialog({ title, body, confirmLabel, confirmColor, onConfirm, onCancel }: {
  title:string; body:string; confirmLabel:string; confirmColor:string;
  onConfirm:()=>void; onCancel:()=>void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 animate-slide-up">
        <h3 className="text-lg font-black text-text-white mb-2">{title}</h3>
        <p className="text-text-gray text-sm leading-relaxed mb-5">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-border rounded-xl py-2.5 text-text-gray hover:bg-border/30 text-sm transition-colors">
            Bekor qilish
          </button>
          <button onClick={onConfirm} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 ${confirmColor}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
