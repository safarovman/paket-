"use client";
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { MOCK_LISTINGS, AccountListing } from "@/lib/db";
import clsx from "clsx";

const formatP = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function ListingsPage() {
  const [listings, setListings] = useState<AccountListing[]>(MOCK_LISTINGS);
  const [selected, setSelected] = useState<AccountListing | null>(null);
  const [filter, setFilter]     = useState("all");
  const [rejectNote, setRejectNote] = useState("");
  const [toast, setToast]       = useState<{msg:string;type:"success"|"error"}|null>(null);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (id: string) => {
    setListings(p => p.map(l => l.id === id ? { ...l, status: "approved" } : l));
    setSelected(null);
    showToast("✅ E'lon tasdiqlandi va bozorga qo'shildi!");
  };

  const handleReject = (id: string) => {
    if (!rejectNote.trim()) { showToast("Rad etish sababini yozing!", "error"); return; }
    setListings(p => p.map(l => l.id === id ? { ...l, status: "rejected" } : l));
    setSelected(null); setRejectNote("");
    showToast("❌ E'lon rad etildi.");
  };

  const filtered = filter === "all" ? listings : listings.filter(l => l.status === filter);
  const gameIcon: Record<string, string> = { MLBB:"🗡️", PUBG:"🎯", CS2:"💣", "Free Fire":"🔥" };

  const statusMap: Record<string, {label:string;cls:string}> = {
    pending:  { label:"⏳ Kutilmoqda", cls:"abadge-gold"  },
    approved: { label:"✅ Tasdiqlandi",cls:"abadge-green" },
    rejected: { label:"❌ Rad etildi", cls:"abadge-red"   },
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
          toast.type==="success"?"bg-green":"bg-red")}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">🏪 Akkaunt E'lonlari</h1>
        <p className="text-text-gray text-sm">Bozorga qo'yilgan akkauntlarni tasdiqlang</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[["all","Barchasi"],["pending","⏳ Kutilmoqda"],["approved","✅ Tasdiqlandi"],["rejected","❌ Rad etildi"]].map(([key,label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all flex items-center gap-1.5",
              filter===key?"bg-cyan/20 border-cyan/40 text-cyan":"bg-card border-border text-text-gray hover:text-text-light")}>
            {label}
            <span className={clsx("w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
              filter===key?"bg-cyan text-bg":"bg-border text-text-gray")}>
              {counts[key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => (
          <div key={l.id} className="acard hover:border-border/80 transition-all cursor-pointer" onClick={() => setSelected(l)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple/20 flex items-center justify-center text-2xl shrink-0">
                  {gameIcon[l.game] || "🎮"}
                </div>
                <div>
                  <p className="font-bold text-cyan text-sm">{l.game}</p>
                  <p className="text-white font-black">{l.rank}</p>
                </div>
              </div>
              <span className={statusMap[l.status].cls}>{statusMap[l.status].label}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border",
                l.type==="rent"?"bg-gold/15 text-gold border-gold/30":"bg-green/15 text-green border-green/30")}>
                {l.type==="rent"?"🔄 Ijara":"🛒 Sotish"}
              </span>
              <span className="text-gold font-black text-sm">{formatP(l.price)} so'm{l.type==="rent"?"/kun":""}</span>
            </div>
            <p className="text-text-gray text-xs leading-relaxed line-clamp-2">{l.description}</p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
              <span className="text-text-gray text-xs">👤 {l.userName}</span>
              <span className="text-text-gray text-xs">{l.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">{gameIcon[selected.game]} {selected.game} — {selected.rank}</h3>
              <button onClick={() => { setSelected(null); setRejectNote(""); }} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-2.5 mb-5">
              {[
                ["Sotuvchi",   selected.userName],
                ["Tur",        selected.type==="rent"?"🔄 Ijara":"🛒 Sotish"],
                ["Narx",       `${formatP(selected.price)} so'm${selected.type==="rent"?"/kun":""}`],
                ["E'lon sanasi",selected.createdAt],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-text-gray">{l}:</span>
                  <span className="text-text-white font-medium">{v}</span>
                </div>
              ))}
              <div className="bg-bg border border-border rounded-xl p-3">
                <p className="text-text-gray text-xs mb-1 font-semibold">Tavsif:</p>
                <p className="text-text-light text-sm leading-relaxed">{selected.description}</p>
              </div>
            </div>

            {selected.status === "pending" && (
              <div className="space-y-3">
                <button onClick={() => handleApprove(selected.id)}
                  className="w-full bg-green/15 border border-green/30 text-green hover:bg-green/25 py-3 rounded-xl text-sm font-bold transition-all">
                  ✅ Tasdiqlash — Bozorga qo'shish
                </button>
                <div>
                  <label className="text-text-gray text-xs mb-1.5 block">Rad etish sababi</label>
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
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
