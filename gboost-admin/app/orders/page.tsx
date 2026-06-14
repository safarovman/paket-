"use client";
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { MOCK_ORDERS, Order } from "@/lib/db";
import clsx from "clsx";

const formatP = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function OrdersPage() {
  const [orders, setOrders]         = useState<Order[]>(MOCK_ORDERS);
  const [selected, setSelected]     = useState<Order | null>(null);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [toast, setToast]           = useState<{msg:string;type:"success"|"error"}|null>(null);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (id: string) => {
    setOrders(p => p.map(o => o.id === id ? { ...o, status: "approved" } : o));
    setSelected(null);
    showToast("✅ Buyurtma tasdiqlandi!");
  };

  const handleReject = (id: string) => {
    if (!rejectNote.trim()) { showToast("Rad etish sababini yozing!", "error"); return; }
    setOrders(p => p.map(o => o.id === id ? { ...o, status: "rejected", note: rejectNote } : o));
    setSelected(null); setRejectNote("");
    showToast("❌ Buyurtma rad etildi.");
  };

  const handleResolveDispute = (id: string, winner: "buyer"|"seller") => {
    setOrders(p => p.map(o => o.id === id ? { ...o, status: "completed" } : o));
    setSelected(null);
    showToast(winner === "buyer" ? "✅ Nizo hal qilindi — pul xaridorga qaytarildi" : "✅ Nizo hal qilindi — pul boosterga o'tkazildi");
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = o.userName.toLowerCase().includes(search.toLowerCase()) ||
                        o.id.toLowerCase().includes(search.toLowerCase()) ||
                        o.game.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusMap: Record<string, {label:string; cls:string}> = {
    pending:   { label:"⏳ Kutilmoqda", cls:"abadge-gold"   },
    approved:  { label:"✅ Tasdiqlandi",cls:"abadge-cyan"   },
    completed: { label:"🏁 Tugadi",     cls:"abadge-green"  },
    rejected:  { label:"❌ Rad etildi", cls:"abadge-red"    },
    disputed:  { label:"⚠️ Nizo",       cls:"abadge-red"    },
  };

  const gameIcon: Record<string, string> = { MLBB:"🗡️", PUBG:"🎯", "Free Fire":"🔥", CS2:"💣" };

  const counts = {
    all:      orders.length,
    pending:  orders.filter(o=>o.status==="pending").length,
    approved: orders.filter(o=>o.status==="approved").length,
    disputed: orders.filter(o=>o.status==="disputed").length,
    completed:orders.filter(o=>o.status==="completed").length,
    rejected: orders.filter(o=>o.status==="rejected").length,
  };

  return (
    <AdminLayout>
      {toast && (
        <div className={clsx("fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl",
          toast.type==="success"?"bg-green":"bg-red")}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">📦 Buyurtmalar</h1>
        <p className="text-text-gray text-sm">Barcha buyurtmalarni ko'ring va tasdiqlang</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all flex items-center gap-1.5",
              filter === key ? "bg-cyan/20 border-cyan/40 text-cyan" : "bg-card border-border text-text-gray hover:text-text-light")}>
            {key==="all"?"Barchasi":key==="pending"?"⏳ Kutilmoqda":key==="approved"?"✅ Tasdiqlandi":
             key==="disputed"?"⚠️ Nizo":key==="completed"?"🏁 Tugadi":"❌ Rad etildi"}
            <span className={clsx("w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
              filter===key?"bg-cyan text-bg":"bg-border text-text-gray")}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Ism, buyurtma ID yoki o'yin bo'yicha qidirish..."
          className="ainput max-w-sm" />
      </div>

      {/* Orders table */}
      <div className="acard p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                {["ID","Foydalanuvchi","O'yin","Xizmat","Rank","Narx","Status","Sana","Amal"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-text-gray text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-text-gray">Buyurtma topilmadi</td></tr>
              ) : filtered.map((o, i) => (
                <tr key={o.id} className={clsx("border-b border-border/50 hover:bg-bg/50 transition-colors", i%2===0?"":"bg-bg/20")}>
                  <td className="py-3 px-4 text-cyan text-xs font-mono">{o.id}</td>
                  <td className="py-3 px-4 text-text-white text-sm font-medium">{o.userName}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-sm">
                      {gameIcon[o.game] || "🎮"} {o.game}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-gray text-xs">{o.service}</td>
                  <td className="py-3 px-4 text-text-gray text-xs">{o.fromRank} → {o.toRank}</td>
                  <td className="py-3 px-4 text-gold text-sm font-bold">{formatP(o.price)} so'm</td>
                  <td className="py-3 px-4"><span className={statusMap[o.status].cls}>{statusMap[o.status].label}</span></td>
                  <td className="py-3 px-4 text-text-gray text-xs">{o.createdAt}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setSelected(o)}
                      className="text-xs bg-purple/20 border border-purple/30 text-purple hover:bg-purple/30 px-3 py-1.5 rounded-lg transition-all font-semibold">
                      Ko'rish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">📦 {selected.id}</h3>
              <button onClick={() => { setSelected(null); setRejectNote(""); }} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-3 mb-5">
              {[
                ["Foydalanuvchi", selected.userName],
                ["O'yin", `${gameIcon[selected.game]||"🎮"} ${selected.game}`],
                ["Xizmat", selected.service],
                ["Rank", `${selected.fromRank} → ${selected.toRank}`],
                ["Booster", selected.booster || "Tayinlanmagan"],
                ["Narx", `${formatP(selected.price)} so'm`],
                ["Sana", selected.createdAt],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between items-center text-sm border-b border-border pb-2">
                  <span className="text-text-gray">{l}:</span>
                  <span className="text-text-white font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-gray">Status:</span>
                <span className={statusMap[selected.status].cls}>{statusMap[selected.status].label}</span>
              </div>
              {selected.note && (
                <div className="bg-red/10 border border-red/20 rounded-xl p-3 text-red text-xs">
                  📝 Izoh: {selected.note}
                </div>
              )}
            </div>

            {/* Actions */}
            {selected.status === "pending" && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button onClick={() => handleApprove(selected.id)}
                    className="flex-1 bg-green/15 border border-green/30 text-green hover:bg-green/25 py-2.5 rounded-xl text-sm font-bold transition-all">
                    ✅ Tasdiqlash
                  </button>
                </div>
                <div>
                  <label className="text-text-gray text-xs mb-1.5 block">Rad etish sababi (majburiy)</label>
                  <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                    placeholder="Nima uchun rad etilmoqda..." rows={2}
                    className="ainput resize-none" />
                </div>
                <button onClick={() => handleReject(selected.id)}
                  className="w-full bg-red/15 border border-red/30 text-red hover:bg-red/25 py-2.5 rounded-xl text-sm font-bold transition-all">
                  ❌ Rad etish
                </button>
              </div>
            )}

            {selected.status === "disputed" && (
              <div className="space-y-3">
                <div className="bg-orange/10 border border-orange/20 rounded-xl p-3">
                  <p className="text-orange text-sm font-bold mb-1">⚠️ Nizo hal qilish</p>
                  <p className="text-text-gray text-xs">Kim haq ekanligini tekshirib qaror qiling</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleResolveDispute(selected.id, "buyer")}
                    className="bg-cyan/15 border border-cyan/30 text-cyan hover:bg-cyan/25 py-2.5 rounded-xl text-xs font-bold transition-all">
                    👤 Xaridor haq<br/><span className="font-normal">Pul qaytarilsin</span>
                  </button>
                  <button onClick={() => handleResolveDispute(selected.id, "seller")}
                    className="bg-purple/15 border border-purple/30 text-purple hover:bg-purple/25 py-2.5 rounded-xl text-xs font-bold transition-all">
                    ⚔️ Booster haq<br/><span className="font-normal">Pul o'tkazilsin</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
