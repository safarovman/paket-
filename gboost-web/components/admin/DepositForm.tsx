"use client";
import { useEffect, useState } from "react";
import { supabase, errText } from "@/lib/supabase";
import { som } from "@/lib/uzdrop";
import { num, Tg, type ProfileRow } from "./shared";

const PRESETS = [10_000, 50_000, 100_000, 500_000];
const fmt = (n: number | null) => (n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "");

type Target = { public_id: number; username: string | null; telegram: string | null; balance: number };

/**
 * Telegram orqali to'ldirish: admin foydalanuvchini ID bo'yicha tanlaydi, summani kiritadi →
 * admin_manual_deposit (deposits yozuvi yaratiladi — statistikada hisoblanadi).
 */
export default function DepositForm({ users, initialId, after, onClose }: {
  users: ProfileRow[]; initialId?: number | null;
  after: (ok: boolean, text: string) => Promise<void>; onClose?: () => void;
}) {
  const [idText, setIdText] = useState(initialId ? String(initialId) : "");
  const [target, setTarget] = useState<Target | null>(null);
  const [lookErr, setLookErr] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string; balance: number } | null>(null);

  // ID kiritilganda foydalanuvchini topish (avval yuklangan ro'yxatdan, bo'lmasa bazadan)
  useEffect(() => {
    setLookErr(""); setTarget(null);
    const id = num(idText);
    if (!id) return;
    const local = users.find(u => u.public_id === id);
    if (local) { setTarget({ public_id: id, username: local.username, telegram: local.telegram, balance: local.balance }); return; }
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("admin_find_user", { p_public_id: id });
      if (error) return setLookErr(errText(error));
      if (!data) return setLookErr("Bu ID bilan foydalanuvchi topilmadi");
      const d = data as Target;
      setTarget({ public_id: d.public_id, username: d.username, telegram: d.telegram, balance: d.balance });
    }, 400);
    return () => clearTimeout(t);
  }, [idText, users]);

  const submit = async () => {
    if (!target || !amount) return;
    const who = `ID ${target.public_id} (${target.username || "—"}${target.telegram ? ", @" + target.telegram : ""})`;
    if (!confirm(`${who} balansiga ${som(amount)} qo'shilsinmi?`)) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_manual_deposit", { p_public_id: target.public_id, p_amount: amount, p_note: note || null });
    setBusy(false);
    if (error) { await after(false, errText(error)); return; }
    const newBal = target.balance + amount;
    setDone({ code: data as string, balance: newBal });
    setTarget({ ...target, balance: newBal });
    setAmount(null); setNote("");
    await after(true, `✅ ${som(amount)} qo'shildi • ${data}`);
  };

  return (
    <div className="panel p-5 space-y-3 border-win/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black uppercase">💰 Telegram orqali to&apos;ldirish</p>
          <p className="text-xs text-muted">Foydalanuvchi Telegramda to&apos;lov chekini yuborgach, uning ID raqami va summani kiriting.</p>
        </div>
        {onClose && <button className="text-muted hover:text-white text-sm" onClick={onClose}>✕</button>}
      </div>

      <div>
        <label className="label">Foydalanuvchi ID raqami</label>
        <input className="input font-mono text-lg max-w-xs" inputMode="numeric" placeholder="100002"
          value={idText} onChange={e => { setIdText(e.target.value.replace(/\D/g, "")); setDone(null); }} />
        {target && (
          <div className="mt-2 rounded-xl bg-bg border border-line px-3 py-2 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-mono font-black text-accent">ID {target.public_id}</span>
            <span className="font-bold">{target.username || "—"}</span>
            <Tg u={target.telegram} />
            <span className="text-muted">Balans: <b className="text-white">{som(target.balance)}</b></span>
          </div>
        )}
        {lookErr && <p className="text-lose text-xs font-bold mt-1">{lookErr}</p>}
      </div>

      <div>
        <label className="label">Summa (so&apos;m)</label>
        <input className="input text-lg font-black max-w-xs" inputMode="numeric" placeholder="50 000"
          value={fmt(amount)} onChange={e => setAmount(num(e.target.value))} />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {PRESETS.map(p => (
            <button key={p} type="button" onClick={() => setAmount(p)}
              className={`chip !text-xs !py-1.5 !px-2.5 border ${amount === p ? "border-accent text-accent" : "border-line text-muted hover:text-white"}`}>
              {fmt(p)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Izoh (ixtiyoriy)</label>
        <input className="input" placeholder="Chek raqami, karta oxirgi 4 raqami…" value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <button disabled={busy || !target || !amount || amount < 1000} onClick={submit} className="btn-win w-full">
        {busy ? "…" : target && amount ? `ID ${target.public_id} ga ${som(amount)} qo'shish` : "Foydalanuvchi va summani kiriting"}
      </button>

      {done && (
        <p className="text-sm text-win font-bold">
          ✅ Qo&apos;shildi. Kod: <span className="font-mono select-all">{done.code}</span> • Yangi balans: {som(done.balance)}
        </p>
      )}
    </div>
  );
}
