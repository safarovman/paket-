"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { GAMES, chances, game, rarity, som, type Account, type Case } from "@/lib/uzdrop";

type Tab = "accounts" | "deposits" | "withdrawals" | "cases" | "add" | "users";
const TABS: { id: Tab; label: string }[] = [
  { id: "accounts",    label: "Akkauntlar" },
  { id: "deposits",    label: "To'ldirish" },
  { id: "withdrawals", label: "Yechish" },
  { id: "cases",       label: "Keyslar" },
  { id: "add",         label: "Akkaunt qo'shish" },
  { id: "users",       label: "Foydalanuvchilar" },
];

interface Secret { account_id: string; login: string; password: string; extra: string | null; }
interface Deposit { id: string; user_id: string; amount: number; method: string; note: string | null; created_at: string; }
interface Withdrawal { id: string; user_id: string; amount: number; card: string; created_at: string; }
interface ProfileRow { id: string; username: string | null; balance: number; is_admin: boolean; }
interface PoolRow { case_id: string; price: number; }

const num = (v: string) => { const n = parseInt(v.replace(/\D/g, ""), 10); return isNaN(n) ? null : n; };

export default function AdminPage() {
  const { profile, loading } = useUser();
  const [tab, setTab] = useState<Tab>("accounts");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [pending, setPending]       = useState<Account[]>([]);
  const [secrets, setSecrets]       = useState<Record<string, Secret>>({});
  const [names, setNames]           = useState<Record<string, string>>({});
  const [deposits, setDeposits]     = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [cases, setCases]           = useState<Case[]>([]);
  const [pool, setPool]             = useState<PoolRow[]>([]);
  const [users, setUsers]           = useState<ProfileRow[]>([]);

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 4000); };

  const load = useCallback(async () => {
    const [acc, dep, wd, cs, pl, us] = await Promise.all([
      supabase.from("accounts").select("*").eq("status", "pending").order("created_at"),
      supabase.from("deposits").select("*").eq("status", "pending").order("created_at"),
      supabase.from("withdrawals").select("*").eq("status", "pending").order("created_at"),
      supabase.from("cases").select("*").order("sort"),
      supabase.from("accounts").select("case_id,price").eq("status", "pool"),
      supabase.from("profiles").select("id,username,balance,is_admin").order("created_at", { ascending: false }).limit(500),
    ]);
    const accs = (acc.data ?? []) as Account[];
    setPending(accs);
    setDeposits((dep.data ?? []) as Deposit[]);
    setWithdrawals((wd.data ?? []) as Withdrawal[]);
    setCases((cs.data ?? []) as Case[]);
    setPool((pl.data ?? []) as PoolRow[]);
    const us2 = (us.data ?? []) as ProfileRow[];
    setUsers(us2);
    setNames(Object.fromEntries(us2.map(u => [u.id, u.username || u.id.slice(0, 8)])));
    if (accs.length) {
      const { data } = await supabase.from("account_secrets").select("*").in("account_id", accs.map(a => a.id));
      setSecrets(Object.fromEntries(((data ?? []) as Secret[]).map(s => [s.account_id, s])));
    } else setSecrets({});
  }, []);

  useEffect(() => { if (profile?.is_admin) load(); }, [profile?.is_admin, load]);

  const rpc = async (fn: string, args: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) { flash(false, errText(error)); return false; }
    flash(true, ok); await load(); return true;
  };

  if (loading) return <div className="wrap py-20 text-center text-muted">Yuklanmoqda…</div>;
  if (!profile?.is_admin) return (
    <div className="wrap py-20">
      <div className="panel p-8 max-w-lg mx-auto text-center">
        <p className="text-4xl mb-3">⛔</p>
        <h1 className="h-title mb-2">Ruxsat yo&apos;q</h1>
        <p className="text-muted text-sm">Bu sahifa faqat adminlar uchun. Admin qilish uchun Supabase SQL Editor&apos;da
          <code className="text-accent"> supabase/uzdrop.sql</code> oxiridagi <code className="text-accent">update public.profiles set is_admin = true …</code> buyrug&apos;ini o&apos;z emailingiz bilan ishga tushiring.</p>
      </div>
    </div>
  );

  const counts: Partial<Record<Tab, number>> = { accounts: pending.length, deposits: deposits.length, withdrawals: withdrawals.length };

  return (
    <div className="wrap py-8">
      <h1 className="h-title mb-5">🛠 Admin panel</h1>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx("shrink-0 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-colors",
              tab === t.id ? "bg-accent text-[#1B1400]" : "bg-panel text-muted hover:text-white")}>
            {t.label}
            {!!counts[t.id] && <span className="ml-1.5 chip bg-lose text-white !px-1.5">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {msg && (
        <div className={clsx("fixed bottom-5 right-5 z-50 panel px-4 py-3 text-sm font-bold animate-fade-in max-w-sm",
          msg.ok ? "border-win text-win" : "border-lose text-lose")}>{msg.text}</div>
      )}

      {tab === "accounts" && (
        <div className="space-y-4">
          {pending.length === 0 && <Empty text="Ko'rib chiqiladigan akkaunt yo'q" />}
          {pending.map(a => (
            <PendingRow key={a.id} a={a} secret={secrets[a.id]} seller={a.seller_id ? names[a.seller_id] : "—"}
              cases={cases} busy={busy}
              onAction={(action, price, caseId, payout, note) =>
                rpc("admin_review_account",
                  { p_id: a.id, p_action: action, p_price: price, p_case: caseId, p_payout: payout, p_note: note },
                  action === "reject" ? "Rad etildi" : action === "market" ? "Bozorga chiqarildi" : "Keysga qo'shildi")} />
          ))}
        </div>
      )}

      {tab === "deposits" && (
        <div className="space-y-3">
          {deposits.length === 0 && <Empty text="To'ldirish so'rovlari yo'q" />}
          {deposits.map(d => (
            <div key={d.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-accent text-lg">{som(d.amount)}</p>
                <p className="text-sm">{names[d.user_id] ?? d.user_id.slice(0, 8)} • <span className="uppercase text-muted">{d.method}</span></p>
                {d.note && <p className="text-xs text-muted mt-1 break-words">📝 {d.note}</p>}
                <p className="text-[11px] text-muted mt-1">{new Date(d.created_at).toLocaleString("uz-UZ")}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={busy} className="btn-win" onClick={() => rpc("admin_deposit", { p_id: d.id, p_approve: true }, "Balans to'ldirildi")}>Tasdiqlash</button>
                <button disabled={busy} className="btn-ghost" onClick={() => rpc("admin_deposit", { p_id: d.id, p_approve: false }, "Rad etildi")}>Rad</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "withdrawals" && (
        <div className="space-y-3">
          {withdrawals.length === 0 && <Empty text="Yechish so'rovlari yo'q" />}
          {withdrawals.map(w => (
            <div key={w.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-accent text-lg">{som(w.amount)}</p>
                <p className="text-sm">{names[w.user_id] ?? w.user_id.slice(0, 8)}</p>
                <p className="text-sm font-mono text-white mt-1 select-all">💳 {w.card}</p>
                <p className="text-[11px] text-muted mt-1">{new Date(w.created_at).toLocaleString("uz-UZ")}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={busy} className="btn-win" onClick={() => rpc("admin_withdraw", { p_id: w.id, p_paid: true }, "To'landi deb belgilandi")}>To&apos;landi</button>
                <button disabled={busy} className="btn-ghost" onClick={() => rpc("admin_withdraw", { p_id: w.id, p_paid: false }, "Rad etildi, pul qaytarildi")}>Rad</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "cases" && <CasesTab cases={cases} pool={pool} busy={busy}
        onSave={(args) => rpc("admin_save_case", args, "Keys saqlandi")} />}

      {tab === "add" && <AddAccount cases={cases} busy={busy}
        onSave={(args) => rpc("admin_add_account", args, "Akkaunt qo'shildi")} />}

      {tab === "users" && <UsersTab users={users} busy={busy}
        onAdjust={(id, delta, note) => rpc("admin_set_balance", { p_user: id, p_delta: delta, p_note: note }, "Balans o'zgartirildi")} />}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="panel p-10 text-center text-muted text-sm">{text}</div>;
}

function PendingRow({ a, secret, seller, cases, busy, onAction }: {
  a: Account; secret?: Secret; seller: string; cases: Case[]; busy: boolean;
  onAction: (action: "market" | "pool" | "reject", price: number | null, caseId: string | null, payout: number | null, note: string | null) => void;
}) {
  const quick = a.kind === "quick";
  const [price, setPrice]   = useState(String(a.asked_price ?? a.price));
  const [payout, setPayout] = useState(String(a.asked_price ?? a.price));
  const [caseId, setCaseId] = useState("");
  const [note, setNote]     = useState("");
  const g = game(a.game);
  const p = num(price), po = quick ? num(payout) : null;

  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={clsx("chip", quick ? "bg-accent/15 text-accent" : "bg-violet/20 text-violet-light")}>
          {quick ? "⚡ Tez sotish" : "Bozor"}
        </span>
        <span className="chip bg-panel2 text-muted">{g.icon} {g.name}</span>
        {a.rank && <span className="chip bg-panel2 text-muted">{a.rank}</span>}
        <span className="text-xs text-muted ml-auto">Sotuvchi: <b className="text-white">{seller}</b></span>
      </div>
      <p className="font-extrabold text-lg">{a.title}</p>
      {a.description && <p className="text-sm text-muted mt-1 whitespace-pre-wrap break-words">{a.description}</p>}
      <p className="text-sm mt-2">So&apos;ralgan narx: <b className="text-accent">{som(a.asked_price ?? a.price)}</b></p>

      <div className="mt-3 rounded-xl bg-bg border border-line p-3 text-sm font-mono break-all">
        {secret ? (
          <>
            <p><span className="text-muted">Login:</span> <span className="select-all">{secret.login}</span></p>
            <p><span className="text-muted">Parol:</span> <span className="select-all">{secret.password}</span></p>
            {secret.extra && <p><span className="text-muted">Qo&apos;shimcha:</span> {secret.extra}</p>}
          </>
        ) : <p className="text-muted">Ma&apos;lumotlar topilmadi</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div>
          <label className="label">Narx / qiymat</label>
          <input className="input" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} />
          {p && <p className="text-[11px] mt-1" style={{ color: rarity(p).color }}>{rarity(p).name}</p>}
        </div>
        {quick && (
          <div>
            <label className="label">Sotuvchiga to&apos;lov</label>
            <input className="input" inputMode="numeric" value={payout} onChange={e => setPayout(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Keys (spin uchun)</label>
          <select className="input" value={caseId} onChange={e => setCaseId(e.target.value)}>
            <option value="">— tanlang —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.name} ({som(c.price)})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Izoh (rad etishda)</label>
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Sabab…" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button disabled={busy || !p} className="btn-accent" onClick={() => onAction("market", p, null, po, null)}>🛒 Bozorga chiqarish</button>
        <button disabled={busy || !p || !caseId} className="btn-violet" onClick={() => onAction("pool", p, caseId, po, null)}>🎰 Keysga qo&apos;shish</button>
        <button disabled={busy} className="btn-ghost !text-lose" onClick={() => onAction("reject", null, null, null, note || null)}>Rad etish</button>
      </div>
    </div>
  );
}

const emptyCase = { id: "", name: "", game: GAMES[0].id, price: "", image_url: "", color: "#7C5CFF", sort: "0", active: true };

function CasesTab({ cases, pool, busy, onSave }: {
  cases: Case[]; pool: PoolRow[]; busy: boolean; onSave: (args: Record<string, unknown>) => Promise<boolean>;
}) {
  const [f, setF] = useState(emptyCase);
  const stats = useMemo(() => {
    const m: Record<string, { n: number; total: number; ev: number }> = {};
    for (const c of cases) {
      const items = pool.filter(p => p.case_id === c.id);
      const ch = chances(items);
      m[c.id] = { n: items.length, total: items.reduce((s, i) => s + i.price, 0), ev: items.reduce((s, i, k) => s + ch[k] * i.price, 0) };
    }
    return m;
  }, [cases, pool]);

  const save = async () => {
    const ok = await onSave({
      p_id: f.id || null, p_name: f.name, p_game: f.game, p_price: num(f.price), p_image_url: f.image_url,
      p_color: f.color, p_sort: num(f.sort) ?? 0, p_active: f.active,
    });
    if (ok) setF(emptyCase);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-3">
        {cases.length === 0 && <Empty text="Hali keys yo'q — o'ngdagi forma orqali yarating" />}
        {cases.map(c => {
          const s = stats[c.id] ?? { n: 0, total: 0, ev: 0 };
          const edge = s.ev ? (1 - s.ev / c.price) * 100 : 0;
          return (
            <div key={c.id} className="panel p-4 flex flex-col sm:flex-row gap-4 sm:items-center"
              style={{ boxShadow: `inset 4px 0 0 ${c.color}` }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold">{c.name}</p>
                  {!c.active && <span className="chip bg-lose/15 text-lose">O&apos;chiq</span>}
                </div>
                <p className="text-xs text-muted">{game(c.game).icon} {game(c.game).name} • narx <b className="text-accent">{som(c.price)}</b></p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                  <span>Akkauntlar: <b>{s.n}</b></span>
                  <span>Jami qiymat: <b>{som(s.total)}</b></span>
                  <span>O&apos;rtacha yutuq (EV): <b>{som(Math.round(s.ev))}</b></span>
                  {s.n > 0 && (
                    <span className={edge >= 0 ? "text-win" : "text-lose"}>
                      Sayt foydasi: <b>{edge.toFixed(1)}%</b>{edge < 0 && " ⚠️ zarar!"}
                    </span>
                  )}
                </div>
              </div>
              <button className="btn-ghost !py-2" onClick={() => setF({
                id: c.id, name: c.name, game: c.game, price: String(c.price), image_url: c.image_url ?? "",
                color: c.color, sort: String(c.sort), active: c.active,
              })}>Tahrirlash</button>
            </div>
          );
        })}
      </div>

      <div className="panel p-5 space-y-3 h-fit lg:sticky lg:top-24">
        <p className="font-extrabold uppercase text-sm">{f.id ? "Keysni tahrirlash" : "Yangi keys"}</p>
        <div><label className="label">Nomi</label><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">O&apos;yin</label>
          <select className="input" value={f.game} onChange={e => setF({ ...f, game: e.target.value })}>
            {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select></div>
        <div><label className="label">Narxi (so&apos;m)</label><input className="input" inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></div>
        <div><label className="label">Rasm URL</label><input className="input" value={f.image_url} onChange={e => setF({ ...f, image_url: e.target.value })} placeholder="https://…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Rang</label><input type="color" className="input !p-1 h-11" value={f.color} onChange={e => setF({ ...f, color: e.target.value })} /></div>
          <div><label className="label">Tartib</label><input className="input" inputMode="numeric" value={f.sort} onChange={e => setF({ ...f, sort: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> Faol</label>
        <div className="flex gap-2">
          <button disabled={busy || !f.name || !num(f.price)} className="btn-accent flex-1" onClick={save}>Saqlash</button>
          {f.id && <button className="btn-ghost" onClick={() => setF(emptyCase)}>Bekor</button>}
        </div>
      </div>
    </div>
  );
}

const emptyAcc = { game: GAMES[0].id, title: "", description: "", rank: "", image_url: "", price: "", case_id: "", login: "", password: "", extra: "" };

function AddAccount({ cases, busy, onSave }: { cases: Case[]; busy: boolean; onSave: (args: Record<string, unknown>) => Promise<boolean> }) {
  const [f, setF] = useState(emptyAcc);
  const set = (k: keyof typeof emptyAcc) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const ok = f.title && num(f.price) && f.login && f.password;

  const save = async () => {
    const done = await onSave({
      p_game: f.game, p_title: f.title, p_description: f.description || null, p_rank: f.rank || null,
      p_image_url: f.image_url, p_price: num(f.price), p_case: f.case_id || null,
      p_login: f.login, p_password: f.password, p_extra: f.extra || null,
    });
    if (done) setF({ ...emptyAcc, game: f.game, case_id: f.case_id });
  };

  return (
    <div className="panel p-5 max-w-2xl space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label">O&apos;yin</label>
          <select className="input" value={f.game} onChange={set("game")}>{GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}</select></div>
        <div><label className="label">Joylashuv</label>
          <select className="input" value={f.case_id} onChange={set("case_id")}>
            <option value="">🛒 Bozorga (sotuvga)</option>
            {cases.map(c => <option key={c.id} value={c.id}>🎰 {c.name}</option>)}
          </select></div>
      </div>
      <div><label className="label">Sarlavha</label><input className="input" value={f.title} onChange={set("title")} placeholder="Masalan: 45 lvl, 12 ta skin" /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label">Rank</label><input className="input" value={f.rank} onChange={set("rank")} /></div>
        <div><label className="label">Narx / qiymat (so&apos;m)</label><input className="input" inputMode="numeric" value={f.price} onChange={set("price")} /></div>
      </div>
      <div><label className="label">Tavsif</label><textarea className="input min-h-[80px]" value={f.description} onChange={set("description")} /></div>
      <div><label className="label">Rasm URL</label><input className="input" value={f.image_url} onChange={set("image_url")} placeholder="https://…" /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label">Login</label><input className="input" value={f.login} onChange={set("login")} /></div>
        <div><label className="label">Parol</label><input className="input" value={f.password} onChange={set("password")} /></div>
      </div>
      <div><label className="label">Qo&apos;shimcha (pochta, kod…)</label><input className="input" value={f.extra} onChange={set("extra")} /></div>
      <button disabled={busy || !ok} className="btn-accent w-full" onClick={save}>Qo&apos;shish</button>
    </div>
  );
}

function UsersTab({ users, busy, onAdjust }: { users: ProfileRow[]; busy: boolean; onAdjust: (id: string, delta: number, note: string) => Promise<boolean> }) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ id: string; delta: string; note: string } | null>(null);
  const list = users.filter(u => !q || (u.username ?? "").toLowerCase().includes(q.toLowerCase()) || u.id.startsWith(q));

  return (
    <div className="space-y-3">
      <input className="input max-w-sm" placeholder="🔍 Ism yoki ID bo'yicha qidirish" value={q} onChange={e => setQ(e.target.value)} />
      {list.length === 0 && <Empty text="Foydalanuvchi topilmadi" />}
      {list.map(u => (
        <div key={u.id} className="panel p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-violet grid place-items-center font-black uppercase">{(u.username || "?")[0]}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{u.username || "—"} {u.is_admin && <span className="chip bg-accent/15 text-accent ml-1">admin</span>}</p>
              <p className="text-[11px] text-muted font-mono truncate">{u.id}</p>
            </div>
            <p className="font-extrabold text-accent">{som(u.balance)}</p>
            <button className="btn-ghost !py-2" onClick={() => setEdit(edit?.id === u.id ? null : { id: u.id, delta: "", note: "" })}>Balans ±</button>
          </div>
          {edit?.id === u.id && (
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <input className="input" placeholder="Summa (minus uchun -50000)" value={edit.delta}
                onChange={e => setEdit({ ...edit, delta: e.target.value.replace(/[^\d-]/g, "") })} />
              <input className="input" placeholder="Izoh" value={edit.note} onChange={e => setEdit({ ...edit, note: e.target.value })} />
              <button disabled={busy || !parseInt(edit.delta, 10)} className="btn-accent"
                onClick={async () => { if (await onAdjust(u.id, parseInt(edit.delta, 10), edit.note || "Admin")) setEdit(null); }}>Saqlash</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
