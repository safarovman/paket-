"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { som, type Account, type Case } from "@/lib/uzdrop";
import { Empty, UserLine, dt, type AdminOpt, type PoolRow, type ProfileRow, type UserInfo } from "@/components/admin/shared";
import CodeTab, { type WaitingRow } from "@/components/admin/CodeTab";
import AddAccountTab from "@/components/admin/AddAccountTab";
import ListedTab from "@/components/admin/ListedTab";
import CasesTab from "@/components/admin/CasesTab";
import UsersTab from "@/components/admin/UsersTab";
import SettingsTab from "@/components/admin/SettingsTab";
import StatsTab from "@/components/admin/StatsTab";
import DepositForm from "@/components/admin/DepositForm";
import ActivityTab from "@/components/admin/ActivityTab";
import UserHistory from "@/components/admin/UserHistory";
import BansTab from "@/components/admin/BansTab";
import Link from "next/link";

type Tab = "code" | "activity" | "stats" | "deposits" | "withdrawals" | "add" | "listed" | "cases" | "users" | "bans" | "settings";
const TABS: { id: Tab; label: string }[] = [
  { id: "code",        label: "🔑 Kod" },
  { id: "activity",    label: "🔔 Faollik" },
  { id: "stats",       label: "📊 Statistika" },
  { id: "deposits",    label: "💳 To'ldirish" },
  { id: "add",         label: "➕ Akkaunt joylash" },
  { id: "listed",      label: "📦 Saytdagi" },
  { id: "cases",       label: "Keyslar" },
  { id: "users",       label: "Foydalanuvchilar" },
  { id: "bans",        label: "🚫 Banlar" },
  { id: "settings",    label: "⚙️ Sozlamalar" },
];

interface Deposit { id: string; code: string | null; card_last4?: string | null; user_id: string; amount: number; method: string; note: string | null; created_at: string; }
interface Withdrawal { id: string; user_id: string; amount: number; card: string; created_at: string; }

