"use client";
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { MOCK_USERS, User } from "@/lib/db";
import clsx from "clsx";

const formatP = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>(MOCK_USERS);
  const [selected, setSelected] = useState<User | null>(null);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [banNote, setBanNote] = useState("");
  const [toast, setToast]     = useState<{msg:string;type:"success"|"error"}|null>(null);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBan = (id: string) => {
    setUsers(p => p.map(u => u.id === id ? { ...u, isBanned: true, isActive: false } : u));
    setSelected(null); setBanNote("");
    showToast("🚫 Foydalanuvchi ban qilindi!");
  };

  const handleUnban = (id: string) => {
    setUsers(p => p.map(u => u.id === id ? { ...u, isBanned: false, isActive: true } : u));
    showToast("✅ Ban olib tashlandi!");
  };

  const handleKarmaChange = (id: string, amount: number) => {
    setUsers(p => p.map(u => u.id === id ? { ...u, karma: Math.max(0, Math.min(100, u.karma + amount)) } : u));
    showToast(`${amount > 0 ? "+" : ""}${amount} karma berildi`);
  };

  const filtered = users.filter(u => {
    const matchFilter = filter === "all" || filter === u.role ||
      (filter === "banned" && u.isBanned) || (filter === "inactive" && !u.isActive);
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.phone.includes(search);
    return matchFilter && matchSearch;
  });

  const counts = {
    all:      users.length,
    client:   users.filter(u=>u.role==="client").length,
    booster:  users.filter(u=>u.role==="booster").length,
    banned:   users.filter(u=>u.isBanned).length,
    inactive: users.filter(u=>!u.isActive).length,
  };

  const karmaColor = (k: number) => k >= 80 ? "text-green" : k >= 40 ? "text-gold" : "text-red";

  return (
    <AdminLayout>
      {toast && (
        <div className={clsx("fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl",
          toast.type==="success"?"bg-green":"bg-red")}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">👥 Foydalanuvchilar</h1>
        <p className="text-text-gray text-sm">Barcha foydalanuvchilar va boosterlarni boshqaring</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ["all","Barchasi"],["client","🎮 Mijozlar"],["booster","⚔️ Boosterlar"],
          ["banned","🚫 Banlangan"],["inactive","😴 Nofaol"],
        ].map(([key,label]) => (
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

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Ism, email yoki telefon..." className="ainput max-w-sm mb-4" />

      {/* Users grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div key={u.id} className={clsx("acard hover:border-border/80 transition-all cursor-pointer", u.isBanned && "border-red/20")}
            onClick={() => setSelected(u)}>
            <div className="flex items-start gap-3">
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0",
                u.isBanned ? "bg-red/20" : u.role==="booster" ? "bg-gradient-to-br from-purple to-cyan" : "bg-gradient-to-br from-cyan/30 to-purple/30"
              )}>
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <p className="font-bold text-white text-sm truncate">{u.name}</p>
                  {u.isBanned && <span className="abadge-red">🚫 Ban</span>}
                  {!u.isActive && !u.isBanned && <span className="abadge-gold">😴 Nofaol</span>}
                </div>
                <p className="text-text-gray text-xs truncate">{u.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border",
                    u.role==="booster"?"bg-purple/15 text-purple border-purple/30":"bg-cyan/10 text-cyan border-cyan/20")}>
                    {u.role==="booster"?"⚔️ Booster":"🎮 Mijoz"}
                  </span>
                  <span className={clsx("text-xs font-bold", karmaColor(u.karma))}>⭐ {u.karma}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border text-xs">
              <div className="text-center">
                <p className="text-cyan font-bold">{u.totalOrders}</p>
                <p className="text-text-gray">Buyurtma</p>
              </div>
              <div className="text-center">
                <p className="text-gold font-bold">{formatP(u.totalSpent)} so'm</p>
                <p className="text-text-gray">Sarflagan</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">👤 {selected.name}</h3>
              <button onClick={() => { setSelected(null); setBanNote(""); }} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>

            {/* Info */}
            <div className="space-y-2.5 mb-5">
              {[
                ["Email", selected.email],
                ["Telefon", selected.phone],
                ["Rol", selected.role === "booster" ? "⚔️ Booster" : "🎮 Mijoz"],
                ["Ro'yxatdan", selected.createdAt],
                ["Jami buyurtma", selected.totalOrders.toString()],
                ["Jami sarflagan", `${formatP(selected.totalSpent)} so'm`],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-text-gray">{l}:</span>
                  <span className="text-text-white font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-gray">Karma:</span>
                <div className="flex items-center gap-2">
                  <span className={clsx("font-black text-lg", karmaColor(selected.karma))}>{selected.karma}/100</span>
                  <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple to-cyan" style={{ width:`${selected.karma}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Karma actions */}
            <div className="bg-bg border border-border rounded-xl p-3 mb-4">
              <p className="text-text-gray text-xs font-semibold mb-2">Karma boshqaruvi:</p>
              <div className="flex gap-2 flex-wrap">
                {[+5, +10, -5, -10, -20].map(v => (
                  <button key={v} onClick={() => { handleKarmaChange(selected.id, v); setSelected(p => p ? { ...p, karma: Math.max(0, Math.min(100, p.karma + v)) } : p); }}
                    className={clsx("text-xs font-bold px-3 py-1.5 rounded-xl border transition-all",
                      v > 0 ? "bg-green/15 border-green/30 text-green hover:bg-green/25" : "bg-red/10 border-red/30 text-red hover:bg-red/20")}>
                    {v > 0 ? "+" : ""}{v}
                  </button>
                ))}
              </div>
            </div>

            {/* Ban/Unban */}
            {selected.isBanned ? (
              <button onClick={() => handleUnban(selected.id)}
                className="w-full bg-green/15 border border-green/30 text-green hover:bg-green/25 py-3 rounded-xl text-sm font-bold transition-all">
                ✅ Banni olib tashlash
              </button>
            ) : (
              <div className="space-y-2">
                <label className="text-text-gray text-xs block">Ban sababi (ixtiyoriy)</label>
                <textarea value={banNote} onChange={e => setBanNote(e.target.value)}
                  placeholder="Nima uchun ban qilinmoqda..." rows={2}
                  className="ainput resize-none" />
                <button onClick={() => handleBan(selected.id)}
                  className="w-full bg-red/15 border border-red/30 text-red hover:bg-red/25 py-3 rounded-xl text-sm font-bold transition-all">
                  🚫 Ban qilish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
