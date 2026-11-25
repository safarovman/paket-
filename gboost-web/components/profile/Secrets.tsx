"use client";
import { useEffect, useState } from "react";
import { supabase, errText } from "@/lib/supabase";

interface Secret { login: string; password: string; extra: string | null; }

function Row({ k, v }: { k: string; v: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex items-center gap-2 bg-bg border border-line rounded-lg px-3 py-2">
      <span className="text-[11px] font-bold uppercase text-muted w-16 shrink-0">{k}</span>
      <span className="text-sm font-mono break-all flex-1">{v}</span>
      <button onClick={() => { navigator.clipboard?.writeText(v); setOk(true); setTimeout(() => setOk(false), 1200); }}
        className="text-xs font-bold text-accent shrink-0">{ok ? "✓" : "Nusxa"}</button>
    </div>
  );
}

/** Akkaunt login/parolini ko'rsatadi (RLS faqat egasiga ruxsat beradi) */
export default function Secrets({ accountId }: { accountId: string }) {
  const [s, setS] = useState<Secret | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    supabase.from("account_secrets").select("login,password,extra").eq("account_id", accountId).maybeSingle()
      .then(({ data, error }) => {
        if (error) setErr(errText(error));
        else if (!data) setErr("Ma'lumot topilmadi");
        else setS(data as Secret);
      });
  }, [accountId]);
  if (err) return <p className="text-lose text-xs">{err}</p>;
  if (!s) return <p className="text-muted text-xs">Yuklanmoqda...</p>;
  return (
    <div className="space-y-1.5 animate-fade-in">
      <Row k="Login" v={s.login} />
      <Row k="Parol" v={s.password} />
      {s.extra && <Row k="Qo'shimcha" v={s.extra} />}
      <p className="text-[11px] text-muted">⚠️ Kirgandan so&apos;ng parol va bog&apos;langan pochtani darhol o&apos;zgartiring.</p>
    </div>
  );
}
