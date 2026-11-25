"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { som, game, rarity, ago, type Account } from "@/lib/uzdrop";
import Secrets from "@/components/profile/Secrets";
import LoginCta from "@/components/profile/LoginCta";

type Tab = "inv" | "buy" | "mine" | "tx";
const TABS: { id: Tab; label: string }[] = [
  { id: "inv",  label: "🎒 Inventar" },
  { id: "buy",  label: "🛒 Xaridlar" },
  { id: "mine", label: "📦 E'lonlarim" },
  { id: "tx",   label: "📜 Tarix" },
];

const TX_LABEL: Record<string, string> = {
  deposit: "To'ldirish", withdraw: "Yechish", buy: "Xarid", sale: "Sotuv", spin: "Spin",
  win_sell: "Yutuqni sotish", quick_sell: "Tez sotish", refund: "Qaytarish", admin: "Admin",
};

const STATUS: Record<string, { t: string; c: string }> = {
  pending:  { t: "Tekshiruvda",     c: "bg-accent/15 text-accent" },
  active:   { t: "Sotuvda",         c: "bg-win/15 text-win" },
  sold:     { t: "Sotildi",         c: "bg-violet/20 text-violet-light" },
  pool:     { t: "Sayt sotib oldi", c: "bg-violet/20 text-violet-light" },
  won:      { t: "Sayt sotib oldi", c: "bg-violet/20 text-violet-light" },
  claimed:  { t: "Sayt sotib oldi", c: "bg-violet/20 text-violet-light" },
  rejected: { t: "Rad etildi",      c: "bg-lose/15 text-lose" },
};

interface Tx { id: string; type: string; amount: number; note: string | null; created_at: string; }

function AccCard({ a, children }: { a: Account; children?: React.ReactNode }) {
  const r = rarity(a.price);
  const g = game(a.game);
  return (
    <div className="relative panel overflow-hidden flex flex-col" style={{ borderColor: r.color + "55" }}>
      <div className="absolute inset-x-0 top-0 h-28 opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${r.color}, transparent 70%)` }} />
      <div className="relative h-28 grid place-items-center">
        {a.image_url
          ? <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" />
          : <span className="text-5xl">{g.icon}</span>}
      </div>
      <div className="absolute inset-x-0 top-[108px] h-[3px]" style={{ background: r.color }} />
      <div className="relative p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="chip bg-panel2 text-muted">{g.icon} {g.name}</span>
          <span className="chip" style={{ background: r.color + "22", color: r.color }}>{r.name}</span>
        </div>
        <p className="font-extrabold leading-tight">{a.title}</p>
        {a.rank && <p className="text-xs text-muted">🏆 {a.rank}</p>}
        <p className="font-black" style={{ color: r.color }}>{som(a.price)}</p>
        <div className="mt-auto pt-1 space-y-2">{children}</div>
      </div>
    </div>
  );
}