export default function AdminPage() {
  const { user, profile, loading } = useUser();
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
  const [admins, setAdmins]           = useState<AdminOpt[]>([]);
  const [liveTick, setLiveTick]       = useState(0);
  const [unseen, setUnseen]           = useState(0);
  const [history, setHistory]         = useState<number | null>(null);

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 4000); };

  const load = useCallback(async () => {
    const [dl, dep, wd, cs, ls, us, ad] = await Promise.all([
      supabase.from("deliveries").select("code,user_id,source,price,created_at,accounts(title,game,public_no,admin_id)").eq("status", "waiting").order("created_at"),
      supabase.from("deposits").select("*").eq("status", "pending").order("created_at"),
      supabase.from("withdrawals").select("*").eq("status", "pending").order("created_at"),
      supabase.from("cases").select("*").order("sort"),
      supabase.from("accounts").select("*").in("status", ["active", "pool"]).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,public_id,username,email,telegram,balance,is_admin").order("created_at", { ascending: false }).limit(1000),
      supabase.rpc("admin_contacts"),
    ]);
    setWaiting((dl.data ?? []) as unknown as WaitingRow[]);
    setDeposits((dep.data ?? []) as Deposit[]);
    setWithdrawals((wd.data ?? []) as Withdrawal[]);
    setCases((cs.data ?? []) as Case[]);
    const acc = (ls.data ?? []) as Account[];
    setListed(acc);
    setPool(acc.filter(a => a.status === "pool" && a.case_id).map(a => ({ case_id: a.case_id as string, price: a.price })));
    setUsers((us.data ?? []) as ProfileRow[]);
    setAdmins((ad.data ?? []) as AdminOpt[]);
  }, []);

  useEffect(() => { if (profile?.is_admin) load(); }, [profile?.is_admin, load]);

  // Jonli: har yangi tranzaksiyada Faollik lentasi yangilanadi, boshqa tabda bo'lsa hisoblagich oshadi
  const tabRef = useRef<Tab>("code");
  useEffect(() => { tabRef.current = tab; if (tab === "activity") setUnseen(0); }, [tab]);
  useEffect(() => {
    if (!profile?.is_admin) return;
    const ch = supabase.channel("admin-tx")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, () => {
        setLiveTick(t => t + 1);
        if (tabRef.current !== "activity") setUnseen(n => n + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.is_admin]);

  // Adminlar ro'yxati (telegram'i borlar) + o'zim har doim
  const adminOpts = useMemo<AdminOpt[]>(() => {
    if (!profile) return admins;
    return admins.some(a => a.id === profile.id) ? admins
      : [{ id: profile.id, username: profile.username, telegram: profile.telegram ?? null }, ...admins];
  }, [admins, profile]);
  // Akkauntdagi admin_id → ism/@telegram (admins ro'yxati, bo'lmasa foydalanuvchilar)
  const adminById = useMemo(() => {
    const m: Record<string, AdminOpt> = {};
    users.filter(u => u.is_admin).forEach(u => { m[u.id] = { id: u.id, username: u.username, telegram: u.telegram }; });
    adminOpts.forEach(a => { m[a.id] = a; });
    return m;
  }, [users, adminOpts]);

  const after = async (ok: boolean, text: string) => { flash(ok, text); await load(); };

  const byId = useMemo(() => Object.fromEntries(users.map(u => [u.id, u as UserInfo])) as Record<string, UserInfo>, [users]);

  const rpc = async (fn: string, args: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) { flash(false, errText(error)); return false; }
    flash(true, ok); await load(); return true;
  };

  if (loading) return <div className="wrap py-20 text-center text-muted">Yuklanmoqda…</div>;
  if (!user) return (
    <div className="wrap py-20">
      <div className="panel p-8 max-w-md mx-auto text-center">
        <p className="text-4xl mb-3">🔐</p>
        <h1 className="h-title mb-2">Admin paneli</h1>
        <p className="text-muted text-sm mb-6">Davom etish uchun admin akkauntingiz bilan kiring.</p>
        <Link href="/login/" className="btn-accent w-full">Kirish</Link>
      </div>
    </div>
  );
  if (!profile?.is_admin) return (
    <div className="wrap py-20">
      <div className="panel p-8 max-w-lg mx-auto text-center">
        <p className="text-4xl mb-3">⛔</p>
        <h1 className="h-title mb-2">Ruxsat yo&apos;q</h1>
        <p className="text-muted text-sm">Bu sahifa faqat adminlar uchun.</p>
      </div>
    </div>
  );

  const counts: Partial<Record<Tab, number>> = { activity: unseen, code: waiting.length, deposits: deposits.length, withdrawals: withdrawals.length };

  return (
    <div className="wrap py-8">

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

      {tab === "code" && <CodeTab waiting={waiting} users={byId} admins={adminById} me={profile.id} busy={busy} rpc={rpc} />}

      {tab === "activity" && <ActivityTab tick={liveTick} onOpenUser={setHistory} />}

      {tab === "stats" && <StatsTab />}

      {tab === "deposits" && (
        <div className="space-y-3">
          <DepositForm users={users} after={after} />
          <p className="label !mt-6">Saytdan kelgan so&apos;rovlar</p>
          {deposits.length === 0 && <Empty text="To'ldirish so'rovlari yo'q" />}
          {deposits.map(d => (
            <div key={d.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-extrabold text-accent text-lg">{som(d.amount)}</p>
                  {d.code && <span className="font-mono font-black text-sm select-all">{d.code}</span>}
                  <span className="chip bg-panel2 text-muted uppercase">{d.method}</span>
                  {d.card_last4 && <span className="chip bg-violet/20 text-violet-light">karta •••• {d.card_last4}</span>}
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

      {tab === "add" && <AddAccountTab cases={cases} admins={adminOpts} me={profile.id} myTelegram={profile.telegram ?? null} busy={busy} rpc={rpc} after={after} />}
      {tab === "listed" && <ListedTab accounts={listed} cases={cases} users={byId} admins={adminOpts} adminById={adminById} me={profile.id} busy={busy} rpc={rpc} />}
      {tab === "cases" && <CasesTab cases={cases} pool={pool} busy={busy} onSave={args => rpc("admin_save_case", args, "Keys saqlandi")} />}
      {tab === "users" && <UsersTab users={users} me={profile.id} busy={busy} rpc={rpc} after={after} onHistory={setHistory} />}
      {tab === "bans" && <BansTab after={after} />}
      {tab === "settings" && <SettingsTab me={profile.id} />}

      {history !== null && <UserHistory publicId={history} users={users} after={after} onClose={() => setHistory(null)} />}
    </div>
  );
}
