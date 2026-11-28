"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import GameFrame from "@/components/GameFrame";
import { accNo, game as gameInfo, som } from "@/lib/uzdrop";
import { CopyBtn, Empty, Tg, dt } from "./shared";

interface OrderItem {
  id: string; code: string; price: number; created_at: string;
  user: { public_id: number | null; username: string | null; email: string | null; telegram: string | null };
  account: { id: string; public_no: number | null; title: string; game: string; image_url: string | null; frame: string | null; admin_id: string | null };
  admin: { username: string | null; telegram: string | null } | null;
}
interface Orders { cooling: number; items: OrderItem[] }

const ago = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} soniya oldin`;
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  return `${Math.floor(s / 86400)} kun oldin`;
};

/** Mijozlar arizalari: 5 daqiqalik bekor qilish muddatidan o'tganlari — tasdiqlash yoki rad etish */
export default function OrdersTab({ onCount }: { onCount?: (n: number) => void }) {
  const { profile } = useUser();
  const me = profile?.id;
  const [data, setData] = useState<Orders | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [approved, setApproved] = useState<{ code: string; item: OrderItem } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 4000); };

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_orders");
    if (error) { setErr(errText(error)); return; }
    setErr("");
    const d = data as Orders;
    setData(d);
    onCount?.(d.items.length);
  }, [onCount]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 20000);
    const ch = supabase.channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(load, 600);
      })
      .subscribe();
    return () => { clearInterval(iv); if (timer.current) clearTimeout(timer.current); supabase.removeChannel(ch); };
  }, [load]);

  const approve = async (it: OrderItem) => {
    if (!confirm(`#${it.account.public_no ?? ""} "${it.account.title}" uchun ID ${it.user.public_id} arizasi tasdiqlansinmi?`)) return;
    setBusy(it.id);
    const { data, error } = await supabase.rpc("admin_approve_order", { p_order: it.id });
    setBusy(null);
    if (error) return flash(false, errText(error));
    setApproved({ code: String(data), item: it });
    flash(true, "Ariza tasdiqlandi");
    load();
  };

  const reject = async (it: OrderItem) => {
    const note = prompt(`ID ${it.user.public_id} arizasini rad etish sababi (mijozga ko'rinadi):`, "Akkaunt mavjud emas");
    if (note === null) return;
    setBusy(it.id);
    const { error } = await supabase.rpc("admin_reject_order", { p_order: it.id, p_note: note });
    setBusy(null);
    if (error) return flash(false, errText(error));
    flash(true, "Rad etildi, pul qaytarildi");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="font-black uppercase text-sm">📥 Mijozlar arizalari</p>
          <p className="text-xs text-muted mt-0.5">Mijoz sotib olgach 5 daqiqa ichida arizani bekor qila oladi. Shu vaqt o&apos;tgach ariza shu yerga tushadi.</p>
        </div>
        <span className="chip bg-accent/15 text-accent !py-1.5">⏳ Bekor qilish muddatidagi arizalar: {data?.cooling ?? "…"}</span>
        <button onClick={load} className="btn-ghost !py-2">↻ Yangilash</button>
      </div>

      {msg && (
        <div className={clsx("fixed bottom-5 right-5 z-50 panel px-4 py-3 text-sm font-bold animate-fade-in max-w-sm",
          msg.ok ? "border-win text-win" : "border-lose text-lose")}>{msg.t}</div>
      )}

      {approved && (
        <div className="panel p-5 border-win/50 bg-win/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-win">✅ Tasdiqlandi — maxfiy kod</p>
              <p className="text-3xl font-black font-mono tracking-widest text-accent mt-1 select-all">{approved.code}</p>
              <p className="text-xs text-muted mt-1">
                #{approved.item.account.public_no} {approved.item.account.title} • ID {approved.item.user.public_id} <Tg u={approved.item.user.telegram} />
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CopyBtn text={approved.code} label="Nusxalash" />
              <button onClick={() => setApproved(null)} className="text-muted hover:text-white text-lg">✕</button>
            </div>
          </div>
          <p className="text-sm mt-3">Mijozga kod va mas&apos;ul admin ko&apos;rindi. Mijoz Telegramda yozganda 🔑 Kod bo&apos;limida shu kod bilan topshiring.</p>
        </div>
      )}

      {err && <div className="panel p-4 text-lose text-sm font-bold">{err}</div>}
      {!data && !err && <div className="panel p-8 text-center text-muted">Yuklanmoqda…</div>}
      {data && data.items.length === 0 && <Empty text="Hozircha ko'rib chiqiladigan ariza yo'q" />}

      {data?.items.map(it => {
        const g = gameInfo(it.account.game);
        const mine = !!me && it.account.admin_id === me;
        return (
          <div key={it.id} className="panel p-4 flex flex-col md:flex-row gap-4">
            <GameFrame game={it.account.game} frame={it.account.frame} className="w-full md:w-56 shrink-0 rounded-lg overflow-hidden bg-bg/40">
              <div className="absolute inset-0 grid place-items-center">
                {it.account.image_url
                  ? <img src={it.account.image_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-4xl">{g.icon}</span>}
              </div>
            </GameFrame>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-lg">{accNo(it.account.public_no)}</span>
                <span className="font-extrabold truncate">{it.account.title}</span>
                <span className="chip bg-panel2 text-muted">{g.icon} {g.name}</span>
                <span className="font-black text-accent ml-auto">{som(it.price)}</span>
              </div>

              <div className="rounded-xl bg-bg/60 border border-line p-3">
                <p className="label !mb-1">Xaridor</p>
                <p className="text-2xl font-black font-mono text-accent">ID {it.user.public_id ?? "—"}</p>
                <p className="text-sm">{it.user.username || "—"} • <span className="text-muted">{it.user.email || "—"}</span> • <Tg u={it.user.telegram} /></p>
              </div>

              <p className="text-sm">
                Mas&apos;ul admin: {it.admin?.telegram ? <Tg u={it.admin.telegram} /> : <b className="text-lose">biriktirilmagan</b>}
                {it.admin && !mine && <span className="ml-2 chip bg-lose/15 text-lose">boshqa admin</span>}
                {mine && <span className="ml-2 chip bg-win/15 text-win">siz</span>}
              </p>
              <p className="text-xs text-muted">
                Ariza: <b className="font-mono text-white/80">{it.code}</b> • {ago(it.created_at)} ({dt(it.created_at)})
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button disabled={busy === it.id} onClick={() => approve(it)} className="btn-win">✅ Tasdiqlash</button>
                <button disabled={busy === it.id} onClick={() => reject(it)} className="btn-ghost text-lose">❌ Rad etish</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
