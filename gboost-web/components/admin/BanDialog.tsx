"use client";
import { useState } from "react";
import { supabase, errText } from "@/lib/supabase";

export interface SecUser {
  public_id: number; username: string | null; email: string | null; telegram: string | null;
  is_banned: boolean; ban_reason: string | null; banned_at: string | null; ip: string | null; ip_banned: boolean;
}

/** Foydalanuvchini bloklash oynasi */
export default function BanDialog({ user, onClose, after }: {
  user: { public_id: number; username?: string | null; ip?: string | null };
  onClose: () => void;
  after: (ok: boolean, text: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");
  const [banIp, setBanIp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("admin_ban_user", { p_public_id: user.public_id, p_reason: reason, p_ban_ip: banIp });
    setBusy(false);
    if (error) return setErr(errText(error));
    const r = data as { ip?: string | null; ip_banned?: boolean } | null;
    await after(true, `ID ${user.public_id} bloklandi${r?.ip_banned ? ` · IP ${r.ip} ham bloklandi` : ""}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="panel w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <p className="text-lg font-black">🚫 Foydalanuvchini bloklash</p>
        <div className="mt-3 rounded-xl bg-bg border border-line p-3 text-sm">
          <p><span className="text-muted">ID:</span> <b className="font-mono text-accent">{user.public_id}</b></p>
          <p><span className="text-muted">Ism:</span> <b>{user.username || "—"}</b></p>
          <p><span className="text-muted">IP:</span> <b className="font-mono">{user.ip || "noma'lum"}</b></p>
        </div>
        <p className="text-xs text-muted mt-3">Foydalanuvchi saytdan chiqarib yuboriladi va qayta kira olmaydi. Xarid va to&apos;ldirish bloklanadi.</p>
        <label className="label mt-3">Sabab</label>
        <textarea className="input min-h-[70px]" value={reason} onChange={e => setReason(e.target.value)} placeholder="Masalan: firibgarlik, soxta chek" />
        <label className="flex items-start gap-2 text-sm mt-3 cursor-pointer">
          <input type="checkbox" className="mt-1" checked={banIp} onChange={e => setBanIp(e.target.checked)} disabled={!user.ip} />
          <span>IP manzilini ham bloklash (shu tarmoqdan xarid qilolmaydi){!user.ip && <span className="text-muted"> — IP noma&apos;lum</span>}</span>
        </label>
        {banIp && <p className="text-[11px] text-accent mt-1">Diqqat: mobil internetda bitta IP ni ko&apos;p odam ishlatishi mumkin.</p>}
        {err && <p className="text-lose text-sm font-bold mt-3">{err}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">Bekor</button>
          <button disabled={busy} onClick={submit} className="btn flex-1 bg-lose text-white hover:brightness-110">{busy ? "…" : "Bloklash"}</button>
        </div>
      </div>
    </div>
  );
}
