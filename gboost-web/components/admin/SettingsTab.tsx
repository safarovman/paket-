"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { useDepositSettings } from "@/lib/useDeposit";

/** To'lov kartasi va to'ldirishni to'xtatish — faqat sayt egasi o'zgartiradi */
export default function SettingsTab({ me }: { me: string }) {
  const { settings, reload } = useDepositSettings();
  const [owner, setOwner] = useState<boolean | null>(null);
  const [f, setF] = useState({ enabled: true, card: "", owner: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("is_owner").eq("id", me).maybeSingle().then(({ data }) => setOwner(!!data?.is_owner));
  }, [me]);
  useEffect(() => { if (settings) setF(settings); }, [settings]);

  const save = async (patch?: Partial<typeof f>) => {
    const v = { ...f, ...patch };
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc("owner_set_deposit", { p_enabled: v.enabled, p_card: v.card, p_owner: v.owner, p_message: v.message });
    setBusy(false);
    if (error) return setMsg({ ok: false, t: errText(error) });
    setMsg({ ok: true, t: v.enabled ? "✅ Saqlandi — to'ldirish yoqilgan" : "⏸️ To'ldirish to'xtatildi" });
    reload();
  };

  if (!settings || owner === null) return <div className="panel p-8 text-center text-muted">Yuklanmoqda…</div>;
  const cardFmt = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})(?=.)/g, "$1 ");

  return (
    <div className="max-w-xl space-y-4">
      <div className={clsx("panel p-5 flex items-center gap-4", settings.enabled ? "border-win/40" : "border-lose/50")}>
        <span className="text-3xl">{settings.enabled ? "🟢" : "⏸️"}</span>
        <div className="flex-1">
          <p className="font-black uppercase">{settings.enabled ? "To'ldirish ishlayapti" : "To'ldirish to'xtatilgan"}</p>
          <p className="text-xs text-muted">Joriy karta: <b className="text-white font-mono">{settings.card || "—"}</b> {settings.owner}</p>
        </div>
        {owner && (
          settings.enabled
            ? <button disabled={busy} onClick={() => save({ enabled: false })} className="btn !bg-lose text-white">⏸ To&apos;xtatish</button>
            : <button disabled={busy} onClick={() => save({ enabled: true })} className="btn-win">▶ Yoqish</button>
        )}
      </div>

      {!owner ? (
        <p className="panel p-5 text-sm text-muted">🔒 Kartani faqat sayt egasi o&apos;zgartira oladi (boshqa admin pulni o&apos;z kartasiga yo&apos;naltira olmasligi uchun).</p>
      ) : (
        <div className="panel p-5 space-y-3">
          <p className="font-black uppercase text-sm">💳 To&apos;lov kartasi</p>
          <div><label className="label">Karta raqami (16 raqam)</label>
            <input className="input font-mono text-lg" inputMode="numeric" value={cardFmt(f.card)} onChange={e => setF({ ...f, card: e.target.value })} placeholder="8600 1234 5678 9012" /></div>
          <div><label className="label">Karta egasi</label>
            <input className="input" value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })} placeholder="ISM FAMILIYA" /></div>
          <div><label className="label">To&apos;xtatilganda ko&apos;rinadigan xabar</label>
            <input className="input" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} placeholder="Texnik ishlar, 1 soatdan keyin qayta ishlaydi" /></div>
          <button disabled={busy} onClick={() => save()} className="btn-accent w-full">Saqlash</button>
          <p className="text-[11px] text-muted">
            Karta bloklansa: avval <b>⏸ To&apos;xtatish</b>ni bosing, keyin yangi kartani kiriting va yoqing.
            Eski kartaga kelgan so&apos;rovlar To&apos;ldirish bo&apos;limida karta oxirgi 4 raqami bilan ko&apos;rinadi.
          </p>
        </div>
      )}
      {msg && <p className={clsx("text-sm font-bold", msg.ok ? "text-win" : "text-lose")}>{msg.t}</p>}
    </div>
  );
}
