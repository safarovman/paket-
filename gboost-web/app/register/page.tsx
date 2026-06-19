"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role = "buyer" | "seller";

export default function RegisterPage() {
  const router = useRouter();

  // Steps: 1=asosiy, 2=rol, 3=tasdiqlash(OTP/email)
  const [step, setStep]           = useState<1|2|3>(1);
  const [role, setRole]           = useState<Role>("buyer");

  // Form
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [useOTP, setUseOTP]       = useState(true); // default OTP

  // OTP
  const [otp, setOtp]             = useState("");
  const [otpSent, setOtpSent]     = useState(false);

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [agree, setAgree]         = useState(false);

  // Password strength
  const pwStr = (pw: string) => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9!@#]/.test(pw)) s++;
    return s;
  };
  const strength = pwStr(password);
  const strColors = ["","bg-red-500","bg-yellow-500","bg-blue-500","bg-green-500"];
  const strLabels = ["","Zaif","O'rtacha","Yaxshi","Kuchli"];

  // Google
  const handleGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
  };

  // Step 1 validation
  const validateStep1 = () => {
    if (!name.trim())   { setError("Ismingizni kiriting"); return false; }
    if (!email.trim() || !email.includes("@")) { setError("To'g'ri email kiriting"); return false; }
    if (!useOTP) {
      if (password.length < 6) { setError("Parol kamida 6 ta belgi"); return false; }
      if (password !== confirm)  { setError("Parollar mos emas!"); return false; }
    }
    return true;
  };

  // OTP yuborish
  const sendOTP = async () => {
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
    setSuccess(`✅ 6 xonali kod ${email} ga yuborildi! Pochtangizni tekshiring.`);
    setLoading(false);
  };

  // OTP tasdiqlash
  const verifyOTP = async () => {
    if (otp.length !== 6) { setError("6 xonali kodni kiriting"); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.verifyOtp({
      email, token: otp, type: "email",
    });
    if (error) {
      setError(error.message.includes("expired")
        ? "Kod muddati o'tgan! Qayta yuborish tugmasini bosing."
        : "Noto'g'ri kod! Qayta urinib ko'ring.");
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id, name, email,
        phone: phone || null,
        role: role === "seller" ? "booster" : "client",
        karma: 100,
      }, { onConflict: "id", ignoreDuplicates: true });
    }
    router.push("/dashboard?welcome=1");
  };

  // Email/Parol ro'yxat
  const registerEmail = async () => {
    if (!agree) { setError("Shartlarga rozi bo'ling"); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { name, phone, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message.includes("already registered")
        ? "Bu email allaqachon ro'yxatdan o'tgan!"
        : error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id, name, email,
        phone: phone || null,
        role: role === "seller" ? "booster" : "client",
        karma: 100,
      }, { onConflict: "id", ignoreDuplicates: true });
    }
    setSuccess("✅ Emailingizga tasdiqlash havolasi yuborildi!");
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
      <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-gradient flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">G</span>
            </div>
            <span className="font-black text-xl text-gradient">GBoost</span>
          </Link>
          <p className="text-gray-500 text-sm">Bepul ro'yxatdan o'ting</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5 max-w-xs mx-auto">
          {["Ma'lumotlar","Rol","Tasdiqlash"].map((lbl, i) => {
            const s = (i+1) as 1|2|3;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  step > s ? "bg-green-500 text-white" :
                  step === s ? "bg-orange-gradient text-white" : "bg-[#2A2A2A] text-gray-500"
                }`}>{step > s ? "✓" : s}</div>
                <span className={`hidden sm:block ml-1 text-xs flex-1 ${step >= s ? "text-white" : "text-gray-600"}`}>{lbl}</span>
                {i < 2 && <div className={`flex-1 h-0.5 mx-1.5 ${step > s ? "bg-green-500" : "bg-[#2A2A2A]"}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">

          {/* ═══ STEP 1: Asosiy ma'lumotlar ═══ */}
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
                Google bilan ro'yxatdan o'tish
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#2A2A2A]" />
                <span className="text-gray-600 text-xs">yoki</span>
                <div className="flex-1 h-px bg-[#2A2A2A]" />
              </div>

              {/* OTP vs Parol tanlash */}
              <div className="flex gap-1 bg-[#111] rounded-xl p-1 border border-[#2A2A2A]">
                <button onClick={() => { setUseOTP(true); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    useOTP ? "bg-orange-500/20 text-orange-400" : "text-gray-500"}`}>
                  📧 Gmail kod (tavsiya)
                </button>
                <button onClick={() => { setUseOTP(false); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    !useOTP ? "bg-orange-500/20 text-orange-400" : "text-gray-500"}`}>
                  🔐 Parol bilan
                </button>
              </div>

              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">👤 Ism Familiya</label>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError(""); }}
                  placeholder="Abdulloh Karimov" className="ginput" />
              </div>

              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">📧 Email</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="email@gmail.com" className="ginput" />
              </div>

              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">📱 Telefon (ixtiyoriy)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67" className="ginput" />
              </div>

              {!useOTP && (
                <>
                  <div>
                    <label className="text-gray-500 text-xs font-medium mb-1.5 block">🔒 Parol</label>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        placeholder="Kamida 6 belgi" className="ginput pr-12" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{showPw?"🙈":"👁️"}</button>
                    </div>
                    {password && (
                      <div className="mt-1.5">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4].map(i=>(
                            <div key={i} className={`h-1 flex-1 rounded-full ${i<=strength?strColors[strength]:"bg-[#2A2A2A]"}`}/>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">Kuch: <span className={strength>=3?"text-green-400":strength>=2?"text-yellow-400":"text-red-400"}>{strLabels[strength]}</span></p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-medium mb-1.5 block">🔒 Tasdiqlang</label>
                    <input type="password" value={confirm} onChange={e=>{setConfirm(e.target.value);setError("");}}
                      placeholder="Qaytadan kiriting" className="ginput" />
                    {confirm && password===confirm && <p className="text-green-400 text-xs mt-1">✓ Mos</p>}
                  </div>
                </>
              )}

              {useOTP && (
                <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3 text-xs text-gray-400">
                  📧 Emailingizga <strong className="text-orange-400">6 xonali kod</strong> yuboriladi — parol kerak emas!
                </div>
              )}

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}

              <button onClick={() => { setError(""); if(validateStep1()) setStep(2); }}
                className="gbtn w-full py-3 rounded-xl">
                Davom etish →
              </button>
            </div>
          )}

          {/* ═══ STEP 2: Rol ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => { setStep(1); setError(""); }}
                className="text-gray-500 text-sm flex items-center gap-1 hover:text-white mb-2">
                ← Orqaga
              </button>
              <h3 className="text-white font-black text-lg mb-1">Siz kim bo'lasiz?</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id:"buyer",  icon:"🎮", title:"Xaridor",  desc:"Akkaunt sotib olaman" },
                  { id:"seller", icon:"💰", title:"Sotuvchi",  desc:"Akkaunt sotaman" },
                ].map(r => (
                  <button key={r.id} onClick={() => setRole(r.id as Role)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      role===r.id ? "border-orange-500 bg-orange-500/10" : "border-[#2A2A2A] bg-[#111] hover:border-[#3A3A3A]"
                    }`}>
                    <div className="text-3xl mb-2">{r.icon}</div>
                    <p className={`font-bold text-sm ${role===r.id?"text-orange-400":"text-white"}`}>{r.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{r.desc}</p>
                    {role===r.id && <p className="text-orange-400 text-xs mt-1.5 font-semibold">✓ Tanlandi</p>}
                  </button>
                ))}
              </div>

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}

              <button onClick={() => { setStep(3); setError(""); }}
                className="gbtn w-full py-3 rounded-xl">
                Davom etish →
              </button>
            </div>
          )}

          {/* ═══ STEP 3: Tasdiqlash ═══ */}
          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => { setStep(2); setError(""); setOtpSent(false); setOtp(""); setSuccess(""); }}
                className="text-gray-500 text-sm flex items-center gap-1 hover:text-white mb-2">
                ← Orqaga
              </button>

              {success && (
                <div className="bg-green-500/15 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
                  {success}
                </div>
              )}

              {/* OTP usuli */}
              {useOTP && (
                <>
                  {!otpSent ? (
                    <div className="space-y-4">
                      <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-4 text-sm space-y-1.5">
                        <p className="text-white font-bold">📋 Ma'lumotlar</p>
                        <p className="text-gray-400">👤 {name}</p>
                        <p className="text-gray-400">📧 {email}</p>
                        <p className="text-gray-400">🎭 {role==="buyer"?"🎮 Xaridor":"💰 Sotuvchi"}</p>
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}
                          className="mt-0.5 accent-orange-500 w-4 h-4 shrink-0" />
                        <span className="text-gray-500 text-xs leading-relaxed">
                          Men <Link href="/terms" className="text-orange-400">foydalanish shartlari</Link>ga roziman
                        </span>
                      </label>

                      {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}

                      <button onClick={() => {
                        if (!agree) { setError("Shartlarga rozi bo'ling"); return; }
                        sendOTP();
                      }} disabled={loading} className="gbtn w-full py-3.5 rounded-xl disabled:opacity-60">
                        {loading
                          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Yuborilmoqda...</span>
                          : "📧 Gmail ga Kod Yuborish →"}
                      </button>
                    </div>
                  ) : (
                    /* OTP KOD KIRISH JOYI */
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl mb-3">📬</div>
                        <h3 className="text-white font-black text-lg mb-1">Kodni kiriting</h3>
                        <p className="text-gray-500 text-sm">
                          <span className="text-orange-400 font-semibold">{email}</span> ga
                          6 xonali kod yuborildi
                        </p>
                      </div>

                      <input
                        type="text"
                        value={otp}
                        onChange={e => { setOtp(e.target.value.replace(/\D/g,"").slice(0,6)); setError(""); }}
                        placeholder="• • • • • •"
                        maxLength={6}
                        className="ginput text-center text-4xl tracking-[0.6em] font-black py-5"
                        autoFocus
                      />

                      {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">⚠️ {error}</p>}

                      <button onClick={verifyOTP} disabled={loading || otp.length !== 6}
                        className="gbtn w-full py-3.5 rounded-xl disabled:opacity-60">
                        {loading
                          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Tekshirilmoqda...</span>
                          : "✅ Tasdiqlash va Kirish"}
                      </button>

                      <div className="flex justify-between text-sm">
                        <button onClick={() => { setOtpSent(false); setOtp(""); setSuccess(""); setError(""); }}
                          className="text-gray-500 hover:text-white transition-colors">
                          Qayta yuborish →
                        </button>
                        <button onClick={() => { setOtpSent(false); setOtp(""); setSuccess(""); setError(""); }}
                          className="text-gray-600 hover:text-gray-400 transition-colors text-xs">
                          Email o'zgartirish
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Parol usuli */}
              {!useOTP && !success && (
                <div className="space-y-4">
                  <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-4 text-sm space-y-1.5">
                    <p className="text-white font-bold">📋 Ma'lumotlar</p>
                    <p className="text-gray-400">👤 {name}</p>
                    <p className="text-gray-400">📧 {email}</p>
                    <p className="text-gray-400">🎭 {role==="buyer"?"🎮 Xaridor":"💰 Sotuvchi"}</p>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}
                      className="mt-0.5 accent-orange-500 w-4 h-4 shrink-0" />
                    <span className="text-gray-500 text-xs leading-relaxed">
                      Men <Link href="/terms" className="text-orange-400">foydalanish shartlari</Link>ga roziman
                    </span>
                  </label>

                  {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}

                  <button onClick={registerEmail} disabled={loading}
                    className="gbtn w-full py-3.5 rounded-xl disabled:opacity-60">
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Yaratilmoqda...</span>
                      : "🚀 Hisob Yaratish"}
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="text-center mt-4 text-gray-500 text-sm">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="text-orange-400 font-semibold hover:underline">Kirish</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
