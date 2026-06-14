"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Step = 1 | 2 | 3;
type Role = "buyer" | "seller";
type RegMethod = "email" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>(1);
  const [regMethod, setRegMethod] = useState<RegMethod>("email");
  const [role, setRole]         = useState<Role>("buyer");

  // Form fields
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [agree, setAgree]       = useState(false);

  // OTP
  const [otpSent, setOtpSent]   = useState(false);
  const [otp, setOtp]           = useState("");

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Password strength
  const pwStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 6)    s++;
    if (pw.length >= 10)   s++;
    if (/[A-Z]/.test(pw))  s++;
    if (/[0-9!@#$]/.test(pw)) s++;
    return s;
  };
  const strength = pwStrength(password);
  const strengthColors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const strengthLabels = ["", "Zaif", "O'rtacha", "Yaxshi", "Kuchli"];

  // Google bilan ro'yxat
  const handleGoogle = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError("Google bilan kirishda xatolik");
    setLoading(false);
  };

  // Step 1 validation
  const validateStep1 = () => {
    if (!name.trim())            { setError("Ismingizni kiriting"); return false; }
    if (!email.trim())           { setError("Email kiriting"); return false; }
    if (!email.includes("@"))    { setError("To'g'ri email kiriting"); return false; }
    if (regMethod === "email") {
      if (password.length < 6)   { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return false; }
      if (password !== confirm)  { setError("Parollar mos emas!"); return false; }
    }
    return true;
  };

  // Step 1 → Step 2
  const goStep2 = () => {
    setError("");
    if (validateStep1()) setStep(2);
  };

  // Step 2 → Step 3 (rol tanlash)
  const goStep3 = () => {
    setError(""); setStep(3);
  };

  // OTP yuborish
  const handleSendOTP = async () => {
    setLoading(true); setError(""); setSuccess("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { name, phone, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Kod yuborishda xatolik: " + error.message);
      setLoading(false);
      return;
    }
    setOtpSent(true);
    setSuccess(`✅ Tasdiqlash kodi ${email} ga yuborildi!`);
    setLoading(false);
  };

  // OTP tasdiqlash
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) { setError("6 xonali kodni kiriting"); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (error) {
      setError(
        error.message.includes("expired")
          ? "Kod muddati o'tgan! Qayta yuborish tugmasini bosing."
          : "Noto'g'ri kod!"
      );
      setLoading(false);
      return;
    }
    // Users jadvaliga qo'shish
    if (data.user) {
      await supabase.from("users").upsert({
        id:    data.user.id,
        name,
        email,
        phone: phone || null,
        role:  role === "seller" ? "booster" : "client",
        karma: 100,
      }, { onConflict: "id" });
    }
    router.push("/dashboard?welcome=1");
  };

  // Email/Parol bilan ro'yxat
  const handleEmailRegister = async () => {
    if (!agree) { setError("Shartlarga rozi bo'ling"); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Bu email allaqachon ro'yxatdan o'tgan! Kirish sahifasiga o'ting."
          : error.message
      );
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase.from("users").upsert({
        id:    data.user.id,
        name,
        email,
        phone: phone || null,
        role:  role === "seller" ? "booster" : "client",
        karma: 100,
      }, { onConflict: "id" });
    }
    setSuccess("✅ Emailingizga tasdiqlash kodi yuborildi! Pochtangizni tekshiring.");
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-gradient flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl">G</span>
            </div>
            <span className="font-black text-2xl text-gradient">GBoost</span>
          </Link>
          <p className="text-gray-500 text-sm">Bepul ro'yxatdan o'ting</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 max-w-xs mx-auto">
          {["Ma'lumotlar", "Rol", "Tasdiqlash"].map((lbl, i) => {
            const s = (i + 1) as Step;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  step > s ? "bg-green-500 text-white" :
                  step === s ? "bg-orange-gradient text-white shadow-lg" :
                  "bg-[#2A2A2A] text-gray-500"
                }`}>
                  {step > s ? "✓" : s}
                </div>
                <div className={`hidden sm:block ml-1.5 flex-1`}>
                  <p className={`text-xs ${step >= s ? "text-white" : "text-gray-600"}`}>{lbl}</p>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-green-500" : "bg-[#2A2A2A]"}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-7">

          {/* ─── STEP 1: Asosiy ma'lumotlar ─── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Google */}
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-5 rounded-xl transition-all disabled:opacity-60">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google bilan tez kirish
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#2A2A2A]" />
                <span className="text-gray-600 text-xs">yoki email bilan</span>
                <div className="flex-1 h-px bg-[#2A2A2A]" />
              </div>

              {/* Ro'yxat usuli */}
              <div className="flex gap-1 bg-[#111] rounded-xl p-1 border border-[#2A2A2A]">
                <button onClick={() => setRegMethod("email")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    regMethod === "email" ? "bg-orange-500/20 text-orange-400" : "text-gray-500"}`}>
                  🔐 Parol bilan
                </button>
                <button onClick={() => setRegMethod("otp")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    regMethod === "otp" ? "bg-orange-500/20 text-orange-400" : "text-gray-500"}`}>
                  📧 Gmail kod bilan
                </button>
              </div>

              {/* Ism */}
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">👤 Ism Familiya</label>
                <input type="text" value={name}
                  onChange={e => { setName(e.target.value); setError(""); }}
                  placeholder="Abdulloh Karimov" className="ginput" />
              </div>

              {/* Email */}
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">📧 Email</label>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="email@gmail.com" className="ginput" />
              </div>

              {/* Telefon */}
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">📱 Telefon (ixtiyoriy)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67" className="ginput" />
              </div>

              {/* Parol — faqat email usulida */}
              {regMethod === "email" && (
                <>
                  <div>
                    <label className="text-gray-500 text-xs font-medium mb-1.5 block">🔒 Parol</label>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        placeholder="Kamida 6 ta belgi" className="ginput pr-12" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm">
                        {showPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-1.5">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : "bg-[#2A2A2A]"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Kuch: <span className={`font-semibold ${strength >= 3 ? "text-green-400" : strength >= 2 ? "text-yellow-400" : "text-red-400"}`}>
                            {strengthLabels[strength]}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-medium mb-1.5 block">🔒 Parolni tasdiqlang</label>
                    <input type="password" value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(""); }}
                      placeholder="Qaytadan kiriting" className="ginput" />
                    {confirm && password === confirm && (
                      <p className="text-green-400 text-xs mt-1">✓ Parollar mos</p>
                    )}
                  </div>
                </>
              )}

              {regMethod === "otp" && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-xs text-gray-400">
                  📧 Emailingizga <strong className="text-orange-400">6 xonali kod</strong> yuboriladi.
                  Kodni kiriting va hisobingiz tayyor!
                </div>
              )}

              {error && <ErrorBox msg={error} />}

              <button onClick={goStep2} disabled={loading}
                className="gbtn w-full py-3 rounded-xl disabled:opacity-60">
                Davom etish →
              </button>
            </div>
          )}

          {/* ─── STEP 2: Rol tanlash ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => { setStep(1); setError(""); }}
                className="text-gray-500 text-sm flex items-center gap-1 hover:text-white transition-colors mb-2">
                ← Orqaga
              </button>

              <h3 className="text-white font-black text-lg mb-1">Siz kim bo'lasiz?</h3>
              <p className="text-gray-500 text-sm mb-4">Keyinchalik o'zgartirish mumkin</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id:"buyer",  icon:"🎮", title:"Xaridor",  desc:"Akkaunt sotib olaman yoki ijaralayman",   color:"orange" },
                  { id:"seller", icon:"💰", title:"Sotuvchi",  desc:"Akkaunt sotaman yoki boosting xizmat beraman", color:"green" },
                ].map(r => (
                  <button key={r.id} onClick={() => setRole(r.id as Role)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      role === r.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-[#2A2A2A] bg-[#111] hover:border-[#3A3A3A]"
                    }`}>
                    <div className="text-3xl mb-2">{r.icon}</div>
                    <p className={`font-bold text-sm ${role === r.id ? "text-orange-400" : "text-white"}`}>
                      {r.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-snug">{r.desc}</p>
                    {role === r.id && <p className="text-orange-400 text-xs mt-1.5 font-semibold">✓ Tanlandi</p>}
                  </button>
                ))}
              </div>

              {error && <ErrorBox msg={error} />}

              <button onClick={goStep3} className="gbtn w-full py-3 rounded-xl">
                Davom etish →
              </button>
            </div>
          )}

          {/* ─── STEP 3: Tasdiqlash ─── */}
          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => { setStep(2); setError(""); setOtpSent(false); setOtp(""); }}
                className="text-gray-500 text-sm flex items-center gap-1 hover:text-white transition-colors mb-2">
                ← Orqaga
              </button>

              {success && (
                <div className="bg-green-500/15 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
                  {success}
                </div>
              )}

              {/* Xulosa */}
              <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-4 text-sm space-y-2">
                <p className="text-white font-bold mb-3">📋 Ma'lumotlar</p>
                {[
                  ["👤 Ism",    name],
                  ["📧 Email",  email],
                  ["📱 Telefon",phone || "—"],
                  ["🎭 Rol",    role === "buyer" ? "🎮 Xaridor" : "💰 Sotuvchi"],
                  ["🔐 Usul",   regMethod === "email" ? "Email + Parol" : "Gmail Kod"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between border-b border-[#2A2A2A] pb-1.5">
                    <span className="text-gray-500">{l}:</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>

              {/* Email + Parol usuli */}
              {regMethod === "email" && !success && (
                <>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                      className="mt-0.5 accent-orange-500 w-4 h-4 shrink-0" />
                    <span className="text-gray-500 text-xs leading-relaxed">
                      Men{" "}
                      <Link href="/terms" className="text-orange-400 hover:underline">foydalanish shartlari</Link>
                      {" "}va{" "}
                      <Link href="/privacy" className="text-orange-400 hover:underline">maxfiylik siyosati</Link>
                      ga roziman
                    </span>
                  </label>

                  {error && <ErrorBox msg={error} />}

                  <button onClick={handleEmailRegister} disabled={loading}
                    className="gbtn w-full py-3.5 rounded-xl disabled:opacity-60">
                    {loading ? <Spinner text="Yaratilmoqda..." /> : "🚀 Hisob Yaratish"}
                  </button>
                </>
              )}

              {/* OTP usuli */}
              {regMethod === "otp" && (
                <>
                  {!otpSent ? (
                    <>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                          className="mt-0.5 accent-orange-500 w-4 h-4 shrink-0" />
                        <span className="text-gray-500 text-xs leading-relaxed">
                          Men{" "}
                          <Link href="/terms" className="text-orange-400 hover:underline">foydalanish shartlari</Link>
                          {" "}ga roziman
                        </span>
                      </label>

                      {error && <ErrorBox msg={error} />}

                      <button onClick={() => {
                        if (!agree) { setError("Shartlarga rozi bo'ling"); return; }
                        handleSendOTP();
                      }} disabled={loading}
                        className="gbtn w-full py-3.5 rounded-xl disabled:opacity-60">
                        {loading ? <Spinner text="Yuborilmoqda..." /> : "📧 Gmail ga Kod Yuborish →"}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-gray-500 text-xs font-medium mb-1.5 block">
                          🔢 6 xonali kod ({email})
                        </label>
                        <input
                          type="text"
                          value={otp}
                          onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                          placeholder="• • • • • •"
                          maxLength={6}
                          className="ginput text-center text-3xl tracking-[0.5em] font-black"
                          autoFocus
                        />
                      </div>

                      {error && <ErrorBox msg={error} />}

                      <button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}
                        className="gbtn w-full py-3 rounded-xl disabled:opacity-60">
                        {loading ? <Spinner text="Tekshirilmoqda..." /> : "✅ Tasdiqlash va Kirish"}
                      </button>

                      <button onClick={() => { setOtpSent(false); setOtp(""); setSuccess(""); setError(""); }}
                        className="w-full text-gray-500 hover:text-white text-sm text-center transition-colors">
                        Qayta yuborish →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <p className="text-center mt-5 text-gray-500 text-sm">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="text-orange-400 font-semibold hover:underline">Kirish</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
      <span className="shrink-0">⚠️</span>
      <span>{msg}</span>
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {text}
    </span>
  );
}
