"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, errText } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up" | "code">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const redirect = () => `${window.location.origin}/login/done`;
  const run = async (fn: () => Promise<void>) => { setErr(""); setOk(""); setBusy(true); try { await fn(); } catch (e) { setErr(errText(e)); } setBusy(false); };

  const google = () => run(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect() } });
    if (error) throw error;
  });

  const submit = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) throw new Error(error.message.includes("Invalid") ? "Email yoki parol noto'g'ri" : error.message);
      router.push("/");
    } else if (mode === "up") {
      if (pw.length < 6) throw new Error("Parol kamida 6 belgi");
      const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { data: { full_name: name || email.split("@")[0] }, emailRedirectTo: redirect() } });
      if (error) throw error;
      if (data.session) router.push("/"); else setOk("✅ Pochtangizga tasdiqlash xati yuborildi.");
    } else if (!sent) {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect() } });
      if (error) throw error;
      setSent(true); setOk(`Kod ${email} ga yuborildi`);
    } else {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) throw new Error("Kod noto'g'ri yoki muddati o'tgan");
      router.push("/");
    }
  }); };

  return (
    <div className="wrap py-12 grid place-items-center">
      <div className="w-full max-w-md panel p-6 sm:p-8 animate-fade-in">
        <h1 className="h-title text-center">{mode === "up" ? "Ro'yxatdan o'tish" : "Kirish"}</h1>
        <p className="text-center text-muted text-sm mb-6">UzDrop — akkaunt savdosi va spin</p>

        <button onClick={google} disabled={busy} className="btn-ghost w-full mb-4">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Google orqali
        </button>

        <div className="flex gap-1 bg-bg rounded-xl p-1 mb-4">
          {([["in", "Parol"], ["code", "Email kod"], ["up", "Ro'yxat"]] as const).map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setErr(""); setOk(""); setSent(false); }}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase ${mode === m ? "bg-violet text-white" : "text-muted"}`}>{l}</button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && <div><label className="label">Nik</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>}
          <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={mode === "code" && sent} /></div>
          {mode !== "code" && <div><label className="label">Parol</label><input className="input" type="password" required value={pw} onChange={e => setPw(e.target.value)} /></div>}
          {mode === "code" && sent && <div><label className="label">6 xonali kod</label><input className="input text-center text-xl tracking-[.5em] font-black" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} /></div>}
          {err && <p className="text-lose text-sm font-bold">{err}</p>}
          {ok && <p className="text-win text-sm font-bold">{ok}</p>}
          <button disabled={busy} className="btn-accent w-full">
            {busy ? "…" : mode === "in" ? "Kirish" : mode === "up" ? "Ro'yxatdan o'tish" : sent ? "Tasdiqlash" : "Kod yuborish"}
          </button>
        </form>
      </div>
    </div>
  );
}
