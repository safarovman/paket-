"use client";
import { useState } from "react";
import clsx from "clsx";

const METHODS = [
  { id:"click",  name:"Click",  icon:"📱", color:"#1976D2", min:10000  },
  { id:"payme",  name:"Payme",  icon:"📲", color:"#00A4CF", min:10000  },
  { id:"uzcard", name:"Uzcard", icon:"💳", color:"#0066CC", min:10000  },
  { id:"humo",   name:"Humo",   icon:"💳", color:"#00A651", min:10000  },
];

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const HISTORY = [
  { type:"in",  amount:100000, method:"Click",  date:"2024-01-15", status:"completed", desc:"Hisob to'ldirildi" },
  { type:"out", amount:50000,  method:"Uzcard", date:"2024-01-14", status:"completed", desc:"Akkaunt sotib olindi" },
  { type:"in",  amount:200000, method:"Payme",  date:"2024-01-12", status:"completed", desc:"Hisob to'ldirildi" },
  { type:"in",  amount:75000,  method:"Humo",   date:"2024-01-10", status:"pending",   desc:"Kutilmoqda..." },
];

export default function WalletPage() {
  const [balance]    = useState(325000);
  const [method, setMethod] = useState("click");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<"topup"|"history">("topup");

  const selectedMethod = METHODS.find(m => m.id === method)!;
  const numAmount = Number(amount);
  const isValid = numAmount >= selectedMethod.min;

  const handleTopup = async () => {
    if (!isValid) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setAmount("");
  };

  const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

  return (
    <div className="gsection py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-2">💰 Hamyon</h1>
        <p className="text-gray-500 mb-8">Hisobingizni to'ldiring va bozordan foydalaning</p>

        {/* Balance card */}
        <div className="bg-gradient-to-br from-orange-500/20 to-[#1A1A1A] border border-orange-500/30 rounded-2xl p-6 mb-6">
          <p className="text-gray-400 text-sm mb-1">Joriy balans</p>
          <p className="text-4xl font-black text-white mb-1">{fmt(balance)}</p>
          <p className="text-orange-400 font-semibold">so'm</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-black/30 rounded-xl p-3">
              <p className="text-gray-400">Jami kirim</p>
              <p className="text-green-400 font-bold text-base mt-1">{fmt(375000)} so'm</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3">
              <p className="text-gray-400">Jami chiqim</p>
              <p className="text-red-400 font-bold text-base mt-1">{fmt(50000)} so'm</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 mb-5">
          <button onClick={() => setTab("topup")}
            className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
              tab==="topup" ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-white")}>
            ➕ To'ldirish
          </button>
          <button onClick={() => setTab("history")}
            className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
              tab==="history" ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-white")}>
            📋 Tarix
          </button>
        </div>

        {tab === "topup" && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 space-y-5 animate-fade-in">

            {success && (
              <div className="bg-green-500/15 border border-green-500/30 rounded-xl p-4 text-center animate-fade-in">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-green-400 font-bold">To'lov muvaffaqiyatli!</p>
                <p className="text-gray-500 text-sm mt-1">Balans yangilanadi</p>
              </div>
            )}

            {/* To'lov usuli */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">💳 To'lov usuli</label>
              <div className="grid grid-cols-4 gap-2">
                {METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className={clsx("flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all",
                      method===m.id ? "border-orange-500/60 bg-orange-500/10" : "border-[#2A2A2A] bg-[#111] hover:border-[#3A3A3A]")}>
                    <span className="text-xl">{m.icon}</span>
                    <span className={`text-xs font-bold ${method===m.id?"text-orange-400":"text-gray-500"}`}>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Miqdor */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">
                💵 Miqdor <span className="text-gray-600">(min {fmt(selectedMethod.min)} so'm)</span>
              </label>
              <div className="relative">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="100 000" className="ginput pr-16 text-xl font-bold" min={selectedMethod.min} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">so'm</span>
              </div>
              {amount && numAmount > 0 && (
                <p className="text-orange-400 text-sm mt-1.5 font-semibold">{fmt(numAmount)} so'm</p>
              )}
            </div>

            {/* Tez miqdorlar */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">Tez tanlash</label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(a.toString())}
                    className={clsx("py-2 rounded-xl border text-xs font-bold transition-all",
                      amount===a.toString() ? "border-orange-500 bg-orange-500/20 text-orange-400" : "border-[#2A2A2A] text-gray-500 hover:text-white")}>
                    {fmt(a)}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleTopup} disabled={!isValid || loading}
              className="gbtn w-full py-3.5 rounded-xl text-base disabled:opacity-40">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />To'lanmoqda...</>
                : `${selectedMethod.icon} ${selectedMethod.name} orqali To'lash`}
            </button>

            {!isValid && amount && (
              <p className="text-red-400 text-xs text-center">Min miqdor: {fmt(selectedMethod.min)} so'm</p>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3 animate-fade-in">
            {HISTORY.map((h, i) => (
              <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-4">
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
                  h.type==="in" ? "bg-green-500/15" : "bg-red-500/10")}>
                  {h.type==="in" ? "📥" : "📤"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{h.desc}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{h.method} • {h.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={clsx("font-black text-sm", h.type==="in"?"text-green-400":"text-red-400")}>
                    {h.type==="in"?"+":"-"}{fmt(h.amount)} so'm
                  </p>
                  <span className={clsx("text-xs", h.status==="completed"?"text-green-400":"text-yellow-400")}>
                    {h.status==="completed"?"✅":"⏳"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
