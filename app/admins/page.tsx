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

const ALL_PERMS = [
  { id:"orders",     label:"📦 Buyurtmalar"      },
  { id:"complaints", label:"⚠️ Shikoyatlar"      },
  { id:"users",      label:"👥 Foydalanuvchilar" },
  { id:"listings",   label:"🏪 E'lonlar"          },
  { id:"payments",   label:"💰 To'lovlar"         },
];

// LocalStorage helpers
const LS_ADMINS   = "gboost_admin_list";
const LS_DELETED  = "gboost_deleted_admins";
const LS_SUPER_PW = "gboost_super_pw_changed";
const LS_SUPER_PW_HASH = "gboost_super_pw";

function loadAdmins(): Admin[] {
  try { return JSON.parse(localStorage.getItem(LS_ADMINS) || "[]"); }
  catch { return []; }
}
function saveAdmins(list: Admin[]) {
  localStorage.setItem(LS_ADMINS, JSON.stringify(list));
}
function loadDeleted(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_DELETED) || "[]"); }
  catch { return []; }
}
function saveDeleted(list: string[]) {
  localStorage.setItem(LS_DELETED, JSON.stringify(list));
}
function getSuperPw(): string {
  return localStorage.getItem(LS_SUPER_PW_HASH) || "GBoost@Super2024";
}

