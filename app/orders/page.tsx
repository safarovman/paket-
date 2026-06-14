"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase, DBOrder, fmt } from "@/lib/supabase";
import clsx from "clsx";

export default function OrdersPage() {
  const [orders, setOrders]         = useState<DBOrder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<DBOrder | null>(null);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [toast, setToast]           = useState<{msg:string;type:"success"|"error"}|null>(null);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Ma'lumotlarni yuklash
  useEffect(() => {
    fetchOrders();

    // Real-time yangilash
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  // ─── Tasdiqlash
  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { showToast("Xatolik yuz berdi!", "error"); return; }
    setSelected(null);
    showToast("✅ Buyurtma tasdiqlandi!");
    fetchOrders();
  };

  // ─── Rad etish
  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) { showToast("Rad etish sababini yozing!", "error"); return; }
    const { error } = await supabase
      .from("orders")
      .update({ status: "rejected", note: rejectNote, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { showToast("Xatolik yuz berdi!", "error"); return; }
    setSelected(null); setRejectNote("");
    showToast("❌ Buyurtma rad etildi.");
    fetchOrders();
  };

  // ─── Nizo hal qilish
  const handleResolveDispute = async (id: string, winner: "buyer"|"seller") => {
    const note = winner === "buyer" ? "Xaridor foydasiga hal qilindi" : "Booster foydasiga hal qilindi";
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed", note, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (winner === "buyer") {
      // Escrow pulni qaytarish
      await supabase.from("payments").insert({
        user_name: selected?.user_name,
        type: "refund",
        amount: selected?.price,
        method: selected?.payment_method || "click",
        status: "completed",
        order_id: id,
        note: "Nizo — pul qaytarildi",
      });
    } else {
      // Escrow pulni boosterga o'tkazish
      await supabase.from("payments")
        .update({ status: "completed", type: "escrow_release" })
        .eq("order_id", id)
        .eq("type", "escrow_hold");
    }

    if (error) { showToast("Xatolik!", "error"); return; }
    setSelected(null);
    showToast(winner === "buyer" ? "✅ Pul xaridorga qaytarildi" : "✅ Pul boosterga o'tkazildi");
    fetchOrders();
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = o.user_name.toLowerCase().includes(search.toLowerCase()) ||
                        o.id.includes(search) || o.game.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusMap: Record<string, {label:string;cls:string}> = {
    pending:   { label:"⏳ Kutilmoqda", cls:"abadge-gold"   },
    approved:  { label:"✅ Tasdiqlandi",cls:"abadge-cyan"   },
    completed: { label:"🏁 Tugadi",     cls:"abadge-green"  },
    rejected:  { label:"❌ Rad etildi", cls:"abadge-red"    },
    disputed:  { label:"⚠️ Nizo",       cls:"abadge-red"    },
  };
  const gameIcon: Record<string,string> = { MLBB:"🗡️", PUBG:"🎯", "Free Fire":"🔥", CS2:"💣" };
  const counts: Record<string,number> = {
    all: orders.length,
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
        <p className="text-text-gray text-sm">Supabase real-time • Barcha buyurtmalarni boshqaring</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all flex items-center gap-1.5",
              filter===key?"bg-cyan/20 border-cyan/40 text-cyan":"bg-card border-border text-text-gray hover:text-text-light")}>
            {key==="all"?"Barchasi":key==="pending"?"⏳ Kutilmoqda":key==="approved"?"✅ Tasdiqlandi":
             key==="disputed"?"⚠️ Nizo":key==="completed"?"🏁 Tugadi":"❌ Rad etildi"}
            <span className={clsx("w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
              filter===key?"bg-cyan text-bg":"bg-border text-text-gray")}>{count}</span>
          </button>
        ))}
      </div>

      <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Ism, ID yoki o'yin..." className="ainput max-w-sm mb-4" />

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
                  {["ID","Foydalanuvchi","O'yin","Xizmat","Rank","Narx","Status","Sana","Amal"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-text-gray text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-text-gray">Buyurtma topilmadi</td></tr>
                ) : filtered.map((o,i) => (
                  <tr key={o.id} className={clsx("border-b border-border/50 hover:bg-bg/50 transition-colors", i%2===0?"":"bg-bg/20")}>
                    <td className="py-3 px-4 text-cyan text-xs font-mono">{o.id.slice(0,8)}...</td>
                    <td className="py-3 px-4 text-text-white text-sm font-medium">{o.user_name}</td>
                    <td className="py-3 px-4 text-sm">{gameIcon[o.game]||"🎮"} {o.game}</td>
                    <td className="py-3 px-4 text-text-gray text-xs">{o.service}</td>
                    <td className="py-3 px-4 text-text-gray text-xs">{o.from_rank} → {o.to_rank}</td>
                    <td className="py-3 px-4 text-gold text-sm font-bold">{fmt(o.price)} so'm</td>
                    <td className="py-3 px-4"><span className={statusMap[o.status]?.cls}>{statusMap[o.status]?.label}</span></td>
                    <td className="py-3 px-4 text-text-gray text-xs">{new Date(o.created_at).toLocaleDateString("uz-UZ")}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => setSelected(o)}
                        className="text-xs bg-purple/20 border border-purple/30 text-purple hover:bg-purple/30 px-3 py-1.5 rounded-lg font-semibold">
                        Ko'rish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">📦 Buyurtma</h3>
              <button onClick={()=>{setSelected(null);setRejectNote("");}} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3 mb-5">
              {[
                ["Foydalanuvchi", selected.user_name],
                ["O'yin", `${gameIcon[selected.game]||"🎮"} ${selected.game}`],
                ["Xizmat", selected.service],
                ["Rank", `${selected.from_rank} → ${selected.to_rank}`],
                ["Booster", selected.booster||"Tayinlanmagan"],
                ["Narx", `${fmt(selected.price)} so'm`],
                ["To'lov", selected.payment_method?.toUpperCase()||"CLICK"],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between items-center text-sm border-b border-border pb-2">
                  <span className="text-text-gray">{l}:</span>
                  <span className="text-text-white font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-text-gray">Status:</span>
                <span className={statusMap[selected.status]?.cls}>{statusMap[selected.status]?.label}</span>
              </div>
              {selected.note && (
                <div className="bg-red/10 border border-red/20 rounded-xl p-3 text-red text-xs">📝 {selected.note}</div>
              )}
            </div>

            {selected.status === "pending" && (
              <div className="space-y-3">
                <button onClick={() => handleApprove(selected.id)}
                  className="w-full bg-green/15 border border-green/30 text-green hover:bg-green/25 py-2.5 rounded-xl text-sm font-bold transition-all">
                  ✅ Tasdiqlash
                </button>
                <textarea value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                  placeholder="Rad etish sababi..." rows={2} className="ainput resize-none" />
                <button onClick={() => handleReject(selected.id)}
                  className="w-full bg-red/15 border border-red/30 text-red hover:bg-red/25 py-2.5 rounded-xl text-sm font-bold">
                  ❌ Rad etish
                </button>
              </div>
            )}

            {selected.status === "disputed" && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleResolveDispute(selected.id, "buyer")}
                  className="bg-cyan/15 border border-cyan/30 text-cyan py-2.5 rounded-xl text-xs font-bold hover:bg-cyan/25">
                  👤 Xaridor haq<br/><span className="font-normal">Pul qaytarilsin</span>
                </button>
                <button onClick={() => handleResolveDispute(selected.id, "seller")}
                  className="bg-purple/15 border border-purple/30 text-purple py-2.5 rounded-xl text-xs font-bold hover:bg-purple/25">
                  ⚔️ Booster haq<br/><span className="font-normal">Pul o'tkazilsin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
