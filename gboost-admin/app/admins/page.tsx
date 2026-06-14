"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import clsx from "clsx";

interface Admin {
  id: string;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
  permissions: string[];
}

const INIT_ADMINS: Admin[] = [
  { id:"adm-001", name:"Abdulloh Karimov",  email:"admin1@gboost.uz", password:"Admin@1234", isActive:true,  createdAt:"2024-01-01", lastLogin:"2024-01-15 10:23", permissions:["orders","complaints","users","listings","payments"] },
  { id:"adm-002", name:"Bobur Toshmatov",   email:"admin2@gboost.uz", password:"Admin@5678", isActive:true,  createdAt:"2024-01-05", lastLogin:"2024-01-14 15:40", permissions:["orders","complaints","users","listings","payments"] },
  { id:"adm-003", name:"Sardor Rakhimov",   email:"admin3@gboost.uz", password:"Admin@9999", isActive:false, createdAt:"2024-01-10", lastLogin:"2024-01-12 09:00", permissions:["orders","complaints"] },
];

const ALL_PERMS = [
  { id:"orders",     label:"📦 Buyurtmalar"   },
  { id:"complaints", label:"⚠️ Shikoyatlar"   },
  { id:"users",      label:"👥 Foydalanuvchilar" },
  { id:"listings",   label:"🏪 E'lonlar"       },
  { id:"payments",   label:"💰 To'lovlar"      },
];