export default function AdminsPage() {
  const [session, setSession]           = useState<any>(null);
  const [admins, setAdmins]             = useState<Admin[]>([]);
  const [deletedEmails, setDeletedEmails] = useState<string[]>([]);

  // Modals
  const [showAdd, setShowAdd]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [changePwTarget, setChangePwTarget] = useState<Admin | null>(null);
  const [showMyPw, setShowMyPw]         = useState(false);

  // Forms
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    permissions: ALL_PERMS.map(p => p.id),
  });
  const [showFormPw, setShowFormPw] = useState(false);
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showNewPw, setShowNewPw]   = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Super Admin parol
  const [currentPw, setCurrentPw]   = useState("");
  const [superNewPw, setSuperNewPw] = useState("");
  const [superConfirmPw, setSuperConfirmPw] = useState("");
  const [showCurPw, setShowCurPw]   = useState(false);
  const [showSNewPw, setShowSNewPw] = useState(false);
  const [showSConfPw, setShowSConfPw] = useState(false);
  const [pwLastChanged, setPwLastChanged] = useState<number | null>(null);

  const [toast, setToast] = useState<{msg:string;type:"success"|"error"}|null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const s = localStorage.getItem("gboost_admin_session");
    if (s) setSession(JSON.parse(s));
    setAdmins(loadAdmins());
    setDeletedEmails(loadDeleted());
    const lp = localStorage.getItem(LS_SUPER_PW);
    if (lp) setPwLastChanged(Number(lp));
  }, []);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Super Admin emas?
  if (session && session.role !== "superadmin") {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-black text-white mb-2">Ruxsat yo'q!</h2>
          <p className="text-text-gray text-sm">Bu sahifaga faqat Super Admin kira oladi.</p>
        </div>
      </AdminLayout>
    );
  }

  // ─── Parol o'zgartirish cheklovi
  const canChangeSuperPw = () => {
    if (!pwLastChanged) return true;
    return Date.now() - pwLastChanged >= 3 * 24 * 60 * 60 * 1000;
  };
  const hoursLeft = () => {
    if (!pwLastChanged) return 0;
    return Math.ceil((3 * 24 * 60 * 60 * 1000 - (Date.now() - pwLastChanged)) / 3600000);
  };

  // ─── Yangi admin qo'shish
  const handleAdd = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())     e.name     = "Ism kiriting";
    if (!form.email.trim())    e.email    = "Email kiriting";
    if (!form.password)        e.password = "Parol kiriting";
    else if (form.password.length < 8) e.password = "Parol kamida 8 ta belgi bo'lishi kerak";
    if (admins.find(a => a.email.toLowerCase() === form.email.toLowerCase()))
      e.email = "Bu email allaqachon mavjud!";
    if (deletedEmails.includes(form.email.toLowerCase()))
      e.email = "Bu email o'chirilgan admin — boshqa email ishlating";
    setErrors(e);
    if (Object.keys(e).length) return;

    const newAdmin: Admin = {
      id:          `adm-${Date.now()}`,
      name:        form.name.trim(),
      email:       form.email.trim().toLowerCase(),
      password:    form.password,
      isActive:    true,
      createdAt:   new Date().toLocaleDateString("uz-UZ"),
      lastLogin:   "Hali kirmagan",
      permissions: form.permissions,
    };
    const updated = [...admins, newAdmin];
    setAdmins(updated);
    saveAdmins(updated);
    setForm({ name:"", email:"", password:"", permissions: ALL_PERMS.map(p=>p.id) });
    setShowAdd(false);
    showToast(`✅ ${newAdmin.name} admin sifatida qo'shildi!`);
  };

  // ─── Admin o'chirish (blacklist ga qo'shish)
  const handleDelete = (admin: Admin) => {
    const updated = admins.filter(a => a.id !== admin.id);
    setAdmins(updated);
    saveAdmins(updated);
    const newDeleted = [...deletedEmails, admin.email.toLowerCase()];
    setDeletedEmails(newDeleted);
    saveDeleted(newDeleted);
    setDeleteTarget(null);
    showToast(`🗑️ ${admin.name} o'chirildi. Login qilmoqchi bo'lsa xato chiqadi.`);
  };

  // ─── Admin bloklash/faollashtirish
  const handleToggle = (id: string) => {
    const admin = admins.find(a => a.id === id);
    const updated = admins.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a);
    setAdmins(updated);
    saveAdmins(updated);
    showToast(admin?.isActive ? `🔒 ${admin?.name} bloklandi` : `✅ ${admin?.name} faollashtirildi`);
  };

  // ─── Admin paroli o'zgartirish
  const handleChangeAdminPw = () => {
    const e: Record<string, string> = {};
    if (!newPw)               e.newPw    = "Yangi parol kiriting";
    else if (newPw.length < 8) e.newPw   = "Parol kamida 8 ta belgi bo'lishi kerak";
    if (newPw !== confirmPw)  e.confirmPw = "Parollar mos emas!";
    setErrors(e);
    if (Object.keys(e).length) return;

    const updated = admins.map(a =>
      a.id === changePwTarget?.id ? { ...a, password: newPw } : a
    );
    setAdmins(updated);
    saveAdmins(updated);
    setChangePwTarget(null);
    setNewPw(""); setConfirmPw("");
    showToast(`✅ ${changePwTarget?.name} ning paroli yangilandi!`);
  };

  // ─── Super Admin paroli o'zgartirish
  const handleChangeSuperPw = () => {
    const e: Record<string, string> = {};
    if (!canChangeSuperPw()) {
      showToast(`⏳ ${hoursLeft()} soatdan keyin o'zgartirish mumkin!`, "error");
      return;
    }
    if (currentPw !== getSuperPw())  e.currentPw  = "Joriy parol noto'g'ri!";
    if (!superNewPw)                 e.superNewPw = "Yangi parol kiriting";
    else if (superNewPw.length < 6)  e.superNewPw = "Parol kamida 6 ta belgi bo'lishi kerak";
    if (superNewPw !== superConfirmPw) e.superConfirmPw = "Parollar mos emas!";
    setErrors(e);
    if (Object.keys(e).length) return;

    localStorage.setItem(LS_SUPER_PW_HASH, superNewPw);
    localStorage.setItem(LS_SUPER_PW, Date.now().toString());
    setPwLastChanged(Date.now());
    setShowMyPw(false);
    setCurrentPw(""); setSuperNewPw(""); setSuperConfirmPw("");
    showToast("✅ Super Admin paroli muvaffaqiyatli yangilandi!");
  };

  const resetModal = () => {
    setErrors({});
    setNewPw(""); setConfirmPw("");
    setCurrentPw(""); setSuperNewPw(""); setSuperConfirmPw("");
  };

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className={clsx(
          "fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-2xl animate-fade-in",
          toast.type === "success" ? "bg-green" : "bg-red"
        )}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🛡️ Adminlar Boshqaruvi</h1>
          <p className="text-text-gray text-sm mt-1">Faqat Super Admin ko'ra va boshqara oladi</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { resetModal(); setShowMyPw(true); }}
            className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            🔑 Mening parolim
          </button>
          <button
            onClick={() => { resetModal(); setShowAdd(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple to-cyan text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            ➕ Yangi Admin
          </button>
        </div>
      </div>

      {/* ══════════════ MODAL: Super Admin Paroli ══════════════ */}
      {showMyPw && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">🔑 Super Admin Paroli</h3>
              <button onClick={() => { setShowMyPw(false); resetModal(); }}
                className="text-text-gray hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition-all">
                ✕
              </button>
            </div>

            {!canChangeSuperPw() ? (
              <div className="bg-orange/10 border border-orange/30 rounded-xl p-5 text-center">
                <div className="text-5xl mb-3">⏳</div>
                <p className="text-orange font-bold text-base">Hali o'zgartirish mumkin emas</p>
                <p className="text-text-gray text-sm mt-2">
                  <span className="text-orange font-bold">{hoursLeft()} soat</span> dan keyin o'zgartirish mumkin
                </p>
                <p className="text-text-gray text-xs mt-2 bg-bg rounded-lg p-2">
                  Xavfsizlik uchun parol <strong className="text-gold">3 kunda 1 marta</strong> o'zgartirilishi mumkin
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green/10 border border-green/20 rounded-xl p-3 text-xs text-green font-semibold">
                  ✅ Parolni o'zgartirish mumkin
                </div>

                {/* Joriy parol */}
                <div>
                  <label className="text-text-gray text-xs mb-1.5 block">Joriy parol</label>
                  <div className="relative">
                    <input
                      type={showCurPw ? "text" : "password"}
                      value={currentPw}
                      onChange={e => { setCurrentPw(e.target.value); setErrors(p => ({...p, currentPw:""})); }}
                      placeholder="Joriy parolni kiriting"
                      className={clsx("ainput pr-12", errors.currentPw && "border-red")}
                    />
                    <button type="button" onClick={() => setShowCurPw(!showCurPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-white text-sm transition-colors">
                      {showCurPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {errors.currentPw && <p className="text-red text-xs mt-1">⚠️ {errors.currentPw}</p>}
                </div>

                {/* Yangi parol */}
                <div>
                  <label className="text-text-gray text-xs mb-1.5 block">Yangi parol (kamida 6 belgi)</label>
                  <div className="relative">
                    <input
                      type={showSNewPw ? "text" : "password"}
                      value={superNewPw}
                      onChange={e => { setSuperNewPw(e.target.value); setErrors(p => ({...p, superNewPw:""})); }}
                      placeholder="Yangi parol"
                      className={clsx("ainput pr-12", errors.superNewPw && "border-red")}
                    />
                    <button type="button" onClick={() => setShowSNewPw(!showSNewPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-white text-sm transition-colors">
                      {showSNewPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {errors.superNewPw && <p className="text-red text-xs mt-1">⚠️ {errors.superNewPw}</p>}
                  {/* Strength indicator */}
                  {superNewPw && (
                    <div className="mt-1.5 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={clsx("h-1 flex-1 rounded-full transition-all",
                          superNewPw.length > i * 3
                            ? superNewPw.length < 6 ? "bg-red" : superNewPw.length < 10 ? "bg-gold" : "bg-green"
                            : "bg-border"
                        )} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Tasdiqlash */}
                <div>
                  <label className="text-text-gray text-xs mb-1.5 block">Yangi parolni tasdiqlang</label>
                  <div className="relative">
                    <input
                      type={showSConfPw ? "text" : "password"}
                      value={superConfirmPw}
                      onChange={e => { setSuperConfirmPw(e.target.value); setErrors(p => ({...p, superConfirmPw:""})); }}
                      placeholder="Qaytadan kiriting"
                      className={clsx("ainput pr-12", errors.superConfirmPw && "border-red")}
                    />
                    <button type="button" onClick={() => setShowSConfPw(!showSConfPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-white text-sm transition-colors">
                      {showSConfPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {errors.superConfirmPw && <p className="text-red text-xs mt-1">⚠️ {errors.superConfirmPw}</p>}
                  {superConfirmPw && superNewPw === superConfirmPw && (
                    <p className="text-green text-xs mt-1">✓ Parollar mos</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowMyPw(false); resetModal(); }}
                    className="flex-1 border border-border rounded-xl py-3 text-text-gray hover:text-white text-sm transition-colors">
                    Bekor qilish
                  </button>
                  <button onClick={handleChangeSuperPw}
                    className="flex-1 bg-gradient-to-r from-purple to-cyan text-white rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-all">
                    💾 Saqlash
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: Yangi Admin ══════════════ */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">➕ Yangi Admin</h3>
              <button onClick={() => { setShowAdd(false); setErrors({}); }}
                className="text-text-gray hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition-all">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {/* Ism */}
              <div>
                <label className="text-text-gray text-xs mb-1.5 block">Ism Familiya</label>
                <input type="text" value={form.name}
                  onChange={e => { setForm(p=>({...p, name:e.target.value})); setErrors(p=>({...p, name:""})); }}
                  placeholder="Abdulloh Karimov"
                  className={clsx("ainput", errors.name && "border-red")} />
                {errors.name && <p className="text-red text-xs mt-1">⚠️ {errors.name}</p>}
              </div>
              {/* Email */}
              <div>
                <label className="text-text-gray text-xs mb-1.5 block">Email</label>
                <input type="email" value={form.email}
                  onChange={e => { setForm(p=>({...p, email:e.target.value})); setErrors(p=>({...p, email:""})); }}
                  placeholder="admin@gboost.uz"
                  className={clsx("ainput", errors.email && "border-red")} />
                {errors.email && <p className="text-red text-xs mt-1">⚠️ {errors.email}</p>}
              </div>
              {/* Parol */}
              <div>
                <label className="text-text-gray text-xs mb-1.5 block">Parol (kamida 8 belgi)</label>
                <div className="relative">
                  <input type={showFormPw ? "text" : "password"} value={form.password}
                    onChange={e => { setForm(p=>({...p, password:e.target.value})); setErrors(p=>({...p, password:""})); }}
                    placeholder="Kuchli parol kiriting"
                    className={clsx("ainput pr-12", errors.password && "border-red")} />
                  <button type="button" onClick={() => setShowFormPw(!showFormPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-white text-sm">
                    {showFormPw ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && <p className="text-red text-xs mt-1">⚠️ {errors.password}</p>}
                {form.password && (
                  <div className="mt-1.5 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={clsx("h-1 flex-1 rounded-full transition-all",
                        form.password.length > i * 3
                          ? form.password.length < 8 ? "bg-red" : form.password.length < 12 ? "bg-gold" : "bg-green"
                          : "bg-border"
                      )} />
                    ))}
                  </div>
                )}
              </div>
              {/* Ruxsatlar */}
              <div>
                <label className="text-text-gray text-xs mb-2 block font-semibold">Ruxsatlar</label>
                <div className="space-y-2 bg-bg rounded-xl p-3 border border-border">
                  {ALL_PERMS.map(p => (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox"
                        checked={form.permissions.includes(p.id)}
                        onChange={e => setForm(prev => ({
                          ...prev,
                          permissions: e.target.checked
                            ? [...prev.permissions, p.id]
                            : prev.permissions.filter(x => x !== p.id)
                        }))}
                        className="w-4 h-4 accent-cyan rounded" />
                      <span className="text-text-light text-sm group-hover:text-white transition-colors">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowAdd(false); setErrors({}); }}
                  className="flex-1 border border-border rounded-xl py-3 text-text-gray hover:text-white text-sm transition-colors">
                  Bekor qilish
                </button>
                <button onClick={handleAdd}
                  className="flex-1 bg-gradient-to-r from-purple to-cyan text-white rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-all">
                  ✅ Qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: Admin Paroli O'zgartirish ══════════════ */}
      {changePwTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">🔑 Parol O'zgartirish</h3>
              <button onClick={() => { setChangePwTarget(null); resetModal(); }}
                className="text-text-gray hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition-all">
                ✕
              </button>
            </div>
            <div className="bg-bg border border-border rounded-xl p-3 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-white font-bold text-sm shrink-0">
                {changePwTarget.name[0]}
              </div>
              <div>
                <p className="text-white text-sm font-bold">{changePwTarget.name}</p>
                <p className="text-text-gray text-xs">{changePwTarget.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-text-gray text-xs mb-1.5 block">Yangi parol (kamida 8 belgi)</label>
                <div className="relative">
                  <input type={showNewPw ? "text" : "password"} value={newPw}
                    onChange={e => { setNewPw(e.target.value); setErrors(p=>({...p, newPw:""})); }}
                    placeholder="Yangi parol"
                    className={clsx("ainput pr-12", errors.newPw && "border-red")} />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-white text-sm">
                    {showNewPw ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.newPw && <p className="text-red text-xs mt-1">⚠️ {errors.newPw}</p>}
                {newPw && (
                  <div className="mt-1.5 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={clsx("h-1 flex-1 rounded-full transition-all",
                        newPw.length > i*3
                          ? newPw.length < 8 ? "bg-red" : newPw.length < 12 ? "bg-gold" : "bg-green"
                          : "bg-border"
                      )} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-text-gray text-xs mb-1.5 block">Tasdiqlash</label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setErrors(p=>({...p, confirmPw:""})); }}
                    placeholder="Qaytadan kiriting"
                    className={clsx("ainput pr-12", errors.confirmPw && "border-red")} />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-white text-sm">
                    {showConfirmPw ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.confirmPw && <p className="text-red text-xs mt-1">⚠️ {errors.confirmPw}</p>}
                {confirmPw && newPw === confirmPw && (
                  <p className="text-green text-xs mt-1">✓ Parollar mos</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setChangePwTarget(null); resetModal(); }}
                  className="flex-1 border border-border rounded-xl py-3 text-text-gray hover:text-white text-sm transition-colors">
                  Bekor
                </button>
                <button onClick={handleChangeAdminPw}
                  className="flex-1 bg-gradient-to-r from-purple to-cyan text-white rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-all">
                  💾 Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: O'chirish Tasdiqlash ══════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-red/30 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="font-black text-white text-lg mb-2">Adminni o'chirish</h3>
            <p className="text-text-gray text-sm mb-2">
              <span className="text-red font-semibold">{deleteTarget.name}</span> ni
              tizimdan butunlay o'chirasizmi?
            </p>
            <div className="bg-red/10 border border-red/20 rounded-xl p-3 mb-5 text-left">
              <p className="text-red text-xs font-semibold mb-1">⚠️ Diqqat!</p>
              <p className="text-text-gray text-xs leading-relaxed">
                O'chirilgan admin eski login/parolini kiritsa:
                <span className="text-red font-semibold"> "Bu foydalanuvchi tizimdan o'chirilgan!"</span> xabari chiqadi.
                Bu amalni bekor qilib bo'lmaydi.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-border rounded-xl py-2.5 text-text-gray hover:text-white text-sm transition-colors">
                Bekor qilish
              </button>
              <button onClick={() => handleDelete(deleteTarget)}
                className="flex-1 bg-red text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-all">
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ADMINLAR RO'YXATI ══════════════ */}
      {admins.length === 0 ? (
        <div className="acard text-center py-16">
          <div className="text-5xl mb-4">🛡️</div>
          <h3 className="text-white font-bold text-lg mb-2">Adminlar yo'q</h3>
          <p className="text-text-gray text-sm mb-5">Hali hech qanday admin qo'shilmagan</p>
          <button onClick={() => { resetModal(); setShowAdd(true); }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple to-cyan text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            ➕ Birinchi adminni qo'shish
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {admins.map(admin => (
            <div key={admin.id} className={clsx("acard transition-all", !admin.isActive && "opacity-60")}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-white font-black text-xl shrink-0">
                    {admin.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-bold text-white">{admin.name}</p>
                      <span className={admin.isActive ? "abadge-green" : "abadge-red"}>
                        {admin.isActive ? "✅ Faol" : "🔒 Bloklangan"}
                      </span>
                    </div>
                    <p className="text-text-gray text-sm">{admin.email}</p>
                    <p className="text-text-gray text-xs mt-0.5">
                      So'nggi kirish: <span className="text-cyan">{admin.lastLogin}</span>
                      {" • "}Qo'shilgan: {admin.createdAt}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleToggle(admin.id)}
                    className={clsx("text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all",
                      admin.isActive
                        ? "bg-orange/10 border-orange/30 text-orange hover:bg-orange/20"
                        : "bg-green/10 border-green/30 text-green hover:bg-green/20")}>
                    {admin.isActive ? "🔒 Bloklash" : "✅ Faollashtirish"}
                  </button>
                  <button onClick={() => { resetModal(); setChangePwTarget(admin); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-cyan/10 border-cyan/30 text-cyan hover:bg-cyan/20 transition-all">
                    🔑 Parol
                  </button>
                  <button onClick={() => setDeleteTarget(admin)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-red/10 border-red/30 text-red hover:bg-red/20 transition-all">
                    🗑️ O'chirish
                  </button>
                </div>
              </div>
              {/* Ruxsatlar */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border items-center">
                <span className="text-text-gray text-xs font-medium">Ruxsatlar:</span>
                {admin.permissions.map(pid => {
                  const perm = ALL_PERMS.find(x => x.id === pid);
                  return perm ? (
                    <span key={pid} className="text-xs bg-purple/15 text-purple border border-purple/20 rounded-full px-2.5 py-0.5">
                      {perm.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
