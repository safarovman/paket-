"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role = "buyer" | "seller";

export default function RegisterPage() {
  const router  = useRouter();
  const [step, setStep]       = useState<1|2>(1);
  const [role, setRole]       = useState<Role>("buyer");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [agree, setAgree]     = useState(false);

  const pwStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 6)  s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    return s;
  };
  const strength = pwStrength(password);
  const strengthLabel = ["", "Zaif", "O'rtacha", "Yaxshi", "Kuchli"][strength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"][strength];

  // Google bilan ro'yxat
  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  // Step 1 validation
  const handleStep1 = () => {
    if (!name.trim())          { setError("Ism kiriting"); return; }
    if (!email.trim())         { setError("Email kiriting"); return; }
    if (password.length < 6)   { setError("Parol kamida 6 ta belgi"); return; }
    if (password !== confirm)   { setError("Parollar mos emas"); return; }
    setError(""); setStep(2);
  };

  // Register
  const handleRegister = async () => {
    if (!agree) { setError("Shartlarga rozi bo'lishingiz kerak"); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role },
      },
    });
    if (error) {
      setError(error.message === "User already registered"
        ? "Bu email allaqachon ro'yxatdan o'tgan!" : error.message);
      setLoading(false);
      return;
    }
    // Users jadvaliga qo'shish
    if (data.user) {
      await supabase.from("users").insert({
        id:    data.user.id,
        name,
        email,
        phone: phone || null,
        role:  role === "seller" ? "booster" : "client",
        karma: 100,
      });
    }
    router.push("/dashboard?welcome=1");
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
          {[1,2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                step >= s ? "bg-orange-gradient text-white shadow-lg" : "bg-[#2A2A2A] text-gray-500"
              }`}>
                {step > s ? "✓" : s}
              </div>
              <div className={`flex-1 h-0.5 ${s < 2 ? step > 1 ? "bg-orange-500" : "bg-[#2A2A2A]" : "hidden"}`} />
            </div>
          ))}
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-7">

          {step === 1 ? (
            <>
              {/* Google */}
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-5 rounded-xl transition-all mb-4 disabled:opacity-60">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google bilan ro'yxatdan o'tish
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#2A2A2A]" />
                <span className="text-gray-600 text-xs">yoki</span>
                <div className="flex-1 h-px bg-[#2A2A2A]" />
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-gray-500 text-xs font-medium mb-1.5 block">Ism Familiya</label>
                  <input type="text" value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                    placeholder="Abdulloh Karimov" className="ginput" />
                </div>
                {/* Email */}
                <div>
                  <label className="text-gray-500 text-xs font-medium mb-1.5 block">Email</label>
                  <input type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="email@gmail.com" className="ginput" />
                </div>
                {/* Phone */}
                <div>
                  <label className="text-gray-500 text-xs font-medium mb-1.5 block">Telefon (ixtiyoriy)</label>
                  <input type="tel" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67" className="ginput" />
                </div>
                {/* Password */}
                <div>
                  <label className="text-gray-500 text-xs font-medium mb-1.5 block">Parol</label>
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
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : "bg-[#2A2A2A]"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">Parol kuchi: <span className={`font-semibold ${strength >= 3 ? "text-green-400" : strength >= 2 ? "text-yellow-400" : "text-red-400"}`}>{strengthLabel}</span></p>
                    </div>
                  )}
                </div>
                {/* Confirm */}
                <div>
                  <label className="text-gray-500 text-xs font-medium mb-1.5 block">Parolni tasdiqlang</label>
                  <input type="password" value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(""); }}
                    placeholder="Qaytadan kiriting" className="ginput" />
                  {confirm && password === confirm && (
                    <p className="text-green-400 text-xs mt-1">✓ Parollar mos</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <button onClick={handleStep1} className="gbtn w-full py-3 rounded-xl">
                  Davom etish →
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => { setStep(1); setError(""); }}
                className="text-gray-500 text-sm mb-5 flex items-center gap-1 hover:text-white transition-colors">
                ← Orqaga
              </button>

              <h3 className="text-white font-black text-lg mb-1">Siz kim bo'lasiz?</h3>
              <p className="text-gray-500 text-sm mb-5">Bu keyinchalik o'zgartirish mumkin</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { id:"buyer",  icon:"🎮", title:"Xaridor",  desc:"Akkaunt sotib olaman yoki ijaralayman" },
                  { id:"seller", icon:"💰", title:"Sotuvchi",  desc:"Akkaunt sotaman yoki boosting beraman" },
                ].map(r => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id as Role)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      role === r.id ? "border-orange-500 bg-orange-500/10" : "border-[#2A2A2A] bg-[#111] hover:border-[#3A3A3A]"
                    }`}>
                    <div className="text-3xl mb-2">{r.icon}</div>
                    <p className={`font-bold text-sm ${role === r.id ? "text-orange-400" : "text-white"}`}>{r.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-snug">{r.desc}</p>
                    {role === r.id && <p className="text-orange-400 text-xs mt-1 font-semibold">✓ Tanlandi</p>}
                  </button>
                ))}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                  className="mt-0.5 accent-orange-500 w-4 h-4 rounded shrink-0" />
                <span className="text-gray-500 text-xs leading-relaxed">
                  Men{" "}
                  <Link href="/terms" className="text-orange-400 hover:underline">foydalanish shartlari</Link>
                  {" "}va{" "}
                  <Link href="/privacy" className="text-orange-400 hover:underline">maxfiylik siyosati</Link>
                  ga roziman
                </span>
              </label>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-4">
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleRegister} disabled={loading}
                className="gbtn w-full py-3 rounded-xl disabled:opacity-60">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yaratilmoqda...</>
                  : "🚀 Hisob Yaratish"}
              </button>
            </>
          )}
        </div>

        <p className="text-center mt-5 text-gray-500 text-sm">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="text-orange-400 font-semibold hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
