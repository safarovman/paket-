"use client";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { som, ago, PAY_METHODS, DEPOSIT_CARD, DEPOSIT_CARD_OWNER } from "@/lib/uzdrop";
import LoginCta from "@/components/profile/LoginCta";

const PRESETS = [10_000, 25_000, 50_000, 100_000, 250_000];

interface Dep { id: string; amount: number; method: string; status: string; created_at: string; }
interface Wd  { id: string; amount: number; card: string; status: string; created_at: string; }

const ST: Record<string, { t: string; c: string }> = {
  pending:  { t: "Kutilmoqda",   c: "bg-accent/15 text-accent" },
  approved: { t: "Tasdiqlandi",  c: "bg-win/15 text-win" },
  paid:     { t: "To'landi",     c: "bg-win/15 text-win" },
  rejected: { t: "Rad etildi",   c: "bg-lose/15 text-lose" },
};

const digits = (s: string) => Number(s.replace(/\D/g, "")) || 0;
const fmtInput = (n: number) => (n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "");

export default function WalletPage() {
  const { user, profile, loading, refresh } = useUser();
  const [tab, setTab] = useState<"in" | "out">("in");
  const [method, setMethod] = useState(PAY_METHODS[0].id);
  const [amount, setAmount] = useState(50_000);
  const [note, setNote] = useState("");
  const [wAmount, setWAmount] = useState(0);
  const [card, setCard] = useState("");
  const [deps, setDeps] = useState<Dep[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [d, w] = await Promise.all([
      supabase.from("deposits").select("id,amount,method,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("withdrawals").select("id,amount,card,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setDeps((d.data as Dep[]) || []);
    setWds((w.data as Wd[]) || []);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const deposit = async () => {
    setMsg(null);
    if (amount < 1000) return setMsg({ ok: false, t: "Minimal summa 1 000 so'm" });
    setBusy(true);
    const { error } = await supabase.rpc("request_deposit", { p_amount: amount, p_method: method, p_note: note || null });
    setBusy(false);
    if (error) return setMsg({ ok: false, t: errText(error) });
    setNote("");
    setMsg({ ok: true, t: "✅ So'rov yuborildi! Admin bir necha daqiqada tasdiqlaydi va balansingiz to'ldiriladi." });
    load();
  };

  const withdraw = async () => {
    setMsg(null);
    if (wAmount < 10_000) return setMsg({ ok: false, t: "Minimal yechish 10 000 so'm" });
    if (card.replace(/\D/g, "").length < 16) return setMsg({ ok: false, t: "Karta raqamini to'liq kiriting (16 raqam)" });
    setBusy(true);
    const { error } = await supabase.rpc("request_withdraw", { p_amount: wAmount, p_card: card.trim() });
    setBusy(false);
    if (error) return setMsg({ ok: false, t: errText(error) });
    setWAmount(0); setCard("");
    setMsg({ ok: true, t: "✅ Yechish so'rovi qabul qilindi. Pul kartangizga tez orada o'tkaziladi." });
    await Promise.all([refresh(), load()]);
  };

  if (loading) return <div className="wrap py-20 text-center text-muted">Yuklanmoqda...</div>;
  if (!user) return <LoginCta text="Balansni to'ldirish va pul yechish uchun hisobingizga kiring." />;

  const cardFmt = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="wrap py-8 max-w-4xl animate-fade-in">
      {/* Balans */}
      <div className="panel p-6 sm:p-8 relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 120%, rgba(255,200,61,.35), transparent 60%)" }} />
        <p className="label relative">Sizning balansingiz</p>
        <p className="relative text-4xl sm:text-5xl font-black text-accent">{som(profile?.balance)}</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-6 mb-5 panel p-1.5">
        {([["in", "💳 To'ldirish"], ["out", "🏦 Yechish"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => { setTab(id); setMsg(null); }}
            className={clsx("py-3 rounded-xl text-sm font-extrabold uppercase transition-colors",
              tab === id ? "bg-accent text-[#1B1400]" : "text-muted hover:text-white")}>{l}</button>
        ))}
      </div>

      {msg && (
        <div className={clsx("mb-4 rounded-xl px-4 py-3 text-sm font-bold animate-fade-in",
          msg.ok ? "bg-win/15 text-win" : "bg-lose/15 text-lose")}>{msg.t}</div>
      )}

      {tab === "in" ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="panel p-5 space-y-5">
            <div>
              <p className="label">1. To&apos;lov usuli</p>
              <div className="grid grid-cols-4 gap-2">
                {PAY_METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className={clsx("py-2.5 rounded-xl text-xs font-extrabold border transition-colors",
                      method === m.id ? "border-accent bg-accent/10 text-accent" : "border-line bg-bg text-muted hover:text-white")}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label">2. Summa</p>
              <input className="input text-lg font-black" inputMode="numeric" value={fmtInput(amount)}
                onChange={e => setAmount(digits(e.target.value))} placeholder="50 000" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setAmount(p)}
                    className={clsx("chip !text-xs !py-1.5 !px-2.5 border",
                      amount === p ? "border-accent text-accent" : "border-line text-muted hover:text-white")}>
                    {fmtInput(p)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="panel p-5 space-y-4">
            <p className="label">3. Kartaga o&apos;tkazing</p>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-violet to-[#3A2A99] relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
              <p className="text-[11px] font-bold uppercase text-white/70">Karta raqami</p>
              <p className="text-xl font-black tracking-wider font-mono my-1">{DEPOSIT_CARD}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white/80">{DEPOSIT_CARD_OWNER}</p>
                <button onClick={() => { navigator.clipboard?.writeText(DEPOSIT_CARD.replace(/\s/g, "")); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="chip bg-white/20 text-white !py-1">{copied ? "✓ Nusxalandi" : "Nusxa olish"}</button>
              </div>
            </div>
            <p className="text-xs text-muted">
              Kartaga aynan <b className="text-accent">{som(amount)}</b> o&apos;tkazing, so&apos;ng «To&apos;ladim» tugmasini bosing.
              Admin to&apos;lovni bir necha daqiqada tekshirib, balansingizni to&apos;ldiradi.
            </p>
            <div>
              <label className="label">Izoh (ixtiyoriy)</label>
              <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Karta oxirgi 4 raqami yoki chek raqami" />
            </div>
            <button disabled={busy} onClick={deposit} className="btn-accent w-full">✅ To&apos;ladim — {som(amount)}</button>
          </div>

          <History title="To'ldirish so'rovlari" rows={deps.map(d => ({ id: d.id, a: d.amount, s: d.status, sub: `${PAY_METHODS.find(m => m.id === d.method)?.name ?? d.method} • ${ago(d.created_at)} oldin` }))} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="panel p-5 space-y-4">
            <div>
              <label className="label">Summa (min 10 000)</label>
              <input className="input text-lg font-black" inputMode="numeric" value={fmtInput(wAmount)}
                onChange={e => setWAmount(digits(e.target.value))} placeholder="100 000" />
              <button onClick={() => setWAmount(profile?.balance ?? 0)} className="text-xs font-bold text-accent mt-1.5">
                Hammasi: {som(profile?.balance)}
              </button>
            </div>
            <div>
              <label className="label">Karta raqami (Uzcard / Humo)</label>
              <input className="input font-mono" inputMode="numeric" value={card}
                onChange={e => setCard(cardFmt(e.target.value))} placeholder="8600 1234 5678 9012" />
            </div>
            <p className="text-xs text-muted">Summa balansdan darhol bloklanadi. Agar so&apos;rov rad etilsa, pul balansga qaytariladi.</p>
            <button disabled={busy} onClick={withdraw} className="btn-violet w-full">🏦 Yechib olish</button>
          </div>
          <History title="Yechish so'rovlari" rows={wds.map(w => ({ id: w.id, a: w.amount, s: w.status, sub: `•••• ${w.card.replace(/\D/g, "").slice(-4)} • ${ago(w.created_at)} oldin` }))} />
        </div>
      )}
    </div>
  );
}

function History({ title, rows }: { title: string; rows: { id: string; a: number; s: string; sub: string }[] }) {
  return (
    <div className="panel p-5 md:col-span-2">
      <p className="label mb-3">{title}</p>
      {rows.length === 0 ? <p className="text-sm text-muted">Hali so&apos;rovlar yo&apos;q.</p> : (
        <div className="divide-y divide-line">
          {rows.map(r => {
            const st = ST[r.s] ?? ST.pending;
            return (
              <div key={r.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{som(r.a)}</p>
                  <p className="text-xs text-muted truncate">{r.sub}</p>
                </div>
                <span className={clsx("chip", st.c)}>{st.t}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
