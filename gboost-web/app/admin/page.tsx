"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { som, type Account, type Case } from "@/lib/uzdrop";
import { Empty, UserLine, dt, type PoolRow, type ProfileRow, type UserInfo } from "@/components/admin/shared";
import CodeTab, { type WaitingRow } from "@/components/admin/CodeTab";
import AddAccountTab from "@/components/admin/AddAccountTab";
import ListedTab from "@/components/admin/ListedTab";
import CasesTab from "@/components/admin/CasesTab";
import UsersTab from "@/components/admin/UsersTab";

type Tab = "code" | "deposits" | "withdrawals" | "add" | "listed" | "cases" | "users";
const TABS: { id: Tab; label: string }[] = [
  { id: "code",        label: "🔑 Kod" },
  { id: "deposits",    label: "💳 To'ldirish" },
  { id: "withdrawals", label: "Yechish" },
  { id: "add",         label: "➕ Akkaunt joylash" },
  { id: "listed",      label: "📦 Saytdagi" },
  { id: "cases",       label: "Keyslar" },
  { id: "users",       label: "Foydalanuvchilar" },
];

interface Deposit { id: string; code: string | null; user_id: string; amount: number; method: string; note: string | null; created_at: string; }
interface Withdrawal { id: string; user_id: string; amount: number; card: string; created_at: string; }

export default function AdminPage() {
  const { profile, loading } = useUser();
  const [tab, setTab] = useState<Tab>("code");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [waiting, setWaiting]         = useState<WaitingRow[]>([]);
  const [deposits, setDeposits]       = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [cases, setCases]             = useState<Case[]>([]);
  const [pool, setPool]               = useState<PoolRow[]>([]);
  const [listed, setListed]           = useState<Account[]>([]);
  const [users, setUsers]             = useState<ProfileRow[]>([]);

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 4000); };

  const load = useCallback(async () => {
    const [dl, dep, wd, cs, ls, us] = await Promise.all([
      supabase.from("deliveries").select("code,user_id,source,price,created_at,accounts(title,game)").eq("status", "waiting").order("created_at"),
      supabase.from("deposits").select("*").eq("status", "pending").order("created_at"),
      supabase.from("withdrawals").select("*").eq("status", "pending").order("created_at"),
      supabase.from("cases").select("*").order("sort"),
      supabase.from("accounts").select("*").in("status", ["active", "pool"]).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,public_id,username,email,telegram,balance,is_admin").order("created_at", { ascending: false }).limit(1000),
    ]);
    setWaiting((dl.data ?? []) as unknown as WaitingRow[]);
    setDeposits((dep.data ?? []) as Deposit[]);
    setWithdrawals((wd.data ?? []) as Withdrawal[]);
    setCases((cs.data ?? []) as Case[]);
    const acc = (ls.data ?? []) as Account[];
    setListed(acc);
    setPool(acc.filter(a => a.status === "pool" && a.case_id).map(a => ({ case_id: a.case_id as string, price: a.price })));
    setUsers((us.data ?? []) as ProfileRow[]);
  }, []);

  useEffect(() => { if (profile?.is_admin) load(); }, [profile?.is_admin, load]);

  const byId = useMemo(() => Object.fromEntries(users.map(u => [u.id, u as UserInfo])) as Record<string, UserInfo>, [users]);

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
        <p className="text-muted text-sm">Bu sahifa faqat adminlar uchun.</p>
      </div>
    </div>
  );

  const counts: Partial<Record<Tab, number>> = { code: waiting.length, deposits: deposits.length, withdrawals: withdrawals.length };

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

      {tab === "code" && <CodeTab waiting={waiting} users={byId} busy={busy} rpc={rpc} />}

      {tab === "deposits" && (
        <div className="space-y-3">
          {deposits.length === 0 && <Empty text="To'ldirish so'rovlari yo'q" />}
          {deposits.map(d => (
            <div key={d.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-extrabold text-accent text-lg">{som(d.amount)}</p>
                  {d.code && <span className="font-mono font-black text-sm select-all">{d.code}</span>}
                  <span className="chip bg-panel2 text-muted uppercase">{d.method}</span>
                </div>
                <UserLine u={byId[d.user_id]} />
                {d.note && <p className="text-xs text-muted break-words">📝 {d.note}</p>}
                <p className="text-[11px] text-muted">{dt(d.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={busy} className="btn-win" onClick={() => rpc("admin_deposit", { p_id: d.id, p_approve: true }, "Balans to'ldirildi")}>Tasdiqlash</button>
                <button disabled={busy} className="btn-ghost" onClick={() => confirm("Rad etilsinmi?") && rpc("admin_deposit", { p_id: d.id, p_approve: false }, "Rad etildi")}>Rad</button>
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
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-extrabold text-accent text-lg">{som(w.amount)}</p>
                <UserLine u={byId[w.user_id]} />
                <p className="text-sm font-mono text-white select-all">💳 {w.card}</p>
                <p className="text-[11px] text-muted">{dt(w.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={busy} className="btn-win" onClick={() => rpc("admin_withdraw", { p_id: w.id, p_paid: true }, "To'landi deb belgilandi")}>To&apos;landi</button>
                <button disabled={busy} className="btn-ghost" onClick={() => confirm("Rad etilsinmi? Pul foydalanuvchiga qaytadi.") && rpc("admin_withdraw", { p_id: w.id, p_paid: false }, "Rad etildi, pul qaytarildi")}>Rad</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "add" && <AddAccountTab cases={cases} busy={busy} rpc={rpc} />}
      {tab === "listed" && <ListedTab accounts={listed} cases={cases} users={byId} busy={busy} rpc={rpc} />}
      {tab === "cases" && <CasesTab cases={cases} pool={pool} busy={busy} onSave={args => rpc("admin_save_case", args, "Keys saqlandi")} />}
      {tab === "users" && <UsersTab users={users} busy={busy} rpc={rpc} />}
    </div>
  );
}
