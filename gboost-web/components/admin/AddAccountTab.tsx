"use client";
import { useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { GAMES, rarity, som, type Case } from "@/lib/uzdrop";
import ImageUploader from "@/components/ImageUploader";
import FramePicker from "./FramePicker";
import BindingsEditor from "./BindingsEditor";
import { AccNo, Tg, num, type AdminOpt, type Rpc, type UserInfo } from "./shared";

type Mode = "market" | "quick" | "site";
const MODES: { id: Mode; t: string; d: string }[] = [
  { id: "market", t: "🛒 Sotuvchi nomidan (bozorga)", d: "Akkaunt bozorda sotiladi. Xaridorga topshirilgach sotuvchiga narxning 90% tushadi." },
  { id: "quick",  t: "⚡ Tez sotish (sayt sotib oladi)", d: "Sotuvchiga kelishilgan summa HOZIROQ balansiga tushadi. Akkaunt saytniki bo'ladi." },
  { id: "site",   t: "🏠 Saytning o'z akkaunti", d: "Sotuvchi yo'q. Bozorga yoki keysga qo'yiladi." },
];
const empty = { game: GAMES[0].id, title: "", description: "", rank: "", level: "", price: "", payout: "", case_id: "", login: "", password: "", extra: "", sellerId: "" };
type Seller = UserInfo & { id: string };

export default function AddAccountTab({ cases, admins, me, myTelegram, busy, after }: {
  cases: Case[]; admins: AdminOpt[]; me: string; myTelegram: string | null; busy: boolean; rpc: Rpc;
  after: (ok: boolean, text: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("market");
  const [adminId, setAdminId] = useState(me);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ no: number | null; title: string; admin: AdminOpt | undefined } | null>(null);
  const [f, setF] = useState(empty);
  const [images, setImages] = useState<string[]>([]);
  const [frame, setFrame] = useState("none");
  const [bindings, setBindings] = useState<Record<string, number>>({});
  const [origin, setOrigin] = useState("");
  const [seller, setSeller] = useState<Seller | null | "none">(null);
  const [looking, setLooking] = useState(false);
  const [lookErr, setLookErr] = useState("");
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const price = num(f.price), payout = num(f.payout);
  const needSeller = mode !== "site";
  const sellerOk = !needSeller || (seller && seller !== "none");
  const ok = f.title.trim() && price && price >= 1000 && f.login.trim() && f.password && sellerOk && (mode !== "quick" || payout);

  const lookup = async () => {
    const id = num(f.sellerId);
    setLookErr(""); setSeller(null);
    if (!id) return;
    setLooking(true);
    const { data, error } = await supabase.rpc("admin_find_user", { p_public_id: id });
    setLooking(false);
    if (error) { setLookErr(errText(error)); return; }
    setSeller(data ? (data as Seller) : "none");
  };

  const save = async () => {
    const s = seller && seller !== "none" ? seller.id : null;
    setSaving(true); setCreated(null);
    const { data: newId, error } = await supabase.rpc("admin_create_account", {
      p_mode: mode, p_seller: needSeller ? s : null, p_payout: mode === "quick" ? payout : null,
      p_game: f.game, p_title: f.title.trim(), p_description: f.description.trim() || null, p_rank: f.rank.trim() || null,
      p_level: num(f.level), p_images: images, p_price: price,
      p_case: mode === "market" ? null : (f.case_id || null),
      p_login: f.login.trim(), p_password: f.password, p_extra: f.extra.trim() || null,
    });
    if (error) { setSaving(false); await after(false, errText(error)); return; }
    const id = newId as string;
    let assignErr = "";
    if (origin || Object.values(bindings).some(n => n > 0)) {
      const br = await supabase.rpc("admin_set_bindings", { p_account: id, p_bindings: bindings, p_origin: origin || null });
      if (br.error) assignErr += " (privyazkalar saqlanmadi: " + errText(br.error) + ")";
    }
    if (frame) {
      const fr = await supabase.rpc("admin_set_frame", { p_account: id, p_frame: frame });
      if (fr.error) assignErr += " (ramka saqlanmadi: " + errText(fr.error) + ")";
    }
    if (adminId && adminId !== me) {
      const r = await supabase.rpc("admin_assign_account", { p_account: id, p_admin: adminId });
      if (r.error) assignErr = " (admin biriktirilmadi: " + errText(r.error) + ")";
    }
    const { data: row } = await supabase.from("accounts").select("public_no").eq("id", id).maybeSingle();
    setCreated({ no: (row as { public_no: number | null } | null)?.public_no ?? null, title: f.title.trim(), admin: admins.find(a => a.id === adminId) });
    setSaving(false);
    setF({ ...empty, game: f.game }); setImages([]); setSeller(null); setFrame("none"); setBindings({}); setOrigin("");
    await after(!assignErr, (mode === "quick" ? "Akkaunt joylandi, sotuvchiga pul tushdi" : "Akkaunt saytga joylandi") + assignErr);
  };

  return (
    <div className="panel p-4 sm:p-5 max-w-3xl space-y-5">
      {!myTelegram && (
        <div className="rounded-xl border border-accent/60 bg-accent/10 p-3 text-sm font-bold text-accent">
          ⚠️ Profilingizda Telegram username yo&apos;q — xaridorlar sizga yozolmaydi. Profil sahifasida qo&apos;shing.
        </div>
      )}
      {created && (
        <div className="rounded-xl border border-win/60 bg-win/10 p-4 animate-fade-in">
          <p className="text-sm font-bold text-win">✅ Saytga joylandi</p>
          <p className="mt-1"><AccNo n={created.no} big /> <b className="ml-2">{created.title}</b></p>
          <p className="text-xs mt-1">Mas&apos;ul admin: <b>{created.admin?.username || "—"}</b> • <Tg u={created.admin?.telegram} /></p>
        </div>
      )}
      <div className="grid gap-2">
        {MODES.map(m => (
          <label key={m.id} className={clsx("flex gap-3 items-start rounded-xl border p-3 cursor-pointer transition-colors",
            mode === m.id ? "border-accent bg-accent/5" : "border-line hover:border-violet")}>
            <input type="radio" name="mode" className="mt-1 accent-[#FFC83D]" checked={mode === m.id}
              onChange={() => { setMode(m.id); if (m.id === "market") setF(x => ({ ...x, case_id: "" })); }} />
            <span><b className="text-sm">{m.t}</b><span className="block text-xs text-muted">{m.d}</span></span>
          </label>
        ))}
      </div>

      {needSeller && (
        <div className="rounded-xl bg-bg border border-line p-3 space-y-2">
          <label className="label !mb-0">Sotuvchining ID raqami</label>
          <div className="flex gap-2">
            <input className="input font-mono" inputMode="numeric" placeholder="100002" value={f.sellerId}
              onChange={e => { set("sellerId")(e); setSeller(null); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); lookup(); } }} />
            <button type="button" disabled={looking || !num(f.sellerId)} className="btn-ghost" onClick={lookup}>{looking ? "…" : "Topish"}</button>
          </div>
          {seller === "none" && <p className="text-lose text-sm font-bold">Bu ID bilan foydalanuvchi topilmadi</p>}
          {lookErr && <p className="text-lose text-sm font-bold">{lookErr}</p>}
          {seller && seller !== "none" && (
            <p className="text-sm">✅ <b className="font-mono text-accent">ID {seller.public_id}</b> • {seller.username || "—"} • {seller.email || "—"} • <Tg u={seller.telegram} /></p>
          )}
        </div>
      )}

      <div>
        <label className="label">Mas&apos;ul admin</label>
        <select className="input" value={adminId} onChange={e => setAdminId(e.target.value)}>
          {admins.map(a => (
            <option key={a.id} value={a.id}>
              {a.id === me ? "👤 Men — " : ""}{a.username || "—"}{a.telegram ? ` (@${a.telegram})` : " (telegram yo'q)"}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-muted mt-1">Xaridor sotib olgach aynan shu adminning Telegramiga yo&apos;naltiriladi.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label">O&apos;yin</label>
          <select className="input" value={f.game} onChange={set("game")}>{GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}</select></div>
        <div><label className="label">Joylashuv</label>
          <select className="input" value={f.case_id} onChange={set("case_id")} disabled={mode === "market"}>
            <option value="">🛒 Bozorga (sotuvga)</option>
            {mode !== "market" && cases.map(c => <option key={c.id} value={c.id}>🎰 {c.name} ({som(c.price)})</option>)}
          </select></div>
      </div>
      <div><label className="label">Sarlavha *</label><input className="input" value={f.title} onChange={set("title")} placeholder="Masalan: 45 lvl, 12 ta skin" /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className="label">Rank</label><input className="input" value={f.rank} onChange={set("rank")} /></div>
        <div><label className="label">Level</label><input className="input" inputMode="numeric" value={f.level} onChange={set("level")} /></div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label">{f.case_id ? "Qiymati" : "Sotuv narxi"} (so&apos;m) *</label>
          <input className="input" inputMode="numeric" value={f.price} onChange={set("price")} />
          {price ? <p className="text-[11px] mt-1 font-bold" style={{ color: rarity(price).color }}>{rarity(price).name} • {som(price)}</p> : null}
        </div>
      </div>
      {mode === "quick" && (
        <div>
          <label className="label">Sotuvchiga to&apos;lov (so&apos;m) *</label>
          <input className="input" inputMode="numeric" value={f.payout} onChange={set("payout")} />
          <p className="text-[11px] text-muted mt-1">Saqlash bosilishi bilan bu summa sotuvchi balansiga darhol tushadi.{payout ? ` (${som(payout)})` : ""}</p>
        </div>
      )}
      <div><label className="label">Tavsif</label><textarea className="input min-h-[80px]" value={f.description} onChange={set("description")} /></div>
      <div><label className="label">Rasmlar (8 tagacha)</label><ImageUploader value={images} onChange={setImages} game={f.game} frame={frame || null} /></div>
      <FramePicker value={frame} onChange={setFrame} game={f.game} />
      <BindingsEditor value={bindings} origin={origin} onChange={setBindings} onOrigin={setOrigin} />

      <div className="rounded-xl border border-violet/40 bg-violet/5 p-3 space-y-3">
        <p className="label !mb-0">🔒 Kirish ma&apos;lumotlari — saytda hech kimga ko&apos;rinmaydi</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Login *</label><input className="input" value={f.login} onChange={set("login")} autoComplete="off" /></div>
          <div><label className="label">Parol *</label><input className="input" value={f.password} onChange={set("password")} autoComplete="off" /></div>
        </div>
        <div><label className="label">Qo&apos;shimcha (pochta, kod…)</label><input className="input" value={f.extra} onChange={set("extra")} autoComplete="off" /></div>
      </div>

      <button disabled={busy || saving || !ok} className="btn-accent w-full" onClick={save}>
        {mode === "quick" && payout ? `Joylash va sotuvchiga ${som(payout)} to'lash` : "Saytga joylash"}
      </button>
    </div>
  );
}
