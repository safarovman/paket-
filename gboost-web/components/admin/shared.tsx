"use client";
import { useState } from "react";

export interface UserInfo { public_id: number | null; username: string | null; email: string | null; telegram: string | null; }
export interface ProfileRow extends UserInfo { id: string; balance: number; is_admin: boolean; }
export interface PoolRow { case_id: string; price: number; }
export interface AdminOpt { id: string; username: string | null; telegram: string | null; }
/** Hisoblash ustunlari (04_account_admins.sql) */
export interface AccExtra { public_no?: number | null; admin_id?: string | null; }
export type Rpc = (fn: string, args: Record<string, unknown>, ok: string) => Promise<boolean>;

export const num = (v: string) => { const n = parseInt(v.replace(/\D/g, ""), 10); return isNaN(n) ? null : n; };
export const dt = (iso: string) => new Date(iso).toLocaleString("uz-UZ");

export function Empty({ text }: { text: string }) {
  return <div className="panel p-10 text-center text-muted text-sm">{text}</div>;
}

export function CopyBtn({ text, label = "Nusxa" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="text-xs font-bold text-accent shrink-0"
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>
      {ok ? "✅" : label}
    </button>
  );
}

export function Tg({ u }: { u: string | null | undefined }) {
  if (!u) return <span className="text-muted">— yo&apos;q</span>;
  return <a href={`https://t.me/${u}`} target="_blank" rel="noopener noreferrer" className="text-violet-light font-bold hover:underline">@{u}</a>;
}

/** Kichik foydalanuvchi qatori: ID • ism • telegram */
export function UserLine({ u }: { u?: UserInfo | null }) {
  if (!u) return <span className="text-muted text-sm">noma&apos;lum foydalanuvchi</span>;
  return (
    <span className="text-sm">
      <b className="text-accent font-mono">ID {u.public_id ?? "—"}</b> • {u.username || "—"} • <Tg u={u.telegram} />
    </span>
  );
}

/** Katta foydalanuvchi bloki + ID tekshirish ogohlantirishi */
export function UserBlock({ u, title }: { u: UserInfo; title: string }) {
  return (
    <div className="rounded-xl bg-bg border border-line p-4">
      <p className="label">{title}</p>
      <p className="text-3xl font-black font-mono text-accent">ID {u.public_id ?? "—"}</p>
      <div className="grid sm:grid-cols-3 gap-2 mt-2 text-sm">
        <p><span className="text-muted">Ism:</span> <b>{u.username || "—"}</b></p>
        <p className="break-all"><span className="text-muted">Email:</span> {u.email || "—"}</p>
        <p><span className="text-muted">Telegram:</span> <Tg u={u.telegram} /></p>
      </div>
      <div className="mt-3 rounded-lg border border-lose/50 bg-lose/10 p-3 text-xs font-bold text-lose">
        ⚠️ Telegramda yozgan odamning ID raqami va @username shu yerdagiga mos kelishini tekshiring.
        Mos kelmasa — login/parolni BERMANG.
      </div>
    </div>
  );
}

/** Akkaunt raqami: #1024 */
export function AccNo({ n, big }: { n?: number | null; big?: boolean }) {
  return <span className={`font-mono font-black text-accent ${big ? "text-2xl" : "text-sm"}`}>#{n ?? "—"}</span>;
}

/** Mas'ul admin: ism • @telegram */
export function AdminLine({ a, me }: { a?: { id?: string; username: string | null; telegram: string | null } | null; me?: string }) {
  if (!a) return <span className="text-xs text-muted">Mas&apos;ul admin: — biriktirilmagan</span>;
  return (
    <span className="text-xs">
      Mas&apos;ul admin: <b>{a.username || "—"}</b> • <Tg u={a.telegram} />
      {me && a.id === me && <span className="chip bg-win/15 text-win ml-1">siz</span>}
    </span>
  );
}
