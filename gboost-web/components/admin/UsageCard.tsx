"use client";
import { useEffect, useState } from "react";
import { supabase, errText } from "@/lib/supabase";

/** Supabase bepul tarif limitlari (Free plan). Tarif o'zgarsa shu yerda yangilang. */
const LIMITS = {
  db: 500 * 1024 * 1024,        // Baza: 500 MB
  storage: 1024 * 1024 * 1024,  // Fayl ombori: 1 GB
  mau: 50_000,                  // Oylik faol foydalanuvchilar
};

interface Usage {
  db_bytes: number; storage_bytes: number; storage_files: number; mau: number; users: number;
  tables: { name: string; bytes: number; rows: number }[];
}

const mb = (b: number) => b >= 1024 * 1024 * 1024 ? `${(b / 1024 ** 3).toFixed(2)} GB`
  : b >= 1024 * 1024 ? `${(b / 1024 ** 2).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const num = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function Bar({ label, used, limit, text, hint }: { label: string; used: number; limit: number; text: string; hint: string }) {
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct >= 90 ? "#DC2626" : pct >= 70 ? "#F59E0B" : "#FFC83D";
  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="label !mb-0">{label}</p>
        <p className="text-xs font-black" style={{ color }}>{pct < 0.1 && used > 0 ? "<0.1" : pct.toFixed(1)}%</p>
      </div>
      <p className="text-lg font-black mt-1">{text}</p>
      <div className="h-2.5 rounded-full bg-bg border border-line overflow-hidden mt-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, used > 0 ? 1 : 0)}%`, background: color }} />
      </div>
      <p className="text-[11px] text-muted mt-1.5">{hint}</p>
      {pct >= 80 && <p className="text-[11px] font-bold text-lose mt-1">⚠️ Limitga yaqin — Supabase Pro ($25/oy) ga o&apos;tishni o&apos;ylang.</p>}
    </div>
  );
}

export default function UsageCard() {
  const [u, setU] = useState<Usage | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  const load = async () => {
    setErr("");
    const { data, error } = await supabase.rpc("admin_usage");
    if (error) return setErr(errText(error));
    setU(data as Usage);
  };
  useEffect(() => { load(); }, []);

  if (err) return <div className="panel p-4 text-sm text-lose font-bold">Limitlarni o&apos;qib bo&apos;lmadi: {err}</div>;
  if (!u) return <div className="panel p-4 text-sm text-muted">Limitlar yuklanmoqda…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-black uppercase text-sm">📦 Bepul tarif limitlari (Supabase)</p>
        <button onClick={load} className="text-xs font-bold text-accent">↻ Yangilash</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Bar label="Baza hajmi" used={u.db_bytes} limit={LIMITS.db} text={`${mb(u.db_bytes)} / 500 MB`}
          hint="Foydalanuvchilar, akkauntlar, tranzaksiyalar" />
        <Bar label="Fayllar (rasmlar)" used={u.storage_bytes} limit={LIMITS.storage} text={`${mb(u.storage_bytes)} / 1 GB`}
          hint={`${num(u.storage_files)} ta fayl · R2 ga o'tilsa 10 GB bepul`} />
        <Bar label="Faol foydalanuvchilar (30 kun)" used={u.mau} limit={LIMITS.mau} text={`${num(u.mau)} / 50 000`}
          hint={`Jami ro'yxatdan o'tgan: ${num(u.users)}`} />
      </div>
      <button onClick={() => setOpen(!open)} className="text-xs text-muted hover:text-white">
        {open ? "▲ Jadvallarni yashirish" : "▼ Qaysi jadval qancha joy olgan"}
      </button>
      {open && (
        <div className="panel divide-y divide-line text-sm">
          {u.tables.map(t => (
            <div key={t.name} className="flex justify-between px-4 py-2">
              <span className="font-mono">{t.name}</span>
              <span className="text-muted">{num(t.rows)} qator · <b className="text-white">{mb(t.bytes)}</b></span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted">Trafik (egress, oyiga 5 GB) bu yerda ko&apos;rinmaydi — uni Supabase → Usage sahifasida tekshiring. Cloudflare saytlari uchun limit yo&apos;q.</p>
    </div>
  );
}
