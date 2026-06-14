"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Step = "role" | "superadmin_email" | "superadmin_otp" | "admin_login";
type LoginRole = "superadmin" | "admin";

// ─── O'chirilgan adminlar blacklisti (localStorage dan olinadi)
function getDeletedAdmins(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("gboost_deleted_admins") || "[]");
  } catch { return []; }
}

// ─── Adminlar ro'yxati (localStorage dan olinadi — admins sahifasida qo'shiladi)
function getAdminList(): any[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("gboost_admin_list") || "[]");
  } catch { return []; }
}

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "ogiloyadirova@gmail.com";

export default function LoginPage() {
  const router   = useRouter();
  const [step, setStep]         = useState<Step>("role");
  const [role, setRole]         = useState<LoginRole>("admin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp]           = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [otpEmailSent, setOtpEmailSent] = useState("");

  // Allaqachon kirgan bo'lsa dashboard ga
  useEffect(() => {
    const s = localStorage.getItem("gboost_admin_session");
    if (s) {
      const parsed = JSON.parse(s);
      if (Date.now() - parsed.loginTime < 8 * 60 * 60 * 1000) {
        router.replace("/dashboard");
      }
    }
  }, []);

  // Timer
  const startTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(p => {
        if (p <= 1) { clearInterval(interval); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  // ─── Super Admin: Email yuborish
  const handleSendOTP = async () => {
    if (!email.trim()) { setError("Email kiriting"); return; }
    if (email.trim() !== SUPER_ADMIN_EMAIL) {
      setError("Bu email super admin emas!");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Yuborishda xatolik");
        return;
      }
      setOtpEmailSent(email.trim());
      setStep("superadmin_otp");
      startTimer();
    } catch {
      setError("Server bilan bog'lanib bo'lmadi. Internet aloqasini tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Super Admin: OTP tasdiqlash
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) { setError("6 xonali kod kiriting"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmailSent, otp }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Noto'g'ri kod");
        return;
      }
      localStorage.setItem("gboost_admin_session", JSON.stringify({
        id: "superadmin-001",
        name: "Super Admin",
        email: SUPER_ADMIN_EMAIL,
        role: "superadmin",
        loginTime: Date.now(),
      }));
      router.push("/dashboard");
    } catch {
      setError("Server xatoligi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Admin: Login/Parol
  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      setError("Email va parolni kiriting");
      return;
    }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 600));

    const deletedList = getDeletedAdmins();
    const adminList   = getAdminList();

    // O'chirilgan admin?
    if (deletedList.includes(email.trim().toLowerCase())) {
      setError("🚫 Bu foydalanuvchi tizimdan o'chirilgan!");
      setLoading(false);
      return;
    }

    // Admin ro'yxatida qidirish
    const admin = adminList.find(
      (a: any) =>
        a.email.toLowerCase() === email.trim().toLowerCase() &&
        a.password === password
    );

    if (!admin) {
      setError("Email yoki parol noto'g'ri!");
      setLoading(false);
      return;
    }

    if (!admin.isActive) {
      setError("🔒 Bu akkaunt bloklangan! Super adminga murojaat qiling.");
      setLoading(false);
      return;
    }

    // So'nggi kirish vaqtini yangilash
    const updatedList = adminList.map((a: any) =>
      a.id === admin.id
        ? { ...a, lastLogin: new Date().toLocaleString("uz-UZ") }
        : a
    );
    localStorage.setItem("gboost_admin_list", JSON.stringify(updatedList));

    localStorage.setItem("gboost_admin_session", JSON.stringify({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "admin",
      loginTime: Date.now(),
    }));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-bg" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">G</span>
            </div>
            <div className="text-left">
              <p className="font-black text-xl text-white">GBoost</p>
              <p className="text-xs text-cyan font-semibold">Admin Panel</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-red/10 border border-red/30 rounded-full px-4 py-1.5">
            <div className="w-2 h-2 rounded-full bg-red animate-pulse" />
            <span className="text-red text-xs font-semibold">Faqat adminlar uchun</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">

          {/* STEP 1 — Rol tanlash */}
          {step === "role" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Kirish</h2>
              <p className="text-text-gray text-sm mb-6">Rolni tanlang</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id:"superadmin", label:"Super Admin", icon:"👑", desc:"Gmail OTP orqali", color:"from-gold/20 to-orange/10", border:"border-gold/40" },
                  { id:"admin",      label:"Admin",        icon:"🛡️", desc:"Login / Parol",   color:"from-cyan/10 to-purple/10", border:"border-cyan/30" },
                ].map(r => (
                  <button key={r.id} onClick={() => setRole(r.id as LoginRole)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      role === r.id
                        ? `bg-gradient-to-br ${r.color} ${r.border} scale-[1.02]`
                        : "border-border bg-bg hover:border-border/60"
                    }`}>
                    <div className="text-2xl mb-2">{r.icon}</div>
                    <p className={`font-bold text-sm ${role === r.id ? "text-white" : "text-text-light"}`}>{r.label}</p>
                    <p className="text-text-gray text-xs mt-0.5">{r.desc}</p>
                    {role === r.id && <p className="mt-1.5 text-green text-xs font-semibold">✓ Tanlandi</p>}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setError(""); setEmail(""); setPassword(""); setStep(role === "superadmin" ? "superadmin_email" : "admin_login"); }}
                className="abtn-primary">
                Davom etish →
              </button>
            </div>
          )}

          {/* STEP 2 — Super Admin Email */}
          {step === "superadmin_email" && (
            <div>
              <button onClick={() => { setStep("role"); setError(""); setEmail(""); }}
                className="text-text-gray text-sm mb-4 flex items-center gap-1 hover:text-white transition-colors">
                ← Orqaga
              </button>
              <div className="text-3xl mb-3">👑</div>
              <h2 className="text-xl font-bold text-white mb-1">Super Admin</h2>
              <p className="text-text-gray text-sm mb-1">
                Tasdiqlash kodi shu emailga yuboriladi:
              </p>
              <p className="text-cyan font-bold text-sm mb-6 bg-cyan/10 border border-cyan/20 rounded-xl px-3 py-2">
                📧 {SUPER_ADMIN_EMAIL}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-text-gray text-xs font-medium mb-1.5 block">Super Admin Email</label>
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="superadmin@gboost.uz"
                    className="ainput"
                    onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  />
                </div>
                {error && (
                  <p className="text-red text-sm bg-red/10 border border-red/20 rounded-xl p-3">⚠️ {error}</p>
                )}
                <button onClick={handleSendOTP} disabled={loading} className="abtn-primary disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuborilmoqda...</>
                    : "📧 Gmail ga kod yuborish"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — OTP Tasdiqlash */}
          {step === "superadmin_otp" && (
            <div>
              <div className="text-3xl mb-3">📬</div>
              <h2 className="text-xl font-bold text-white mb-1">Gmail kodni kiriting</h2>
              <p className="text-text-gray text-sm mb-6">
                <span className="text-cyan font-semibold break-all">{otpEmailSent}</span>
                {" "}ga 6 xonali kod yuborildi
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-text-gray text-xs font-medium mb-1.5 block">Tasdiqlash kodi</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    placeholder="• • • • • •"
                    maxLength={6}
                    className="ainput text-center text-3xl tracking-[0.6em] font-black"
                    onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                    autoFocus
                  />
                  <p className="text-text-gray text-xs mt-1.5 text-center">
                    Kodni Gmaildan (inbox yoki spam) toping
                  </p>
                </div>
                {error && (
                  <p className="text-red text-sm bg-red/10 border border-red/20 rounded-xl p-3">⚠️ {error}</p>
                )}
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="abtn-primary disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Tekshirilmoqda...</>
                    : "✅ Tasdiqlash"}
                </button>

                {/* Resend */}
                <div className="text-center pt-1">
                  {resendTimer > 0 ? (
                    <p className="text-text-gray text-sm">
                      Qayta yuborish: <span className="text-cyan font-bold">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={() => { setStep("superadmin_email"); setOtp(""); setError(""); }}
                      className="text-cyan text-sm hover:underline transition-colors">
                      📧 Qayta yuborish →
                    </button>
                  )}
                </div>
                <button
                  onClick={() => { setStep("role"); setOtp(""); setError(""); setEmail(""); }}
                  className="w-full text-text-gray text-sm hover:text-white transition-colors text-center">
                  ← Orqaga
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — Admin Login */}
          {step === "admin_login" && (
            <div>
              <button
                onClick={() => { setStep("role"); setError(""); setEmail(""); setPassword(""); }}
                className="text-text-gray text-sm mb-4 flex items-center gap-1 hover:text-white transition-colors">
                ← Orqaga
              </button>
              <div className="text-3xl mb-3">🛡️</div>
              <h2 className="text-xl font-bold text-white mb-1">Admin Kirish</h2>
              <p className="text-text-gray text-sm mb-6">
                Super admin tomonidan berilgan login va parol bilan kiring
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-text-gray text-xs font-medium mb-1.5 block">Email</label>
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="admin@gboost.uz"
                    className="ainput"
                  />
                </div>
                <div>
                  <label className="text-text-gray text-xs font-medium mb-1.5 block">Parol</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      className="ainput pr-12"
                      onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-white transition-colors text-sm">
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className={`text-sm rounded-xl p-3 border ${
                    error.includes("o'chirilgan")
                      ? "text-red bg-red/10 border-red/20"
                      : error.includes("bloklangan")
                        ? "text-orange bg-orange/10 border-orange/20"
                        : "text-red bg-red/10 border-red/20"
                  }`}>
                    {error}
                  </p>
                )}
                <button onClick={handleAdminLogin} disabled={loading} className="abtn-primary disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kirilmoqda...</>
                    : "🔐 Kirish"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-text-gray text-xs mt-4">
          🔒 Bu sahifa Google'da ko'rinmaydi
        </p>
      </div>
    </div>
  );
}
