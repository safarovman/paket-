"use client";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { som, ago, PAY_METHODS, TELEGRAM_ADMIN, telegramLink } from "@/lib/uzdrop";
import { useDepositSettings } from "@/lib/useDeposit";
import LoginCta from "@/components/profile/LoginCta";
import CodeCard from "@/components/CodeCard";

const PRESETS = [10_000, 25_000, 50_000, 100_000, 250_000];

interface Dep { id: string; code: string | null; amount: number; method: string; status: string; created_at: string; }
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
  const { settings: dep } = useDepositSettings();
  const DEPOSIT_CARD = dep?.card ?? "…";
  const DEPOSIT_CARD_OWNER = dep?.owner ?? "";
  const [payCode, setPayCode] = useState<{ code: string; amount: number } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [d, w] = await Promise.all([
      supabase.from("deposits").select("id,code,amount,method,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
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
    const { data, error } = await supabase.rpc("request_deposit", { p_amount: amount, p_method: method, p_note: note || null });
    setBusy(false);
    if (error) return setMsg({ ok: false, t: errText(error) });
    setNote("");
    setPayCode({ code: data as string, amount });
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
          style={{ background: "radial-gradient(circle at 50% 120%, rgba(92,255,143,.35), transparent 60%)" }} />
        <p className="label relative">Sizning balansingiz</p>
        <p className="relative text-4xl sm:text-5xl font-black text-accent">{som(profile?.balance)}</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-6 mb-5 panel p-1.5">
        {([["in", "💳 To'ldirish"], ["out", "🏦 Yechish"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => { setTab(id); setMsg(null); }}
            className={clsx("py-3 rounded-xl text-sm font-extrabold uppercase transition-colors",
              tab === id ? "bg-accent text-[#03140A]" : "text-muted hover:text-white")}>{l}</button>
        ))}
      </div>

      {msg && (
        <div className={clsx("mb-4 rounded-xl px-4 py-3 text-sm font-bold animate-fade-in",
          msg.ok ? "bg-win/15 text-win" : "bg-lose/15 text-lose")}>{msg.t}</div>
      )}

      {tab === "in" ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="panel p-5 space-y-4">
            <p className="label">Admin orqali to&apos;ldirish (hozir ishlaydi)</p>
            <div>
              <label className="label">Summa</label>
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
            <div className="rounded-xl bg-bg border border-line p-4 text-center">
              <p className="text-xs text-muted">Sizning ID raqamingiz</p>
              <p className="text-3xl font-black text-accent">{profile?.public_id ?? "—"}</p>
            </div>
            <ol className="text-xs text-muted space-y-1.5 list-decimal pl-5">
              <li>Tugmani bosing — Telegramda <b className="text-white">@{TELEGRAM_ADMIN}</b> ga ID va summa bilan xabar ochiladi.</li>
              <li>Admin to&apos;lov uchun karta raqamini beradi. To&apos;lab, chekni yuboring.</li>
              <li>Admin tasdiqlashi bilan pul balansingizda ko&apos;rinadi.</li>
            </ol>
            <a href={telegramLink(`💳 Balans to'ldirmoqchiman\nMening UzDrop ID: ${profile?.public_id ?? ""}\nSumma: ${som(amount)}`)}
              target="_blank" rel="noopener noreferrer" className="btn-accent w-full">Telegramda adminga yozish</a>
            <p className="text-[11px] text-muted">⚠️ Faqat <b className="text-white">@{TELEGRAM_ADMIN}</b> ga to&apos;lang. Boshqa &quot;admin&quot;larga ishonmang — admin sizga birinchi yozmaydi.</p>
          </div>

          <div className="panel p-5 space-y-3">
            <p className="label">Avtomatik to&apos;lov</p>
            {PAY_METHODS.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3 opacity-70">
                <span className="font-extrabold">{m.name}</span>
                <span className="chip bg-accent/15 text-accent">Tez kunda</span>
              </div>
            ))}
            <p className="text-xs text-muted">Kartadan avtomatik to&apos;ldirish tez orada qo&apos;shiladi — to&apos;lov qilishingiz bilan pul darhol balansga tushadi.</p>
          </div>

          <History title="To'ldirishlar tarixi" rows={deps.map(d => ({ id: d.id, a: d.amount, s: d.status, sub: `${d.method === "telegram" ? "Telegram (admin)" : PAY_METHODS.find(m => m.id === d.method)?.name ?? d.method} • ${ago(d.created_at)} oldin` }))} />
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
      {payCode && (
        <div className="fixed inset-0 z-[60] bg-black/70 grid place-items-center p-4" onClick={() => setPayCode(null)}>
          <div className="panel p-6 max-w-sm w-full animate-fade-in max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <p className="font-black text-center mb-3">To&apos;ldirish so&apos;rovi: {som(payCode.amount)}</p>
            <CodeCard code={payCode.code} kind="deposit" amount={payCode.amount} />
            <button onClick={() => setPayCode(null)} className="btn-ghost w-full mt-3">Yopish</button>
          </div>
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