export default function AdminsPage() {
  const [session, setSession]       = useState<any>(null);
  const [admins, setAdmins]         = useState<Admin[]>(INIT_ADMINS);
  const [showAdd, setShowAdd]       = useState(false);
  const [editAdmin, setEditAdmin]   = useState<Admin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [changePwAdmin, setChangePwAdmin] = useState<Admin | null>(null);
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [toast, setToast]           = useState<{msg:string;type:"success"|"error"}|null>(null);

  // Super Admin parol o'zgartirish (3 kunda 1 marta)
  const [mySuperPw, setMySuperPw]   = useState("");
  const [myNewPw, setMyNewPw]       = useState("");
  const [myConfirmPw, setMyConfirmPw] = useState("");
  const [showMyPwChange, setShowMyPwChange] = useState(false);
  const [pwLastChanged, setPwLastChanged] = useState<number | null>(null);

  const [form, setForm] = useState({
    name:"", email:"", password:"", permissions: ALL_PERMS.map(p => p.id),
  });

  useEffect(() => {
    const s = localStorage.getItem("gboost_admin_session");
    if (s) setSession(JSON.parse(s));
    const lastPw = localStorage.getItem("gboost_super_pw_changed");
    if (lastPw) setPwLastChanged(Number(lastPw));
  }, []);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Super Admin emaslarga ko'rsatma
  if (session && session.role !== "superadmin") {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-black text-white mb-2">Ruxsat yo'q!</h2>
          <p className="text-text-gray text-sm">Bu sahifaga faqat Super Admin kira oladi.</p>
        </div>
      </AdminLayout>
    );
  }

  const canChangeSuperPw = () => {
    if (!pwLastChanged) return true;
    return Date.now() - pwLastChanged >= 3 * 24 * 60 * 60 * 1000;
  };

  const hoursUntilPwChange = () => {
    if (!pwLastChanged) return 0;
    const diff = 3 * 24 * 60 * 60 * 1000 - (Date.now() - pwLastChanged);
    return Math.ceil(diff / (60 * 60 * 1000));
  };

  const handleAddAdmin = () => {
    if (!form.name || !form.email || !form.password) { showToast("Barcha maydonlarni to'ldiring!", "error"); return; }
    if (form.password.length < 8) { showToast("Parol kamida 8 ta belgi!", "error"); return; }
    if (admins.find(a => a.email === form.email)) { showToast("Bu email allaqachon mavjud!", "error"); return; }
    const newAdmin: Admin = {
      id: `adm-${Date.now()}`,
      name: form.name, email: form.email, password: form.password,
      isActive: true, createdAt: new Date().toISOString().split("T")[0],
      lastLogin: "Hali kirmagan", permissions: form.permissions,
    };
    setAdmins(p => [...p, newAdmin]);
    setForm({ name:"", email:"", password:"", permissions: ALL_PERMS.map(p => p.id) });
    setShowAdd(false);
    showToast(`✅ ${newAdmin.name} admin sifatida qo'shildi!`);
  };

  const handleDeleteAdmin = (id: string) => {
    setAdmins(p => p.filter(a => a.id !== id));
    setDeleteConfirm(null);
    showToast("🗑️ Admin o'chirildi. Endi u kirmoqchi bo'lsa 'o'chirilgan' degan xabar chiqadi.");
  };

  const handleToggleActive = (id: string) => {
    setAdmins(p => p.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    const admin = admins.find(a => a.id === id);
    showToast(admin?.isActive ? `🔒 ${admin.name} bloklandi` : `✅ ${admin?.name} faollashtirildi`);
  };

  const handleChangeAdminPw = () => {
    if (!newPw || !confirmPw) { showToast("Parolni kiriting!", "error"); return; }
    if (newPw !== confirmPw) { showToast("Parollar mos emas!", "error"); return; }
    if (newPw.length < 8) { showToast("Parol kamida 8 ta belgi!", "error"); return; }
    setAdmins(p => p.map(a => a.id === changePwAdmin?.id ? { ...a, password: newPw } : a));
    setChangePwAdmin(null); setNewPw(""); setConfirmPw("");
    showToast(`✅ ${changePwAdmin?.name} ning paroli o'zgartirildi!`);
  };

  const handleChangeSuperPw = () => {
    if (!canChangeSuperPw()) { showToast(`Parolni ${hoursUntilPwChange()} soatdan keyin o'zgartirish mumkin!`, "error"); return; }
    if (mySuperPw !== "GBoost@Super2024") { showToast("Joriy parol noto'g'ri!", "error"); return; }
    if (myNewPw !== myConfirmPw) { showToast("Parollar mos emas!", "error"); return; }
    if (myNewPw.length < 10) { showToast("Super Admin paroli kamida 10 ta belgi!", "error"); return; }
    localStorage.setItem("gboost_super_pw_changed", Date.now().toString());
    setPwLastChanged(Date.now());
    setShowMyPwChange(false); setMySuperPw(""); setMyNewPw(""); setMyConfirmPw("");
    showToast("✅ Super Admin paroli muvaffaqiyatli o'zgartirildi!");
  };

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className={clsx("fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl transition-all",
          toast.type === "success" ? "bg-green" : "bg-red")}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🛡️ Adminlar Boshqaruvi</h1>
          <p className="text-text-gray text-sm mt-1">Faqat Super Admin ko'ra va boshqara oladi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMyPwChange(true)}
            className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            🔑 Mening parolim
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple to-cyan text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            ➕ Yangi Admin
          </button>
        </div>
      </div>

      {/* Super Admin parol o'zgartirish */}
      {showMyPwChange && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">🔑 Super Admin Paroli</h3>
              <button onClick={() => setShowMyPwChange(false)} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>
            {!canChangeSuperPw() ? (
              <div className="bg-orange/10 border border-orange/30 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-orange font-bold">Parolni o'zgartirish mumkin emas</p>
                <p className="text-text-gray text-sm mt-1">{hoursUntilPwChange()} soatdan keyin o'zgartirish mumkin</p>
                <p className="text-text-gray text-xs mt-2">3 kunda 1 marta o'zgartiriladi</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green/10 border border-green/20 rounded-xl p-3 text-green text-xs">
                  ✅ Parolni o'zgartirish mumkin
                </div>
                {[
                  { label:"Joriy parol", val:mySuperPw, set:setMySuperPw, ph:"••••••••••" },
                  { label:"Yangi parol (min 10 ta belgi)", val:myNewPw, set:setMyNewPw, ph:"••••••••••" },
                  { label:"Yangi parolni tasdiqlang", val:myConfirmPw, set:setMyConfirmPw, ph:"••••••••••" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-text-gray text-xs mb-1.5 block">{f.label}</label>
                    <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                      placeholder={f.ph} className="ainput" />
                  </div>
                ))}
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowMyPwChange(false)} className="flex-1 border border-border rounded-xl py-2.5 text-text-gray hover:text-white text-sm transition-colors">Bekor</button>
                  <button onClick={handleChangeSuperPw} className="flex-1 bg-gradient-to-r from-purple to-cyan text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-all">Saqlash</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">➕ Yangi Admin Qo'shish</h3>
              <button onClick={() => setShowAdd(false)} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label:"Ism Familiya", key:"name", type:"text", ph:"Abdulloh Karimov" },
                { label:"Email",        key:"email", type:"email", ph:"admin@gboost.uz"  },
                { label:"Parol (min 8 belgi)", key:"password", type:"password", ph:"••••••••" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-text-gray text-xs mb-1.5 block">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} placeholder={f.ph}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="ainput" />
                </div>
              ))}
              <div>
                <label className="text-text-gray text-xs mb-2 block">Ruxsatlar</label>
                <div className="space-y-1.5">
                  {ALL_PERMS.map(p => (
                    <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={form.permissions.includes(p.id)}
                        onChange={e => setForm(prev => ({
                          ...prev,
                          permissions: e.target.checked
                            ? [...prev.permissions, p.id]
                            : prev.permissions.filter(x => x !== p.id)
                        }))}
                        className="w-4 h-4 accent-cyan rounded" />
                      <span className="text-text-light text-sm">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowAdd(false)} className="flex-1 border border-border rounded-xl py-2.5 text-text-gray hover:text-white text-sm transition-colors">Bekor</button>
                <button onClick={handleAddAdmin} className="flex-1 bg-gradient-to-r from-purple to-cyan text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-90">Qo'shish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Admin Password Modal */}
      {changePwAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">🔑 Parol O'zgartirish</h3>
              <button onClick={() => { setChangePwAdmin(null); setNewPw(""); setConfirmPw(""); }} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>
            <p className="text-text-gray text-sm mb-4">Admin: <span className="text-cyan font-semibold">{changePwAdmin.name}</span></p>
            <div className="space-y-3">
              <div>
                <label className="text-text-gray text-xs mb-1.5 block">Yangi parol</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 belgi" className="ainput" />
              </div>
              <div>
                <label className="text-text-gray text-xs mb-1.5 block">Tasdiqlash</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Qaytadan kiriting" className="ainput" />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => { setChangePwAdmin(null); setNewPw(""); setConfirmPw(""); }} className="flex-1 border border-border rounded-xl py-2.5 text-text-gray text-sm">Bekor</button>
                <button onClick={handleChangeAdminPw} className="flex-1 bg-gradient-to-r from-purple to-cyan text-white rounded-xl py-2.5 text-sm font-bold">Saqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-red/30 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="font-black text-white text-lg mb-2">Adminni o'chirish</h3>
            <p className="text-text-gray text-sm mb-1">
              <span className="text-red font-semibold">{admins.find(a=>a.id===deleteConfirm)?.name}</span> ni o'chirishni tasdiqlaysizmi?
            </p>
            <p className="text-text-gray text-xs mb-5">Eski login/parol bilan kirishga harakat qilsa: <span className="text-red">"Tizimdan o'chirilgansiz"</span> degan xabar chiqadi.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-border rounded-xl py-2.5 text-text-gray text-sm hover:text-white transition-colors">Bekor</button>
              <button onClick={() => handleDeleteAdmin(deleteConfirm)} className="flex-1 bg-red text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-90">O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* Admins list */}
      <div className="space-y-4">
        {admins.map(admin => (
          <div key={admin.id} className={clsx("acard", !admin.isActive && "opacity-60")}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-white font-black text-lg shrink-0">
                  {admin.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white">{admin.name}</p>
                    <span className={admin.isActive ? "abadge-green" : "abadge-red"}>
                      {admin.isActive ? "✅ Faol" : "🔒 Bloklangan"}
                    </span>
                  </div>
                  <p className="text-text-gray text-sm">{admin.email}</p>
                  <p className="text-text-gray text-xs mt-0.5">
                    So'nggi kirish: <span className="text-cyan">{admin.lastLogin}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleToggleActive(admin.id)}
                  className={clsx("text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all",
                    admin.isActive
                      ? "bg-orange/10 border-orange/30 text-orange hover:bg-orange/20"
                      : "bg-green/10 border-green/30 text-green hover:bg-green/20")}>
                  {admin.isActive ? "🔒 Bloklash" : "✅ Faollashtirish"}
                </button>
                <button onClick={() => setChangePwAdmin(admin)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-cyan/10 border-cyan/30 text-cyan hover:bg-cyan/20 transition-all">
                  🔑 Parol
                </button>
                <button onClick={() => setDeleteConfirm(admin.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-red/10 border-red/30 text-red hover:bg-red/20 transition-all">
                  🗑️ O'chirish
                </button>
              </div>
            </div>
            {/* Permissions */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
              <span className="text-text-gray text-xs mr-1">Ruxsatlar:</span>
              {admin.permissions.map(p => {
                const perm = ALL_PERMS.find(x => x.id === p);
                return perm ? (
                  <span key={p} className="text-xs bg-purple/15 text-purple border border-purple/20 rounded-full px-2 py-0.5">{perm.label}</span>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
