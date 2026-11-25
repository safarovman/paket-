"use client";
import { useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { game, som } from "@/lib/uzdrop";
import { CopyBtn, Empty, Tg, UserBlock, UserLine, dt, type Rpc, type UserInfo } from "./shared";

interface Found {
  type: "delivery" | "deposit";
  id?: string; code: string; status: string; source?: "buy" | "spin"; price?: number; amount?: number;
  method?: string; note?: string | null; admin_note?: string | null; created_at: string; done_at?: string | null;
  user: UserInfo;
  account?: { id: string; title: string; game: string; rank: string | null; kind: string; image_url: string | null };
  seller?: { public_id: number | null; username: string | null; telegram: string | null } | null;
  secret?: { login: string | null; password: string | null; extra: string | null };
}
export interface WaitingRow { code: string; user_id: string; source: string; price: number; created_at: string; accounts: { title: string; game: string } | null; }

const STATUS: Record<string, { t: string; c: string }> = {
  waiting:   { t: "⏳ Kutilmoqda",   c: "bg-accent/15 text-accent" },
  pending:   { t: "⏳ Kutilmoqda",   c: "bg-accent/15 text-accent" },
  delivered: { t: "✅ Topshirilgan", c: "bg-win/15 text-win" },
  approved:  { t: "✅ Tasdiqlangan", c: "bg-win/15 text-win" },
  cancelled: { t: "❌ Bekor qilingan", c: "bg-lose/15 text-lose" },
  rejected:  { t: "❌ Rad etilgan",  c: "bg-lose/15 text-lose" },
};

export default function CodeTab({ waiting, users, busy, rpc }: {
  waiting: WaitingRow[]; users: Record<string, UserInfo>; busy: boolean; rpc: Rpc;
}) {
  const [code, setCode] = useState("");
  const [f, setF] = useState<Found | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const find = async (c = code) => {
    const v = c.trim().toUpperCase();
    if (!v) return;
    setCode(v); setErr(""); setF(null); setNote(""); setLoading(true);
    const { data, error } = await supabase.rpc("admin_find_code", { p_code: v });
    setLoading(false);
    if (error) { setErr(errText(error)); return; }
    setF(data as Found);
  };
  const act = async (fn: string, args: Record<string, unknown>, ok: string) => {
    if (await rpc(fn, args, ok)) await find(f?.code);
  };

  const tgText = f?.secret && f.account ? [
    `UzDrop — akkauntingiz: ${f.account.title}`,
    `Kod: ${f.code}`,
    ``,
    `Login: ${f.secret.login ?? ""}`,
    `Parol: ${f.secret.password ?? ""}`,
    ...(f.secret.extra ? [`Qo'shimcha: ${f.secret.extra}`] : []),
    ``,
    `Iltimos parolni darhol almashtiring.`,
  ].join("\n") : "";

  const st = f ? STATUS[f.status] ?? { t: f.status, c: "bg-panel2 text-muted" } : null;
  const open = f && (f.status === "waiting" || f.status === "pending");

  return (
    <div className="space-y-6">
      <form onSubmit={e => { e.preventDefault(); find(); }} className="panel p-4 sm:p-5">
        <label className="label">Kodni kiriting (UZ-XXXX-XXXX yoki PAY-XXXX-XXXX)</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input !text-xl font-black font-mono tracking-widest uppercase" placeholder="UZ-AB12-CD34"
            value={code} onChange={e => setCode(e.target.value.toUpperCase())} autoFocus />
          <button disabled={loading || !code.trim()} className="btn-accent sm:w-40">{loading ? "…" : "Qidirish"}</button>
        </div>
        {err && <p className="text-lose text-sm font-bold mt-2">{err}</p>}
      </form>

      {f && st && (
        <div className="panel p-4 sm:p-5 space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-black text-lg">{f.code}</span>
            <span className={clsx("chip", st.c)}>{st.t}</span>
            <span className="chip bg-panel2 text-muted">
              {f.type === "deposit" ? "💳 Balans to'ldirish" : f.source === "spin" ? "🎰 Spin yutug'i" : "🛒 Xarid"}
            </span>
            <span className="text-xs text-muted ml-auto">{dt(f.created_at)}</span>
          </div>

          <UserBlock u={f.user} title={f.type === "deposit" ? "To'lovchi" : "Xaridor"} />

          {f.type === "deposit" ? (
            <div className="rounded-xl bg-bg border border-line p-4 space-y-1">
              <p className="text-3xl font-black text-accent">{som(f.amount)}</p>
              <p className="text-sm"><span className="text-muted">Usul:</span> <b className="uppercase">{f.method}</b></p>
              {f.note && <p className="text-sm break-words"><span className="text-muted">Izoh:</span> {f.note}</p>}
              <p className="text-xs text-muted">Telegramdagi chek summasi va karta raqami shu so&apos;rovga mosligini tekshiring.</p>
            </div>
          ) : (
            <>
              {f.account && (
                <div className="rounded-xl bg-bg border border-line p-4 flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-panel2 grid place-items-center shrink-0">
                    {f.account.image_url
                      ? <img src={f.account.image_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-4xl">{game(f.account.game).icon}</span>}
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="font-extrabold text-base">{f.account.title}</p>
                    <p className="text-muted">{game(f.account.game).icon} {game(f.account.game).name}{f.account.rank ? ` • ${f.account.rank}` : ""}</p>
                    <p>Narx: <b className="text-accent">{som(f.price)}</b></p>
                    {f.seller && (
                      <p className="text-xs mt-1">Sotuvchi: <b className="font-mono">ID {f.seller.public_id}</b> • {f.seller.username || "—"} • <Tg u={f.seller.telegram} /></p>
                    )}
                  </div>
                </div>
              )}

              {f.secret && (
                <div className="rounded-xl border border-violet/50 bg-violet/5 p-4 space-y-2">
                  <p className="label !mb-0">🔒 Akkaunt ma&apos;lumotlari (faqat Telegramda bering)</p>
                  {([["Login", f.secret.login], ["Parol", f.secret.password], ["Qo'shimcha", f.secret.extra]] as const)
                    .filter(([, v]) => v).map(([l, v]) => (
                      <div key={l} className="flex items-center gap-2 bg-bg border border-line rounded-lg px-3 py-2">
                        <span className="text-xs text-muted w-20 shrink-0">{l}</span>
                        <code className="flex-1 font-bold text-sm break-all">{v}</code>
                        <CopyBtn text={v as string} />
                      </div>
                    ))}
                  <div className="flex justify-end"><CopyBtn text={tgText} label="📋 Hammasini nusxalash (Telegram xabari)" /></div>
                </div>
              )}
            </>
          )}

          {f.admin_note && <p className="text-xs text-muted">Admin izohi: {f.admin_note}</p>}

          {open && (
            <div className="space-y-2 border-t border-line pt-4">
              {f.type === "delivery" && (
                <input className="input" placeholder="Izoh (ixtiyoriy)" value={note} onChange={e => setNote(e.target.value)} />
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                {f.type === "delivery" ? (
                  <>
                    <button disabled={busy} className="btn-win flex-1"
                      onClick={() => act("admin_deliver", { p_code: f.code, p_note: note || null }, "Topshirildi")}>✅ Topshirildi</button>
                    <button disabled={busy} className="btn-ghost !text-lose flex-1"
                      onClick={() => confirm("Bekor qilinsinmi? Xaridorga pul qaytadi, akkaunt sotuvdan olinadi.") &&
                        act("admin_cancel_delivery", { p_code: f.code, p_note: note || null }, "Bekor qilindi, pul qaytarildi")}>
                      ❌ Bekor qilish (pulni qaytarish)
                    </button>
                  </>
                ) : (
                  <>
                    <button disabled={busy} className="btn-win flex-1"
                      onClick={() => act("admin_deposit", { p_id: f.id, p_approve: true }, "Balans to'ldirildi")}>✅ Tasdiqlash</button>
                    <button disabled={busy} className="btn-ghost !text-lose flex-1"
                      onClick={() => confirm("Rad etilsinmi?") && act("admin_deposit", { p_id: f.id, p_approve: false }, "Rad etildi")}>❌ Rad etish</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="font-extrabold uppercase text-sm mb-3">⏳ Topshirilishi kutilayotganlar ({waiting.length})</p>
        {waiting.length === 0 ? <Empty text="Kutilayotgan topshirishlar yo'q" /> : (
          <div className="space-y-2">
            {waiting.map(w => (
              <button key={w.code} onClick={() => find(w.code)}
                className="panel p-3 w-full text-left flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 hover:border-violet transition-colors">
                <span className="font-mono font-black">{w.code}</span>
                <span className="text-sm flex-1 truncate">{w.source === "spin" ? "🎰" : "🛒"} {w.accounts?.title ?? "—"}</span>
                <UserLine u={users[w.user_id]} />
                <span className="text-xs text-muted">{dt(w.created_at)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
