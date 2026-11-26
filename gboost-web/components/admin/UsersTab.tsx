"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { som } from "@/lib/uzdrop";
import { Empty, Tg, type ProfileRow, type Rpc } from "./shared";
import DepositForm from "./DepositForm";

export default function UsersTab({ users, me, busy, rpc, after }: { users: ProfileRow[]; me: string; busy: boolean; rpc: Rpc; after: (ok: boolean, text: string) => Promise<void> }) {
  const [dep, setDep] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    supabase.from("profiles").select("is_owner").eq("id", me).single()
      .then(({ data }) => setOwner(!!(data as { is_owner?: boolean } | null)?.is_owner));
  }, [me]);
  const [edit, setEdit] = useState<{ id: string; delta: string; note: string } | null>(null);
  const s = q.trim().toLowerCase().replace(/^@/, "");
  const list = users.filter(u => !s ||
    String(u.public_id ?? "").includes(s) || (u.username ?? "").toLowerCase().includes(s) ||
    (u.email ?? "").toLowerCase().includes(s) || (u.telegram ?? "").toLowerCase().includes(s));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Pul qo&apos;shishning asosiy yo&apos;li — <b className="text-win">💰 Depozit qo&apos;shish</b> (statistikada hisoblanadi). <b>Tuzatish (±)</b> faqat xatolarni to&apos;g&apos;rilash uchun.</p>
      <input className="input max-w-sm" placeholder="🔍 ID raqami, ism, email yoki @telegram" value={q} onChange={e => setQ(e.target.value)} />
      {list.length === 0 && <Empty text="Foydalanuvchi topilmadi" />}
      {list.slice(0, 200).map(u => (
        <div key={u.id} className="panel p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono font-black text-accent text-lg w-24">ID {u.public_id ?? "—"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{u.username || "—"} {u.is_admin && <span className="chip bg-accent/15 text-accent ml-1">admin</span>}</p>
              <p className="text-xs text-muted truncate">{u.email || "—"} • <Tg u={u.telegram} /></p>
            </div>
            <p className="font-extrabold text-accent">{som(u.balance)}</p>
            <button className="btn-win !py-2" onClick={() => { setDep(dep === u.id ? null : u.id); setEdit(null); }}>💰 Depozit qo&apos;shish</button>
            <button className="btn-ghost !py-2" title="Xatoni tuzatish uchun (statistikaga kirmaydi)" onClick={() => { setEdit(edit?.id === u.id ? null : { id: u.id, delta: "", note: "" }); setDep(null); }}>Tuzatish (±)</button>
            {owner && u.id !== me && (
              <button disabled={busy} className={u.is_admin ? "btn-ghost !py-2 !text-lose" : "btn-violet !py-2"}
                onClick={() => {
                  const make = !u.is_admin;
                  if (confirm(make ? `${u.username || "Foydalanuvchi"} admin qilinsinmi? U login/parollarni ko'ra oladi.` : "Adminlikdan olinsinmi?"))
                    rpc("owner_set_admin", { p_user: u.id, p_admin: make }, make ? "Admin qilindi" : "Adminlikdan olindi");
                }}>
                {u.is_admin ? "Adminlikdan olish" : "Admin qilish"}
              </button>
            )}
          </div>
          {dep === u.id && (
            <div className="mt-3"><DepositForm users={users} initialId={u.public_id} after={after} onClose={() => setDep(null)} /></div>
          )}
          {edit?.id === u.id && (
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <input className="input" placeholder="Tuzatish: +50000 yoki -50000" value={edit.delta}
                onChange={e => setEdit({ ...edit, delta: e.target.value.replace(/[^\d-]/g, "") })} />
              <input className="input" placeholder="Izoh" value={edit.note} onChange={e => setEdit({ ...edit, note: e.target.value })} />
              <button disabled={busy || !parseInt(edit.delta, 10)} className="btn-accent"
                onClick={async () => {
                  if (await rpc("admin_set_balance", { p_user: u.id, p_delta: parseInt(edit.delta, 10), p_note: edit.note || "Admin" }, "Balans tuzatildi")) setEdit(null);
                }}>Saqlash</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
