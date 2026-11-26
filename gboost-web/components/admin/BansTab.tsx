"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, errText } from "@/lib/supabase";
import { Empty, Tg, dt } from "./shared";
import BanDialog, { type SecUser } from "./BanDialog";

interface BannedIp { ip: string; reason: string | null; created_at: string; }

export default function BansTab({ after }: { after: (ok: boolean, text: string) => Promise<void> }) {
  const [users, setUsers] = useState<SecUser[] | null>(null);
  const [ips, setIps] = useState<BannedIp[]>([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [ban, setBan] = useState<SecUser | null>(null);
  const [unban, setUnban] = useState<{ u: SecUser; ip: boolean } | null>(null);
  const [ipForm, setIpForm] = useState({ ip: "", reason: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    const [u, b] = await Promise.all([
      supabase.rpc("admin_users_security"),
      supabase.from("banned_ips").select("ip,reason,created_at").order("created_at", { ascending: false }),
    ]);
    if (u.error) { setErr(errText(u.error)); setUsers([]); } else setUsers((u.data as SecUser[]) || []);
    setIps((b.data as BannedIp[]) || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const done = async (ok: boolean, text: string) => { await after(ok, text); await load(); };

  const call = async (fn: string, args: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) { await after(false, errText(error)); return false; }
    await done(true, ok); return true;
  };

  if (users === null) return <div className="panel p-8 text-center text-muted">Yuklanmoqda…</div>;

  const banned = users.filter(u => u.is_banned);
  const s = q.trim().toLowerCase().replace(/^@/, "");
  const list = users.filter(u => !s || String(u.public_id).includes(s) || (u.username ?? "").toLowerCase().includes(s) ||
    (u.email ?? "").toLowerCase().includes(s) || (u.ip ?? "").includes(s) || (u.telegram ?? "").toLowerCase().includes(s));

  return (
    <div className="space-y-8">
      {err && <div className="panel p-4 text-sm text-lose font-bold">{err}<p className="text-muted font-normal">supabase/14_bans.sql ishga tushirilganini tekshiring.</p></div>}

      <section className="space-y-3">
        <p className="font-black uppercase text-sm">🚫 Bloklangan foydalanuvchilar ({banned.length})</p>
        {banned.length === 0 && <Empty text="Bloklangan foydalanuvchi yo'q" />}
        {banned.map(u => (
          <div key={u.public_id} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-lose/40">
            <div className="flex-1 min-w-0">
              <p className="font-bold"><span className="font-mono text-accent">ID {u.public_id}</span> · {u.username || "—"} <Tg u={u.telegram} /></p>
              <p className="text-xs text-muted">{u.email || "—"} · IP: <span className="font-mono">{u.ip || "—"}</span>{u.ip_banned && <span className="chip bg-lose/20 text-lose ml-1">IP bloklangan</span>}</p>
              <p className="text-xs mt-1">Sabab: <b>{u.ban_reason || "—"}</b>{u.banned_at && <span className="text-muted"> · {dt(u.banned_at)}</span>}</p>
            </div>
            <button disabled={busy} className="btn-win !py-2" onClick={() => setUnban({ u, ip: u.ip_banned })}>Bandan chiqarish</button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <p className="font-black uppercase text-sm">🌐 Bloklangan IP manzillar ({ips.length})</p>
        <p className="text-xs text-accent">Diqqat: mobil internetda bitta IP ni ko&apos;p odam ishlatishi mumkin — IP bani begunoh odamlarni ham to&apos;sishi mumkin. Avval akkaunt banidan foydalaning.</p>
        <div className="panel p-4 flex flex-col sm:flex-row gap-2">
          <input className="input font-mono sm:max-w-[220px]" placeholder="IP manzil (masalan 84.54.73.86)" value={ipForm.ip} onChange={e => setIpForm({ ...ipForm, ip: e.target.value })} />
          <input className="input" placeholder="Sabab" value={ipForm.reason} onChange={e => setIpForm({ ...ipForm, reason: e.target.value })} />
          <button disabled={busy || !ipForm.ip.trim()} className="btn bg-lose text-white hover:brightness-110"
            onClick={async () => { if (await call("admin_ban_ip", { p_ip: ipForm.ip.trim(), p_reason: ipForm.reason }, `IP ${ipForm.ip.trim()} bloklandi`)) setIpForm({ ip: "", reason: "" }); }}>
            IP ni bloklash
          </button>
        </div>
        {ips.length === 0 && <Empty text="Bloklangan IP yo'q" />}
        {ips.map(b => (
          <div key={b.ip} className="panel p-3 flex items-center gap-3">
            <span className="font-mono font-bold">{b.ip}</span>
            <span className="text-xs text-muted flex-1 truncate">{b.reason || "—"} · {dt(b.created_at)}</span>
            <button disabled={busy} className="btn-ghost !py-1.5" onClick={() => confirm(`IP ${b.ip} ochilsinmi?`) && call("admin_unban_ip", { p_ip: b.ip }, `IP ${b.ip} ochildi`)}>Ochish</button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <p className="font-black uppercase text-sm">👥 Barcha foydalanuvchilar va IP manzillari</p>
        <input className="input max-w-sm" placeholder="🔍 ID, ism, email, @telegram yoki IP" value={q} onChange={e => setQ(e.target.value)} />
        {list.length === 0 && <Empty text="Topilmadi" />}
        <div className="panel divide-y divide-line">
          {list.slice(0, 300).map(u => (
            <div key={u.public_id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <span className="font-mono font-black text-accent w-24">ID {u.public_id}</span>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-bold truncate">{u.username || "—"} {u.is_banned && <span className="chip bg-lose text-white ml-1">BLOKLANGAN</span>}</p>
                <p className="text-xs text-muted truncate">{u.email || "—"} · <Tg u={u.telegram} /></p>
              </div>
              <span className="font-mono text-xs">{u.ip || "—"}{u.ip_banned && <span className="text-lose font-bold"> (bloklangan)</span>}</span>
              {u.is_banned
                ? <button disabled={busy} className="btn-win !py-1.5" onClick={() => setUnban({ u, ip: u.ip_banned })}>Bandan chiqarish</button>
                : <button disabled={busy} className="btn !py-1.5 bg-lose/15 text-lose hover:bg-lose/25" onClick={() => setBan(u)}>🚫 Ban</button>}
            </div>
          ))}
        </div>
      </section>

      {ban && <BanDialog user={ban} onClose={() => setBan(null)} after={done} />}

      {unban && (
        <div className="fixed inset-0 z-[80] bg-black/75 grid place-items-center p-4" onClick={() => setUnban(null)}>
          <div className="panel w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <p className="font-black">ID {unban.u.public_id} bandan chiqarilsinmi?</p>
            <p className="text-sm text-muted mt-1">{unban.u.username || "—"} yana saytga kira oladi.</p>
            {unban.u.ip && (
              <label className="flex items-center gap-2 text-sm mt-3">
                <input type="checkbox" checked={unban.ip} onChange={e => setUnban({ ...unban, ip: e.target.checked })} />
                IP ni ham ochish ({unban.u.ip})
              </label>
            )}
            <div className="flex gap-2 mt-5">
              <button className="btn-ghost flex-1" onClick={() => setUnban(null)}>Bekor</button>
              <button disabled={busy} className="btn-win flex-1" onClick={async () => {
                const u = unban.u, ip = unban.ip; setUnban(null);
                await call("admin_unban_user", { p_public_id: u.public_id, p_unban_ip: ip }, `ID ${u.public_id} bandan chiqarildi`);
              }}>Chiqarish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
