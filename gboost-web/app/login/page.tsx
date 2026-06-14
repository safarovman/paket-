"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Method = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod]     = useState<Method>("email");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp]           = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [otpSent, setOtpSent]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // ─── Google bilan kirish
  const handleGoogle = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) setError("Google bilan kirishda xatolik: " + error.message);
    setLoading(false);
  };

  // ─── Email + Parol bilan kirish
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email va parolni kiriting"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message.includes("Invalid login credentials")
          ? "Email yoki parol noto'g'ri!"
          : error.message.includes("Email not confirmed")
          ? "Email tasdiqlanmagan! Pochtangizni tekshiring."
          : error.message
      );
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  // ─── Gmail OTP yuborish
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Email kiriting"); return; }
    if (!email.includes("@")) { setError("To'g'ri email kiriting"); return; }
    setLoading(true); setError(""); setSuccess("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Kod yuborishda xatolik: " + error.message);
      setLoading(false);
      return;
    }
    setOtpSent(true);
    setSuccess(`✅ Kod ${email} ga yuborildi! Pochtangizni tekshiring.`);
    setLoading(false);
  };

  // ─── OTP tasdiqlash
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { setError("6 xonali kodni kiriting"); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (error) {
      setError(
        error.message.includes("Token has expired")
          ? "Kod muddati o'tgan! Qayta yuborish tugmasini bosing."
          : "Noto'g'ri kod! Qayta urinib ko'ring."
      );
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute top-20 right-20 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-gradient flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl">G</span>
            </div>
            <span className="font-black text-2xl text-gradient">GBoost</span>
          </Link>
          <p className="text-gray-500 text-sm">Hisobingizga kiring</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-7">

          {/* Method tabs */}
          <div className="flex gap-1 bg-[#111] border border-[#2A2A2A] rounded-xl p-1 mb-5">
            <button onClick={() => { setMethod("email"); setError(""); setOtpSent(false); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                method === "email" ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-white"
              }`}>
              🔐 Parol bilan
            </button>
            <button onClick={() => { setMethod("otp"); setError(""); setOtpSent(false); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                method === "otp" ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-white"
              }`}>
              📧 Gmail kod bilan
            </button>
          </div>

          {/* Google Login */}
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-5 rounded-xl transition-all mb-4 disabled:opacity-60">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google bilan kirish
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#2A2A2A]" />
            <span className="text-gray-600 text-xs">yoki</span>
            <div className="flex-1 h-px bg-[#2A2A2A]" />
          </div>

          {/* Email + Parol */}
          {method === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">📧 Email</label>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="email@gmail.com" className="ginput" autoComplete="email" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-gray-500 text-xs font-medium">🔒 Parol</label>
                  <Link href="/forgot-password" className="text-orange-400 text-xs hover:underline">
                    Unutdingizmi?
                  </Link>
                </div>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••" className="ginput pr-12" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm">
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && <ErrorBox msg={error} />}

              <button type="submit" disabled={loading} className="gbtn w-full py-3 rounded-xl disabled:opacity-60">
                {loading ? <Spinner text="Kirilmoqda..." /> : "Kirish →"}
              </button>
            </form>
          )}

          {/* Gmail OTP */}
          {method === "otp" && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="text-gray-500 text-xs font-medium mb-1.5 block">📧 Gmail manzilingiz</label>
                    <input type="email" value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      placeholder="email@gmail.com" className="ginput" autoComplete="email" />
                    <p className="text-gray-600 text-xs mt-1.5">
                      Ushbu emailga 6 xonali tasdiqlash kodi yuboriladi
                    </p>
                  </div>
                  {error && <ErrorBox msg={error} />}
                  <button type="submit" disabled={loading} className="gbtn w-full py-3 rounded-xl disabled:opacity-60">
                    {loading ? <Spinner text="Yuborilmoqda..." /> : "📧 Kod Yuborish →"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  {success && (
                    <div className="bg-green-500/15 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
                      {success}
                    </div>
                  )}
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
                  <button type="submit" disabled={loading || otp.length !== 6}
                    className="gbtn w-full py-3 rounded-xl disabled:opacity-60">
                    {loading ? <Spinner text="Tekshirilmoqda..." /> : "✅ Tasdiqlash"}
                  </button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setError(""); setSuccess(""); }}
                      className="text-gray-500 hover:text-white transition-colors">
                      ← Orqaga
                    </button>
                    <button type="button" onClick={handleSendOTP as any}
                      className="text-orange-400 hover:underline">
                      Qayta yuborish →
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <p className="text-center mt-5 text-gray-500 text-sm">
            Hisobingiz yo'qmi?{" "}
            <Link href="/register" className="text-orange-400 font-semibold hover:underline">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>

        <div className="flex justify-center gap-6 mt-5">
          {["🛡️ Escrow", "🔒 SSL", "💳 O'zbek to'lovlar"].map(t => (
            <span key={t} className="text-gray-600 text-xs">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
      <span className="shrink-0 mt-0.5">⚠️</span>
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
