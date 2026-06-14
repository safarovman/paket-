"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase, DBPayment, fmt } from "@/lib/supabase";
import clsx from "clsx";

export default function PaymentsPage() {
  const [payments, setPayments]   = useState<DBPayment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<DBPayment | null>(null);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [toast, setToast]         = useState<{msg:string;type:"success"|"error"}|null>(null);

  const showToast = (msg:string, type:"success"|"error"="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  useEffect(() => {
    fetchPayments();
    const channel = supabase
      .channel("payments-changes")
      .on("postgres_changes", {event:"*",schema:"public",table:"payments"}, fetchPayments)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments").select("*").order("created_at", {ascending:false});
    if (!error && data) setPayments(data);
    setLoading(false);
  };

  const handleRelease = async (id:string) => {
    await supabase.from("payments")
      .update({ status:"completed", type:"escrow_release" }).eq("id", id);
    setSelected(null);
    showToast("✅ Pul boosterga o'tkazildi!");
    fetchPayments();
  };

  const handleRefund = async (id:string) => {
    await supabase.from("payments")
      .update({ status:"completed", type:"refund" }).eq("id", id);
    setSelected(null);
    showToast("↩️ Pul xaridorga qaytarildi!");
    fetchPayments();
  };

  const handleApprove = async (id:string) => {
    await supabase.from("payments")
      .update({ status:"completed" }).eq("id", id);
    setSelected(null);
    showToast("✅ To'lov tasdiqlandi!");
    fetchPayments();
  };

  const typeLabel: Record<string,string> = {
    deposit:"💳 To'ldirildi", withdrawal:"💸 Chiqarildi",
    escrow_hold:"🔒 Muzlatildi", escrow_release:"✅ O'tkazildi", refund:"↩️ Qaytarildi",
  };
  const statusMap: Record<string,{label:string;cls:string}> = {
    completed:{label:"✅ Bajarildi", cls:"abadge-green"},
    pending:  {label:"⏳ Kutilmoqda",cls:"abadge-gold" },
    frozen:   {label:"🔒 Muzlatildi",cls:"abadge-cyan" },
    failed:   {label:"❌ Xatolik",   cls:"abadge-red"  },
  };
  const methodColor: Record<string,string> = {
    click:"bg-blue-500/20 text-blue-400",
    payme:"bg-cyan/15 text-cyan",
    uzcard:"bg-green/15 text-green",
    humo:"bg-purple/15 text-purple",
  };

  const filtered = payments.filter(p => {
    const mf = filter==="all" || p.status===filter;
    const ms = p.user_name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    return mf && ms;
  });

  const frozenTotal = payments.filter(p=>p.status==="frozen").reduce((s,p)=>s+p.amount,0);
  const completedTotal = payments.filter(p=>p.status==="completed").reduce((s,p)=>s+p.amount,0);
  const pendingTotal = payments.filter(p=>p.status==="pending").reduce((s,p)=>s+p.amount,0);

  return (
    <AdminLayout>
      {toast && (
        <div className={clsx("fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl",
          toast.type==="success"?"bg-green":"bg-red")}>{toast.msg}</div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">💰 To'lovlar</h1>
        <p className="text-text-gray text-sm">Supabase real-time • Barcha moliyaviy operatsiyalar</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {label:"Muzlatilgan",value:`${fmt(frozenTotal)} so'm`,icon:"🔒",color:"text-cyan",  bg:"bg-cyan/10 border-cyan/20"  },
          {label:"Bajarilgan", value:`${fmt(completedTotal)} so'm`,icon:"✅",color:"text-green",bg:"bg-green/10 border-green/20"},
          {label:"Kutilmoqda", value:`${fmt(pendingTotal)} so'm`,icon:"⏳",color:"text-gold",  bg:"bg-gold/10 border-gold/20"  },
        ].map(s => (
          <div key={s.label} className={`acard border ${s.bg} text-center`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className={`font-black ${s.color}`}>{s.value}</p>
            <p className="text-text-gray text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[["all","Barchasi"],["frozen","🔒 Muzlatilgan"],["pending","⏳ Kutilmoqda"],["completed","✅ Bajarilgan"]].map(([key,label]) => (
          <button key={key} onClick={()=>setFilter(key)}
            className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all",
              filter===key?"bg-cyan/20 border-cyan/40 text-cyan":"bg-card border-border text-text-gray hover:text-text-light")}>
            {label}
          </button>
        ))}
      </div>
      <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Ism yoki ID..." className="ainput max-w-sm mb-4" />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
        </div>
      ) : (
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
                {filtered.length===0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-text-gray">To'lov topilmadi</td></tr>
                ) : filtered.map((p,i) => (
                  <tr key={p.id} className={clsx("border-b border-border/50 hover:bg-bg/50 transition-colors", i%2===0?"":"bg-bg/20")}>
                    <td className="py-3 px-4 text-cyan text-xs font-mono">{p.id.slice(0,8)}...</td>
                    <td className="py-3 px-4 text-text-white text-sm font-medium">{p.user_name}</td>
                    <td className="py-3 px-4 text-text-gray text-xs">{typeLabel[p.type]}</td>
                    <td className="py-3 px-4 text-gold text-sm font-bold">{fmt(p.amount)} so'm</td>
                    <td className="py-3 px-4">
                      <span className={clsx("text-xs font-bold px-2 py-1 rounded-full", methodColor[p.method]||"text-text-gray")}>
                        {p.method.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4"><span className={statusMap[p.status]?.cls}>{statusMap[p.status]?.label}</span></td>
                    <td className="py-3 px-4 text-text-gray text-xs">{new Date(p.created_at).toLocaleDateString("uz-UZ")}</td>
                    <td className="py-3 px-4">
                      {(p.status==="frozen"||p.status==="pending") && (
                        <button onClick={()=>setSelected(p)}
                          className="text-xs bg-purple/20 border border-purple/30 text-purple px-3 py-1.5 rounded-lg font-semibold">
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
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">💰 To'lovni boshqarish</h3>
              <button onClick={()=>setSelected(null)} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3 mb-5">
              {[
                ["Foydalanuvchi", selected.user_name],
                ["Tur", typeLabel[selected.type]],
                ["Miqdor", `${fmt(selected.amount)} so'm`],
                ["Usul", selected.method.toUpperCase()],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-text-gray">{l}:</span>
                  <span className="text-text-white font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-text-gray">Status:</span>
                <span className={statusMap[selected.status]?.cls}>{statusMap[selected.status]?.label}</span>
              </div>
            </div>

            {selected.status==="frozen" && (
              <div className="space-y-3">
                <div className="bg-cyan/10 border border-cyan/20 rounded-xl p-3 text-cyan text-xs text-center">
                  🔒 Escrow — kimga berishni tanlang
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={()=>handleRelease(selected.id)}
                    className="bg-purple/15 border border-purple/30 text-purple py-3 rounded-xl text-sm font-bold">
                    ⚔️ Boosterga
                  </button>
                  <button onClick={()=>handleRefund(selected.id)}
                    className="bg-green/15 border border-green/30 text-green py-3 rounded-xl text-sm font-bold">
                    👤 Xaridorga
                  </button>
                </div>
              </div>
            )}
            {selected.status==="pending" && (
              <button onClick={()=>handleApprove(selected.id)}
                className="w-full bg-green/15 border border-green/30 text-green py-3 rounded-xl text-sm font-bold">
                ✅ To'lovni tasdiqlash
              </button>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
