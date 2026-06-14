"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase, DBListing, fmt } from "@/lib/supabase";
import clsx from "clsx";

export default function ListingsPage() {
  const [listings, setListings]   = useState<DBListing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<DBListing | null>(null);
  const [filter, setFilter]       = useState("all");
  const [rejectNote, setRejectNote] = useState("");
  const [toast, setToast]         = useState<{msg:string;type:"success"|"error"}|null>(null);

  const showToast = (msg:string, type:"success"|"error"="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  useEffect(() => {
    fetchListings();
    const channel = supabase
      .channel("listings-changes")
      .on("postgres_changes", {event:"*", schema:"public", table:"listings"}, fetchListings)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("listings").select("*").order("created_at", {ascending:false});
    if (!error && data) setListings(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { showToast("Xatolik!", "error"); return; }
    setSelected(null);
    showToast("✅ E'lon tasdiqlandi — bozorga qo'shildi!");
    fetchListings();
  };

  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) { showToast("Sabab yozing!", "error"); return; }
    const { error } = await supabase
      .from("listings")
      .update({ status: "rejected", reject_note: rejectNote, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { showToast("Xatolik!", "error"); return; }
    setSelected(null); setRejectNote("");
    showToast("❌ E'lon rad etildi.");
    fetchListings();
  };

  const filtered = filter==="all" ? listings : listings.filter(l=>l.status===filter);
  const gameIcon: Record<string,string> = {MLBB:"🗡️", PUBG:"🎯", CS2:"💣", "Free Fire":"🔥"};
  const statusMap: Record<string,{label:string;cls:string}> = {
    pending:  {label:"⏳ Kutilmoqda",cls:"abadge-gold" },
    approved: {label:"✅ Tasdiqlandi",cls:"abadge-green"},
    rejected: {label:"❌ Rad etildi",cls:"abadge-red"  },
  };
  const counts = {
    all:      listings.length,
    pending:  listings.filter(l=>l.status==="pending").length,
    approved: listings.filter(l=>l.status==="approved").length,
    rejected: listings.filter(l=>l.status==="rejected").length,
  };

  return (
    <AdminLayout>
      {toast && (
        <div className={clsx("fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl",
          toast.type==="success"?"bg-green":"bg-red")}>{toast.msg}</div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">🏪 Akkaunt E'lonlari</h1>
        <p className="text-text-gray text-sm">Supabase real-time • Asosiy saytda darhol ko'rinadi</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(counts).map(([key,count]) => (
          <button key={key} onClick={()=>setFilter(key)}
            className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all flex items-center gap-1.5",
              filter===key?"bg-cyan/20 border-cyan/40 text-cyan":"bg-card border-border text-text-gray hover:text-text-light")}>
            {key==="all"?"Barchasi":key==="pending"?"⏳ Kutilmoqda":key==="approved"?"✅ Tasdiqlandi":"❌ Rad etildi"}
            <span className={clsx("w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
              filter===key?"bg-cyan text-bg":"bg-border text-text-gray")}>{count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length===0 ? (
            <div className="col-span-3 acard text-center py-12 text-text-gray">E'lon topilmadi</div>
          ) : filtered.map(l => (
            <button key={l.id} onClick={()=>setSelected(l)} className="text-left">
              <div className="acard hover:border-border/80 transition-all h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple/20 flex items-center justify-center text-2xl">
                      {gameIcon[l.game]||"🎮"}
                    </div>
                    <div>
                      <p className="font-bold text-cyan text-sm">{l.game}</p>
                      <p className="text-white font-black">{l.rank}</p>
                    </div>
                  </div>
                  <span className={statusMap[l.status]?.cls}>{statusMap[l.status]?.label}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border",
                    l.type==="rent"?"bg-gold/15 text-gold border-gold/30":"bg-green/15 text-green border-green/30")}>
                    {l.type==="rent"?"🔄 Ijara":"🛒 Sotish"}
                  </span>
                  <span className="text-gold font-black text-sm">{fmt(l.price)} so'm{l.type==="rent"?"/kun":""}</span>
                </div>
                {l.description && (
                  <p className="text-text-gray text-xs line-clamp-2">{l.description}</p>
                )}
                <div className="flex justify-between mt-3 pt-2 border-t border-border">
                  <span className="text-text-gray text-xs">👤 {l.user_name}</span>
                  <span className="text-text-gray text-xs">{new Date(l.created_at).toLocaleDateString("uz-UZ")}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">{gameIcon[selected.game]||"🎮"} {selected.game} — {selected.rank}</h3>
              <button onClick={()=>{setSelected(null);setRejectNote("");}} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-2.5 mb-5">
              {[
                ["Sotuvchi", selected.user_name],
                ["Tur", selected.type==="rent"?"🔄 Ijara":"🛒 Sotish"],
                ["Narx", `${fmt(selected.price)} so'm${selected.type==="rent"?"/kun":""}`],
                ["Win Rate", `${selected.win_rate}%`],
                ["O'yinlar", `${selected.matches}`],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-text-gray">{l}:</span>
                  <span className="text-text-white font-medium">{v}</span>
                </div>
              ))}
              {selected.description && (
                <div className="bg-bg border border-border rounded-xl p-3">
                  <p className="text-text-gray text-xs mb-1 font-semibold">Tavsif:</p>
                  <p className="text-text-light text-sm">{selected.description}</p>
                </div>
              )}
            </div>

            {selected.status === "pending" && (
              <div className="space-y-3">
                <button onClick={()=>handleApprove(selected.id)}
                  className="w-full bg-green/15 border border-green/30 text-green hover:bg-green/25 py-3 rounded-xl text-sm font-bold">
                  ✅ Tasdiqlash — Bozorga qo'shish
                </button>
                <textarea value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                  placeholder="Rad etish sababi..." rows={2} className="ainput resize-none" />
                <button onClick={()=>handleReject(selected.id)}
                  className="w-full bg-red/15 border border-red/30 text-red hover:bg-red/25 py-2.5 rounded-xl text-sm font-bold">
                  ❌ Rad etish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
