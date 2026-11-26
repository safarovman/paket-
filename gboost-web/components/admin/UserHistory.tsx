"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { som } from "@/lib/uzdrop";
import { CopyBtn, Empty, Tg, dt, type ProfileRow } from "./shared";
import { txLabel } from "./activity";
import DepositForm from "./DepositForm";

interface Hist {
  user: { id: string; public_id: number; username: string | null; email: string | null; telegram: string | null; balance: number; is_admin: boolean; created_at: string };
  summary: { deposited: number; spent: number; earned: number; withdrawn: number; purchases: number };
  transactions: { type: string; amount: number; note: string | null; created_at: string }[];
  deliveries: { code: string; status: string; source: string; price: number; created_at: string; done_at: string | null; public_no: number | null; title: string; game: string }[];
  sold_accounts: { public_no: number | null; title: string; status: string; price: number; kind: string; created_at: string }[];
  deposits: { code: string | null; amount: number; method: string; status: string; created_at: string }[];
  withdrawals: { amount: number; card: string; status: string; created_at: string }[];
}

type Sec = "tx" | "buy" | "sold" | "dep" | "wd";
const SECS: { id: Sec; label: string }[] = [
  { id: "tx", label: "Pul harakatlari" },
  { id: "buy", label: "Xaridlar" },
  { id: "sold", label: "Sotgan akkauntlari" },
  { id: "dep", label: "To'ldirishlar" },
];

const D_ST: Record<string, { t: string; c: string }> = {
  waiting: { t: "Kutilmoqda", c: "bg-accent/15 text-accent" },
  delivered: { t: "Topshirildi", c: "bg-win/15 text-win" },
  cancelled: { t: "Bekor", c: "bg-lose/15 text-lose" },
};
const GEN_ST: Record<string, { t: string; c: string }> = {
  pending: { t: "Kutilmoqda", c: "bg-accent/15 text-accent" },
  approved: { t: "Tasdiqlangan", c: "bg-win/15 text-win" },
  paid: { t: "To'langan", c: "bg-win/15 text-win" },
  rejected: { t: "Rad etilgan", c: "bg-lose/15 text-lose" },
  active: { t: "Sotuvda", c: "bg-win/15 text-win" },
  sold: { t: "Sotildi", c: "bg-violet/20 text-violet-light" },
  pool: { t: "Keysda", c: "bg-violet/20 text-violet-light" },
  won: { t: "Yutilgan", c: "bg-violet/20 text-violet-light" },
  claimed: { t: "Olingan", c: "bg-violet/20 text-violet-light" },
};
const Chip = ({ s, map }: { s: string; map: Record<string, { t: string; c: string }> }) =>
  <span className={clsx("chip", map[s]?.c ?? "bg-panel2 text-muted")}>{map[s]?.t ?? s}</span>;

