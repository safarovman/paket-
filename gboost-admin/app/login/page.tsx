"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "role" | "superadmin_email" | "superadmin_otp" | "admin_login";
type LoginRole = "superadmin" | "admin";

// Mock adminlar ro'yxati (real loyihada DB dan keladi)
const MOCK_ADMINS = [
  { id: "adm-001", email: "admin1@gboost.uz", password: "Admin@1234", name: "Abdulloh Karimov", isActive: true },
  { id: "adm-002", email: "admin2@gboost.uz", password: "Admin@5678", name: "Bobur Toshmatov",  isActive: true },
  { id: "adm-003", email: "admin3@gboost.uz", password: "Admin@9999", name: "Sardor Rakhimov",  isActive: false },
];

// Super Admin (faqat bitta)
const SUPER_ADMIN = {
  email: "superadmin@gboost.uz",
  password: "GBoost@Super2024",
  otpSentTo: "safarovman@gmail.com", // Real emailga boriladi
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep]           = useState<Step>("role");
  const [role, setRole]           = useState<LoginRole>("admin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [otp, setOtp]             = useState("");
  const [mockOtp, setMockOtp]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown
  const startTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(p => { if (p <= 1) { clearInterval(interval); return 0; } return p - 1; });
    }, 1000);
  };

  // Super Admin — Email tekshirish
  const handleSuperAdminEmail = async () => {
    if (!email) { setError("Email kiriting"); return; }
    if (email !== SUPER_ADMIN.email) { setError("Bu email super admin emas!"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 1000));
    // Demo: OTP ni konsol/alert da ko'rsatamiz
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setMockOtp(generated);
    setOtpSent(true);
    setLoading(false);
    setStep("superadmin_otp");
    startTimer();
    alert(`📧 Demo OTP: ${generated}\n\nReal loyihada bu Gmail ga yuboriladi: ${SUPER_ADMIN.otpSentTo}`);
  };

  // Super Admin — OTP tasdiqlash
  const handleOtpVerify = async () => {
    if (!otp || otp.length !== 6) { setError("6 xonali kod kiriting"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 800));
    if (otp !== mockOtp) {
      setError("Noto'g'ri kod!");
      setLoading(false);
      return;
    }
    // Super Admin sessiyasini saqlash
    localStorage.setItem("gboost_admin_session", JSON.stringify({
      id: "superadmin-001",
      name: "Super Admin",
      email: SUPER_ADMIN.email,
      role: "superadmin",
      loginTime: Date.now(),
    }));
    setLoading(false);
    router.push("/dashboard");
  };

  // Admin — Login/Parol
  const handleAdminLogin = async () => {
    if (!email || !password) { setError("Email va parolni kiriting"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 1000));

    const admin = MOCK_ADMINS.find(a => a.email === email && a.password === password);
    if (!admin) {
      // Eski (o'chirilgan) admin ekanligini tekshirish
      const deleted = [
        { email: "deleted@gboost.uz", password: "OldPass" },
      ];
      const isDeleted = deleted.find(d => d.email === email);
      if (isDeleted) {
        setError("Bu foydalanuvchi tizimdan o'chirilgan!");
      } else {
        setError("Email yoki parol noto'g'ri!");
      }
      setLoading(false);
      return;
    }
    if (!admin.isActive) {
      setError("Bu akkaunt bloklangan! Super adminga murojaat qiling.");
      setLoading(false);
      return;
    }

    localStorage.setItem("gboost_admin_session", JSON.stringify({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "admin",
      loginTime: Date.now(),
    }));
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-bg" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-3xl" />

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
            <span className="text-red text-xs font-semibold">Faqat adminlar uchun • Google'da ko'rinmaydi</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">

          {/* ─── STEP 1: Rol tanlash ─── */}
          {step === "role" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Kirish</h2>
              <p className="text-text-gray text-sm mb-6">Rol tanlang</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id:"superadmin", label:"Super Admin", icon:"👑", desc:"OTP orqali kirish", color:"from-gold/20 to-orange/10", border:"border-gold/40" },
                  { id:"admin",      label:"Admin",        icon:"🛡️", desc:"Login/Parol",       color:"from-cyan/10 to-purple/10", border:"border-cyan/30" },
                ].map(r => (
                  <button key={r.id} onClick={() => setRole(r.id as LoginRole)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      role === r.id ? `bg-gradient-to-br ${r.color} ${r.border} scale-[1.02]` : "border-border bg-bg hover:border-border/80"
                    }`}>
                    <div className="text-2xl mb-2">{r.icon}</div>
                    <p className={`font-bold text-sm ${role===r.id?"text-white":"text-text-light"}`}>{r.label}</p>
                    <p className="text-text-gray text-xs mt-0.5">{r.desc}</p>
                    {role === r.id && <div className="mt-2 text-green text-xs">✓ Tanlandi</div>}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(role === "superadmin" ? "superadmin_email" : "admin_login")}
                className="abtn-primary">
                Davom etish →
              </button>
            </div>
          )}

          {/* ─── STEP 2: Super Admin Email ─── */}
          {step === "superadmin_email" && (
            <div>
              <button onClick={() => { setStep("role"); setError(""); }} className="text-text-gray text-sm mb-4 flex items-center gap-1 hover:text-white transition-colors">
                ← Orqaga
              </button>
              <div className="text-3xl mb-3">👑</div>
              <h2 className="text-xl font-bold text-white mb-1">Super Admin Kirish</h2>
              <p className="text-text-gray text-sm mb-6">Email manzilingizga tasdiqlash kodi yuboriladi</p>

              <div className="space-y-4">
                <div>
                  <label className="text-text-gray text-xs font-medium mb-1.5 block">Super Admin Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="superadmin@gboost.uz" className="ainput"
                    onKeyDown={e => e.key === "Enter" && handleSuperAdminEmail()} />
                </div>
                {error && <p className="text-red text-sm bg-red/10 border border-red/20 rounded-xl p-3">⚠️ {error}</p>}
                <button onClick={handleSuperAdminEmail} disabled={loading} className="abtn-primary disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuborilmoqda...</>
                    : "📧 Gmail ga kod yuborish"}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: OTP Tasdiqlash ─── */}
          {step === "superadmin_otp" && (
            <div>
              <div className="text-3xl mb-3">📧</div>
              <h2 className="text-xl font-bold text-white mb-1">Kodni kiriting</h2>
              <p className="text-text-gray text-sm mb-1">
                <span className="text-cyan font-semibold">{SUPER_ADMIN.otpSentTo}</span> ga 6 xonali kod yuborildi
              </p>
              <p className="text-gold text-xs mb-6 bg-gold/10 border border-gold/20 rounded-lg p-2">
                ⚡ Demo rejim: Kod ekranda alert sifatida ko'rsatildi
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-text-gray text-xs font-medium mb-1.5 block">Tasdiqlash Kodi</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                    placeholder="• • • • • •" maxLength={6}
                    className="ainput text-center text-2xl tracking-[0.5em] font-bold"
                    onKeyDown={e => e.key === "Enter" && handleOtpVerify()} />
                </div>
                {error && <p className="text-red text-sm bg-red/10 border border-red/20 rounded-xl p-3">⚠️ {error}</p>}
                <button onClick={handleOtpVerify} disabled={loading || otp.length !== 6} className="abtn-primary disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Tekshirilmoqda...</>
                    : "✅ Tasdiqlash"}
                </button>

                {/* Resend */}
                <div className="text-center">
                  {resendTimer > 0
                    ? <p className="text-text-gray text-sm">Qayta yuborish: <span className="text-cyan font-bold">{resendTimer}s</span></p>
                    : <button onClick={() => { setStep("superadmin_email"); setOtp(""); setError(""); }}
                        className="text-cyan text-sm hover:underline">
                        Qayta yuborish →
                      </button>
                  }
                </div>
                <button onClick={() => { setStep("role"); setError(""); setOtp(""); }}
                  className="w-full text-text-gray text-sm hover:text-white transition-colors text-center">
                  ← Orqaga
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Admin Login ─── */}
          {step === "admin_login" && (
            <div>
              <button onClick={() => { setStep("role"); setError(""); }} className="text-text-gray text-sm mb-4 flex items-center gap-1 hover:text-white transition-colors">
                ← Orqaga
              </button>
              <div className="text-3xl mb-3">🛡️</div>
              <h2 className="text-xl font-bold text-white mb-1">Admin Kirish</h2>
              <p className="text-text-gray text-sm mb-6">Super admin tomonidan berilgan login va parol bilan kiring</p>

              <div className="space-y-4">
                <div>
                  <label className="text-text-gray text-xs font-medium mb-1.5 block">Admin Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@gboost.uz" className="ainput" />
                </div>
                <div>
                  <label className="text-text-gray text-xs font-medium mb-1.5 block">Parol</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" className="ainput pr-12"
                      onKeyDown={e => e.key === "Enter" && handleAdminLogin()} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-white transition-colors text-sm">
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className={`text-sm rounded-xl p-3 ${
                    error.includes("o'chirilgan") ? "text-red bg-red/10 border border-red/20" :
                    error.includes("bloklangan")  ? "text-orange bg-orange/10 border border-orange/20" :
                    "text-red bg-red/10 border border-red/20"
                  }`}>⚠️ {error}</p>
                )}
                <button onClick={handleAdminLogin} disabled={loading} className="abtn-primary disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kirilmoqda...</>
                    : "🔐 Kirish"}
                </button>
              </div>

              {/* Demo hint */}
              <div className="mt-4 p-3 bg-cyan/5 border border-cyan/20 rounded-xl">
                <p className="text-cyan text-xs font-semibold mb-1">⚡ Demo login ma'lumotlari:</p>
                <p className="text-text-gray text-xs">admin1@gboost.uz / Admin@1234</p>
                <p className="text-text-gray text-xs">admin2@gboost.uz / Admin@5678</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-text-gray text-xs mt-4">
          🔒 Bu sahifa Google'da indekslanmaydi • robots: noindex
        </p>
      </div>
    </div>
  );
}
