"use client";
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { MOCK_PAYMENTS, Payment } from "@/lib/db";
import clsx from "clsx";

const formatP = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState<{msg:string;type:"success"|"error"}|null>(null);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRelease = (id: string) => {
    setPayments(p => p.map(pay => pay.id === id ? { ...pay, status: "completed", type: "escrow_release" as any } : pay));
    setSelected(null);
    showToast("✅ Pul boosterga o'tkazildi!");
  };

  const handleRefund = (id: string) => {
    setPayments(p => p.map(pay => pay.id === id ? { ...pay, status: "completed", type: "refund" as any } : pay));
    setSelected(null);
    showToast("↩️ Pul xaridorga qaytarildi!");
  };

  const handleApprove = (id: string) => {
    setPayments(p => p.map(pay => pay.id === id ? { ...pay, status: "completed" } : pay));
    setSelected(null);
    showToast("✅ To'lov tasdiqlandi!");
  };

  const typeMap: Record<string, string> = {
    deposit:"💳 To'ldirildi", withdrawal:"💸 Chiqarildi",
    escrow_hold:"🔒 Escrow (muzlatildi)", escrow_release:"✅ Escrow (o'tkazildi)", refund:"↩️ Qaytarildi",
  };

  const statusMap: Record<string, {label:string;cls:string}> = {
    completed: { label:"✅ Bajarildi",  cls:"abadge-green" },
    pending:   { label:"⏳ Kutilmoqda", cls:"abadge-gold"  },
    frozen:    { label:"🔒 Muzlatildi", cls:"abadge-cyan"  },
    failed:    { label:"❌ Xatolik",    cls:"abadge-red"   },
  };

  const methodColors: Record<string, string> = {
    click:"bg-blue-500/20 text-blue-400", payme:"bg-cyan/15 text-cyan",
    uzcard:"bg-green/15 text-green", humo:"bg-purple/15 text-purple",
  };

  const filtered = payments.filter(p => {
    const matchFilter = filter === "all" || p.status === filter || p.type === filter;
    const matchSearch = p.userName.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalFrozen    = payments.filter(p=>p.status==="frozen").reduce((s,p)=>s+p.amount,0);
  const totalCompleted = payments.filter(p=>p.status==="completed").reduce((s,p)=>s+p.amount,0);
  const totalPending   = payments.filter(p=>p.status==="pending").reduce((s,p)=>s+p.amount,0);

  return (
    <AdminLayout>
      {toast && (
        <div className={clsx("fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl",
          toast.type==="success"?"bg-green":"bg-red")}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">💰 To'lovlar</h1>
        <p className="text-text-gray text-sm">Barcha moliyaviy operatsiyalarni boshqaring</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:"Muzlatilgan mablag'", value:`${formatP(totalFrozen)} so'm`,    icon:"🔒", color:"text-cyan",   bg:"bg-cyan/10 border-cyan/20"   },
          { label:"Bajarilgan to'lovlar",value:`${formatP(totalCompleted)} so'm`, icon:"✅", color:"text-green",  bg:"bg-green/10 border-green/20"  },
          { label:"Kutilayotgan",        value:`${formatP(totalPending)} so'm`,   icon:"⏳", color:"text-gold",   bg:"bg-gold/10 border-gold/20"    },
        ].map(s => (
          <div key={s.label} className={`acard border ${s.bg} text-center`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
            <p className="text-text-gray text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ["all","Barchasi"],["frozen","🔒 Muzlatilgan"],
          ["pending","⏳ Kutilmoqda"],["completed","✅ Bajarilgan"],
        ].map(([key,label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all",
              filter===key?"bg-cyan/20 border-cyan/40 text-cyan":"bg-card border-border text-text-gray hover:text-text-light")}>
            {label}
          </button>
        ))}
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Ism yoki to'lov ID..." className="ainput max-w-sm mb-4" />

      {/* Table */}
      <div className="acard p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                {["ID","Foydalanuvchi","Tur","Miqdor","Usul","Status","Sana","Amal"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-text-gray text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-text-gray">To'lov topilmadi</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className={clsx("border-b border-border/50 hover:bg-bg/50 transition-colors", i%2===0?"":"bg-bg/20")}>
                  <td className="py-3 px-4 text-cyan text-xs font-mono">{p.id}</td>
                  <td className="py-3 px-4 text-text-white text-sm font-medium">{p.userName}</td>
                  <td className="py-3 px-4 text-text-gray text-xs">{typeMap[p.type]}</td>
                  <td className="py-3 px-4 text-gold text-sm font-bold">{formatP(p.amount)} so'm</td>
                  <td className="py-3 px-4">
                    <span className={clsx("text-xs font-bold px-2 py-1 rounded-full", methodColors[p.method])}>
                      {p.method.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4"><span className={statusMap[p.status].cls}>{statusMap[p.status].label}</span></td>
                  <td className="py-3 px-4 text-text-gray text-xs">{p.createdAt}</td>
                  <td className="py-3 px-4">
                    {(p.status === "frozen" || p.status === "pending") && (
                      <button onClick={() => setSelected(p)}
                        className="text-xs bg-purple/20 border border-purple/30 text-purple hover:bg-purple/30 px-3 py-1.5 rounded-lg transition-all font-semibold">
                        Boshqarish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">💰 {selected.id}</h3>
              <button onClick={() => setSelected(null)} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-3 mb-5">
              {[
                ["Foydalanuvchi", selected.userName],
                ["Tur",           typeMap[selected.type]],
                ["Miqdor",        `${formatP(selected.amount)} so'm`],
                ["Usul",          selected.method.toUpperCase()],
                ["Buyurtma",      selected.orderId || "—"],
                ["Sana",          selected.createdAt],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-text-gray">{l}:</span>
                  <span className="text-text-white font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-text-gray">Status:</span>
                <span className={statusMap[selected.status].cls}>{statusMap[selected.status].label}</span>
              </div>
            </div>

            {selected.status === "frozen" && (
              <div className="space-y-3">
                <div className="bg-cyan/10 border border-cyan/20 rounded-xl p-3 text-cyan text-xs text-center">
                  🔒 Bu pul Escrow da — kimga berishni tanlang
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleRelease(selected.id)}
                    className="bg-purple/15 border border-purple/30 text-purple hover:bg-purple/25 py-3 rounded-xl text-sm font-bold transition-all">
                    ⚔️ Boosterga<br/><span className="text-xs font-normal">O'tkazish</span>
                  </button>
                  <button onClick={() => handleRefund(selected.id)}
                    className="bg-green/15 border border-green/30 text-green hover:bg-green/25 py-3 rounded-xl text-sm font-bold transition-all">
                    👤 Xaridorga<br/><span className="text-xs font-normal">Qaytarish</span>
                  </button>
                </div>
              </div>
            )}

            {selected.status === "pending" && (
              <button onClick={() => handleApprove(selected.id)}
                className="w-full bg-green/15 border border-green/30 text-green hover:bg-green/25 py-3 rounded-xl text-sm font-bold transition-all">
                ✅ To'lovni tasdiqlash
              </button>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