/** Foydalanuvchining to'liq tarixi (modal) */
export default function UserHistory({ publicId, users, after, onClose }: {
  publicId: number; users: ProfileRow[];
  after: (ok: boolean, text: string) => Promise<void>; onClose: () => void;
}) {
  const [h, setH] = useState<Hist | null>(null);
  const [err, setErr] = useState("");
  const [sec, setSec] = useState<Sec>("tx");
  const [dep, setDep] = useState(false);

  const load = async () => {
    setErr("");
    const { data, error } = await supabase.rpc("admin_user_activity", { p_public_id: publicId });
    if (error) return setErr(errText(error));
    setH(data as Hist);
  };
  useEffect(() => { setH(null); load(); /* eslint-disable-next-line */ }, [publicId]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const u = h?.user;
  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div className="panel w-full max-w-4xl p-5 sm:p-6 animate-fade-in my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <p className="label">📜 Foydalanuvchi tarixi</p>
          <button onClick={onClose} className="btn-ghost !py-1.5 !px-3">✕</button>
        </div>

        {err && <p className="text-lose font-bold text-sm mt-2">{err}</p>}
        {!h && !err && <p className="text-muted text-sm py-10 text-center">Yuklanmoqda…</p>}

        {h && u && (
          <>
            {/* Sarlavha */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-3xl font-black font-mono text-accent">ID {u.public_id}</p>
                  <CopyBtn text={String(u.public_id)} label="ID nusxa" />
                  {u.is_admin && <span className="chip bg-accent/15 text-accent">admin</span>}
                </div>
                <p className="font-bold">{u.username || "—"}</p>
                <p className="text-xs text-muted break-all">{u.email || "—"} • <Tg u={u.telegram} /></p>
                <p className="text-[11px] text-muted mt-1">Ro&apos;yxatdan o&apos;tgan: {dt(u.created_at)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="label !mb-0.5">Balans</p>
                <p className="text-2xl font-black text-accent whitespace-nowrap">{som(u.balance)}</p>
                <button onClick={() => setDep(!dep)} className="btn-win !py-2 mt-2">💰 Depozit qo&apos;shish</button>
              </div>
            </div>

            {dep && (
              <div className="mt-3">
                <DepositForm users={users} initialId={u.public_id}
                  after={async (ok, text) => { await after(ok, text); if (ok) { setDep(false); load(); } }}
                  onClose={() => setDep(false)} />
              </div>
            )}

            {/* Xulosa */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
              {[
                ["Jami to'ldirgan", som(h.summary.deposited), "text-win"],
                ["Sarflagan", som(h.summary.spent), "text-lose"],
                ["Ishlagan", som(h.summary.earned), "text-win"],
                ["Yechgan", som(h.summary.withdrawn), "text-accent"],
                ["Xaridlar soni", String(h.summary.purchases), "text-white"],
              ].map(([l, v, c]) => (
                <div key={l} className="rounded-xl bg-bg border border-line p-3">
                  <p className="text-[10px] uppercase font-bold text-muted">{l}</p>
                  <p className={clsx("font-black text-sm sm:text-base", c)}>{v}</p>
                </div>
              ))}
            </div>

            {/* Bo'limlar */}
            <div className="flex gap-1.5 overflow-x-auto mt-5 mb-3">
              {SECS.map(s => {
                const n = { tx: h.transactions.length, buy: h.deliveries.length, sold: h.sold_accounts.length, dep: h.deposits.length, wd: h.withdrawals.length }[s.id];
                return (
                  <button key={s.id} onClick={() => setSec(s.id)}
                    className={clsx("shrink-0 px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase",
                      sec === s.id ? "bg-accent text-[#1B1400]" : "bg-bg text-muted hover:text-white")}>
                    {s.label} <span className="opacity-70">({n})</span>
                  </button>
                );
              })}
            </div>

            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-line divide-y divide-line">
              {sec === "tx" && (h.transactions.length === 0 ? <Empty text="Pul harakatlari yo'q" /> : h.transactions.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{txLabel(t.type)}</p>
                    <p className="text-[11px] text-muted truncate">{t.note || "—"} • {dt(t.created_at)}</p>
                  </div>
                  <span className={clsx("font-black whitespace-nowrap", t.amount >= 0 ? "text-win" : "text-lose")}>
                    {t.amount >= 0 ? "+" : "−"}{som(Math.abs(t.amount))}
                  </span>
                </div>
              )))}
              {sec === "buy" && (h.deliveries.length === 0 ? <Empty text="Xaridlar yo'q" /> : h.deliveries.map(d => (
                <div key={d.code} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span className="font-mono font-black text-accent">#{d.public_no ?? "—"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{d.title} <span className="text-muted font-normal">{d.source === "spin" ? "• spin" : ""}</span></p>
                    <p className="text-[11px] text-muted"><span className="font-mono select-all">{d.code}</span> • {dt(d.created_at)}</p>
                  </div>
                  <Chip s={d.status} map={D_ST} />
                  <span className="font-black whitespace-nowrap">{som(d.price)}</span>
                </div>
              )))}
              {sec === "sold" && (h.sold_accounts.length === 0 ? <Empty text="Sotgan akkauntlari yo'q" /> : h.sold_accounts.map((a, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span className="font-mono font-black text-accent">#{a.public_no ?? "—"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{a.title}</p>
                    <p className="text-[11px] text-muted">{a.kind === "quick" ? "⚡ Tez sotish" : "Bozor"} • {dt(a.created_at)}</p>
                  </div>
                  <Chip s={a.status} map={GEN_ST} />
                  <span className="font-black whitespace-nowrap">{som(a.price)}</span>
                </div>
              )))}
              {sec === "dep" && (h.deposits.length === 0 ? <Empty text="To'ldirishlar yo'q" /> : h.deposits.map((d, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{d.method === "telegram" ? "Telegram (admin)" : d.method}</p>
                    <p className="text-[11px] text-muted"><span className="font-mono">{d.code || "—"}</span> • {dt(d.created_at)}</p>
                  </div>
                  <Chip s={d.status} map={GEN_ST} />
                  <span className="font-black text-win whitespace-nowrap">+{som(d.amount)}</span>
                </div>
              )))}
              {sec === "wd" && (h.withdrawals.length === 0 ? <Empty text="Yechishlar yo'q" /> : h.withdrawals.map((w, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm font-mono">💳 {w.card}</p>
                    <p className="text-[11px] text-muted">{dt(w.created_at)}</p>
                  </div>
                  <Chip s={w.status} map={GEN_ST} />
                  <span className="font-black text-lose whitespace-nowrap">−{som(w.amount)}</span>
                </div>
              )))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
