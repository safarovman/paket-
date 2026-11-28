"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { accNo, game, som } from "@/lib/uzdrop";
import GameFrame from "@/components/GameFrame";
import CodeCard from "@/components/CodeCard";
import LoginCta from "@/components/profile/LoginCta";

const GRACE_MS = 5 * 60 * 1000; // bekor qilish muddati (20_orders.sql bilan bir xil)

interface Order {
  id: string; code: string; status: "pending" | "waiting" | "delivered" | "cancelled";
  price: number; created_at: string; approved_at: string | null; admin_note: string | null;
  account_id: string; source: "buy" | "spin";
  accounts: { public_no: number | null; title: string; game: string; image_url: string | null; images: string[] | null; frame: string | null } | null;
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function OrdersPage() {
  const { user, loading, refresh } = useUser();
  const [list, setList] = useState<Order[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("deliveries")
      .select("id,code,status,price,created_at,approved_at,admin_note,account_id,source,accounts(public_no,title,game,image_url,images,frame)")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (error) { setMsg({ ok: false, t: errText(error) }); setList([]); return; }
    setList((data as unknown as Order[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Jonli yangilanish: admin tasdiqlasa yoki rad etsa
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`orders-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `user_id=eq.${user.id}` }, () => { load(); refresh(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load, refresh]);

  // Sanoq (har soniya)
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const cancel = async (o: Order) => {
    if (!confirm(`${o.code} arizani bekor qilasizmi? ${som(o.price)} balansingizga qaytadi.`)) return;
    setBusy(o.id); setMsg(null);
    const { error } = await supabase.rpc("cancel_order", { p_order: o.id });
    setBusy(null);
    if (error) { setMsg({ ok: false, t: errText(error) }); load(); return; }
    setMsg({ ok: true, t: `↩️ Ariza bekor qilindi, ${som(o.price)} balansingizga qaytdi` });
    await Promise.all([load(), refresh()]);
  };

  if (loading) return <div className="wrap py-20 text-center text-muted">Yuklanmoqda…</div>;
  if (!user) return <LoginCta text="Arizalaringizni ko'rish uchun hisobingizga kiring." />;

  const active = (list || []).filter(o => o.status === "pending" || o.status === "waiting");
  const history = (list || []).filter(o => o.status === "delivered" || o.status === "cancelled");

  const Row = ({ o }: { o: Order }) => {
    const a = o.accounts;
    const left = GRACE_MS - (now - new Date(o.created_at).getTime());
    const imgs = a?.images?.length ? a.images : a?.image_url ? [a.image_url] : [];
    return (
      <div className="panel p-4 grid sm:grid-cols-[220px_1fr] gap-4">
        <GameFrame game={a?.game} frame={a?.frame} className="rounded-xl overflow-hidden bg-bg">
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#2a1015] to-[#0b0606]">
            {imgs.length ? <img src={imgs[0]} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl">{game(a?.game).icon}</span>}
          </div>
        </GameFrame>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-extrabold truncate">{a?.title ?? "Akkaunt"}</p>
            <p className="font-black text-accent whitespace-nowrap">{som(o.price)}</p>
          </div>
          <p className="text-xs text-muted">
            {game(a?.game).icon} {game(a?.game).name}{a?.public_no ? ` • ${accNo(a.public_no)}` : ""} • Ariza: <b className="text-white/80 font-mono">{o.code}</b>
          </p>
          <p className="text-[11px] text-muted mt-0.5">{new Date(o.created_at).toLocaleString("uz-UZ")}</p>

          <div className="mt-3">
            {o.status === "pending" && left > 0 && (
              <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
                <p className="font-black text-accent">⏳ Ko&apos;rib chiqilmoqda</p>
                <p className="text-sm mt-1">Adashib olgan bo&apos;lsangiz — bekor qilish uchun <b className="text-white">{mmss(left)}</b> qoldi.</p>
                <button onClick={() => cancel(o)} disabled={busy === o.id}
                  className="btn !bg-lose text-white !py-2 mt-2 w-full sm:w-auto">{busy === o.id ? "…" : "Arizani bekor qilish"}</button>
              </div>
            )}
            {o.status === "pending" && left <= 0 && (
              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="font-black">🛡️ Admin ko&apos;rib chiqmoqda</p>
                <p className="text-sm text-muted mt-1">Bekor qilish muddati tugadi. Admin arizani tasdiqlagach shu yerda maxfiy kod va mas&apos;ul admin chiqadi.</p>
              </div>
            )}
            {o.status === "waiting" && (
              <div className="rounded-xl border border-win/40 bg-win/10 p-3">
                <p className="font-black text-win mb-2">✅ Tasdiqlandi</p>
                <CodeCard code={o.code} kind={o.source} title={a?.title} accountId={o.account_id} />
              </div>
            )}
            {o.status === "delivered" && <p className="font-black text-win">📦 Topshirildi</p>}
            {o.status === "cancelled" && (
              <p className="text-sm"><b className="text-lose">❌ Bekor qilingan</b>{o.admin_note ? <span className="text-muted"> — {o.admin_note}</span> : null}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="wrap py-8 max-w-4xl animate-fade-in">
      <h1 className="h-title">📥 Arizalarim</h1>
      <p className="text-muted text-sm mt-1">
        Sotib olingan akkaunt avval ariza bo&apos;ladi: 5 daqiqa ichida bekor qilishingiz mumkin, keyin admin tasdiqlaydi va maxfiy kod chiqadi.
      </p>

      {msg && <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${msg.ok ? "bg-win/15 text-win" : "bg-lose/15 text-lose"}`}>{msg.t}</div>}

      {list === null ? (
        <div className="panel p-10 text-center text-muted mt-6">Yuklanmoqda…</div>
      ) : list.length === 0 ? (
        <div className="panel p-10 text-center mt-6">
          <p className="text-muted mb-4">Hali arizalar yo&apos;q.</p>
          <Link href="/market" className="btn-accent">🛒 Akkauntlarni ko&apos;rish</Link>
        </div>
      ) : (
        <>
          <h2 className="font-black uppercase text-sm mt-6 mb-3">Faol arizalar ({active.length})</h2>
          {active.length === 0
            ? <div className="panel p-6 text-center text-muted text-sm">Faol ariza yo&apos;q</div>
            : <div className="space-y-3">{active.map(o => <Row key={o.id} o={o} />)}</div>}
          {history.length > 0 && (
            <>
              <h2 className="font-black uppercase text-sm mt-8 mb-3">Tarix ({history.length})</h2>
              <div className="space-y-3">{history.map(o => <Row key={o.id} o={o} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