function Reveal({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return open ? <Secrets accountId={id} />
    : <button onClick={() => setOpen(true)} className="btn-ghost w-full !py-2.5">🔑 Ma&apos;lumotlarni ko&apos;rish</button>;
}

export default function ProfilePage() {
  const { user, profile, loading, refresh } = useUser();
  const [tab, setTab] = useState<Tab>("inv");
  const [inv, setInv] = useState<Account[]>([]);
  const [bought, setBought] = useState<Account[]>([]);
  const [mine, setMine] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Account | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [a, b, c, d] = await Promise.all([
      supabase.from("accounts").select("*").eq("owner_id", user.id).in("status", ["won", "claimed"]).order("updated_at", { ascending: false }),
      supabase.from("accounts").select("*").eq("owner_id", user.id).eq("status", "sold").order("updated_at", { ascending: false }),
      supabase.from("accounts").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("transactions").select("id,type,amount,note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    ]);
    setInv((a.data as Account[]) || []);
    setBought((b.data as Account[]) || []);
    setMine((c.data as Account[]) || []);
    setTxs((d.data as Tx[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 3500); };

  const sell = async (a: Account) => {
    setBusy(a.id);
    const { error } = await supabase.rpc("sell_won", { p_account: a.id });
    setBusy(null);
    if (error) return flash(false, errText(error));
    flash(true, `⚡ Sotildi! +${som(a.price)} balansga qo'shildi`);
    await Promise.all([refresh(), load()]);
  };

  const claim = async (a: Account) => {
    setBusy(a.id);
    const { error } = await supabase.rpc("claim_won", { p_account: a.id });
    setBusy(null);
    setConfirm(null);
    if (error) return flash(false, errText(error));
    setRevealed(r => ({ ...r, [a.id]: true }));
    flash(true, "Akkaunt sizniki! Login va parol quyida.");
    await load();
  };

  if (loading) return <div className="wrap py-20 text-center text-muted">Yuklanmoqda...</div>;
  if (!user) return <LoginCta text="Inventar, xaridlar va tarixni ko'rish uchun hisobingizga kiring." />;

  const empty = (t: string, href: string, cta: string) => (
    <div className="panel p-10 text-center">
      <p className="text-muted mb-4">{t}</p>
      <Link href={href} className="btn-violet">{cta}</Link>
    </div>
  );

  return (
    <div className="wrap py-8 animate-fade-in">
      {/* Sarlavha */}
      <div className="panel p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-violet/20 blur-3xl pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-violet grid place-items-center text-2xl font-black uppercase shrink-0">
          {(profile?.username || user.email || "?")[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-black truncate">{profile?.username || "Foydalanuvchi"}</p>
          <p className="text-muted text-sm truncate">{user.email}</p>
        </div>
        <div className="relative flex items-center gap-3">
          <div>
            <p className="label !mb-0.5">Balans</p>
            <p className="text-2xl font-black text-accent whitespace-nowrap">{som(profile?.balance)}</p>
          </div>
          <Link href="/wallet" className="btn-accent">+ To&apos;ldirish</Link>
        </div>
      </div>

      {/* Tablar */}
      <div className="flex gap-1.5 mt-6 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx("px-4 py-2.5 rounded-xl text-[13px] font-extrabold uppercase whitespace-nowrap transition-colors",
              tab === t.id ? "bg-accent text-[#1B1400]" : "bg-panel text-muted hover:text-white")}>
            {t.label}
            {t.id === "inv" && inv.filter(a => a.status === "won").length > 0 &&
              <span className="ml-1.5 chip bg-lose text-white !px-1.5">{inv.filter(a => a.status === "won").length}</span>}
          </button>
        ))}
      </div>

      {msg && (
        <div className={clsx("mb-4 rounded-xl px-4 py-3 text-sm font-bold animate-fade-in",
          msg.ok ? "bg-win/15 text-win" : "bg-lose/15 text-lose")}>{msg.t}</div>
      )}

      {tab === "inv" && (inv.length === 0 ? empty("Inventar bo'sh. Keys ochib akkaunt yuting!", "/", "🎰 Spin qilish") : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {inv.map(a => (
            <AccCard key={a.id} a={a}>
              {a.status === "won" ? (
                <>
                  <button disabled={busy === a.id} onClick={() => sell(a)} className="btn-win w-full !py-2.5">
                    ⚡ Sotish +{som(a.price)}
                  </button>
                  <button disabled={busy === a.id} onClick={() => setConfirm(a)} className="btn-ghost w-full !py-2.5">
                    Olish
                  </button>
                </>
              ) : revealed[a.id] ? <Secrets accountId={a.id} /> : <Reveal id={a.id} />}
            </AccCard>
          ))}
        </div>
      ))}

      {tab === "buy" && (bought.length === 0 ? empty("Hali xarid qilmagansiz.", "/market", "🛒 Akkauntlar") : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bought.map(a => <AccCard key={a.id} a={a}><Reveal id={a.id} /></AccCard>)}
        </div>
      ))}

      {tab === "mine" && (mine.length === 0 ? empty("Sizda e'lonlar yo'q.", "/sell", "💰 Akkaunt sotish") : (
        <div className="space-y-2">
          {mine.map(a => {
            const st = STATUS[a.status] ?? STATUS.pending;
            return (
              <div key={a.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-3xl">{game(a.game).icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold truncate">{a.title}</p>
                  <p className="text-xs text-muted">{game(a.game).name}{a.rank ? ` • ${a.rank}` : ""} • {ago(a.created_at)} oldin</p>
                  {a.status === "rejected" && a.reject_note && <p className="text-xs text-lose mt-1">Sabab: {a.reject_note}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {a.kind === "quick" && <span className="chip bg-accent/15 text-accent">⚡ Tez sotish</span>}
                  <span className={clsx("chip", st.c)}>{st.t}</span>
                  <span className="font-black whitespace-nowrap">{som(a.kind === "quick" ? a.asked_price ?? a.price : a.price)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {tab === "tx" && (txs.length === 0 ? <div className="panel p-10 text-center text-muted">Tarix bo&apos;sh.</div> : (
        <div className="panel divide-y divide-line">
          {txs.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{TX_LABEL[t.type] ?? t.type}</p>
                <p className="text-xs text-muted truncate">{t.note || "—"} • {new Date(t.created_at).toLocaleString("uz-UZ")}</p>
              </div>
              <span className={clsx("font-black whitespace-nowrap", t.amount >= 0 ? "text-win" : "text-lose")}>
                {t.amount >= 0 ? "+" : "−"}{som(Math.abs(t.amount))}
              </span>
            </div>
          ))}
        </div>
      ))}

      {/* Olishni tasdiqlash */}
      {confirm && (
        <div className="fixed inset-0 z-[60] bg-black/70 grid place-items-center p-4" onClick={() => setConfirm(null)}>
          <div className="panel p-6 max-w-sm w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-black mb-2">Akkauntni olasizmi?</p>
            <p className="text-sm text-muted mb-5">
              Olgandan so&apos;ng login va parol ochiladi, lekin <b className="text-white">{confirm.title}</b> ni
              endi {som(confirm.price)} ga qayta sotib bo&apos;lmaydi.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="btn-ghost flex-1">Bekor</button>
              <button disabled={busy === confirm.id} onClick={() => claim(confirm)} className="btn-accent flex-1">Ha, olaman</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
