"use client";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { accNo, game, som } from "@/lib/uzdrop";
import { Empty, Tg, dt, num } from "./shared";

interface ActiveAcc { id: string; public_no: number | null; title: string; game: string; price: number; }
interface AdminAuction {
  id: string; status: "live" | "ended" | "cancelled"; start_price: number; min_step: number;
  current_bid: number | null; bids_count: number; ends_at: string; created_at: string;
  leader: { public_id: number; username: string | null; telegram: string | null } | null;
  winner: { public_id: number; username: string | null; telegram: string | null } | null;
  account: { id: string; public_no: number | null; title: string; game: string; price: number };
}

const DURATIONS = [
  { label: "1 soat", m: 60 },
  { label: "6 soat", m: 360 },
  { label: "24 soat", m: 1440 },
  { label: "3 kun", m: 4320 },
];
const ST: Record<AdminAuction["status"], { t: string; c: string }> = {
  live: { t: "Jonli", c: "bg-lose/15 text-lose" },
  ended: { t: "Tugagan", c: "bg-win/15 text-win" },
  cancelled: { t: "Bekor qilingan", c: "bg-panel2 text-muted" },
};

export default function AuctionsTab() {
  const [accs, setAccs] = useState<ActiveAcc[]>([]);
  const [list, setList] = useState<AdminAuction[] | null>(null);
  const [accId, setAccId] = useState("");
  const [start, setStart] = useState("");
  const [step, setStep] = useState("5000");
  const [dur, setDur] = useState(1440);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const load = useCallback(async () => {
    await supabase.rpc("finalize_auctions");
    const [a, l] = await Promise.all([
      supabase.from("accounts").select("id,public_no,title,game,price").eq("status", "active").order("created_at", { ascending: false }),
      supabase.rpc("admin_auctions", { p_limit: 100 }),
    ]);
    setAccs((a.data as ActiveAcc[]) || []);
    if (l.error) setMsg({ ok: false, t: errText(l.error) });
    setList((l.data as AdminAuction[]) || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const pick = (id: string) => {
    setAccId(id);
    const a = accs.find(x => x.id === id);
    if (a) setStart(String(Math.max(1000, Math.round(a.price * 0.5 / 1000) * 1000)));
  };

  const create = async () => {
    setMsg(null);
    const sp = num(start), ms = num(step);
    if (!accId) return setMsg({ ok: false, t: "Akkauntni tanlang" });
    if (!sp || !ms) return setMsg({ ok: false, t: "Narx va qadamni kiriting" });
    setBusy(true);
    const { error } = await supabase.rpc("admin_create_auction", { p_account: accId, p_start_price: sp, p_min_step: ms, p_duration_minutes: dur });
    setBusy(false);
    if (error) return setMsg({ ok: false, t: errText(error) });
    setMsg({ ok: true, t: "✅ Auksion boshlandi" });
    setAccId(""); setStart("");
    load();
  };

  const cancel = async (a: AdminAuction) => {
    if (!confirm(`${accNo(a.account.public_no)} auksionini bekor qilasizmi? Joriy taklif egasiga pul qaytariladi.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_cancel_auction", { p_auction: a.id });
    setBusy(false);
    setMsg(error ? { ok: false, t: errText(error) } : { ok: true, t: "Auksion bekor qilindi" });
    load();
  };

  const sel = accs.find(x => x.id === accId);

  return (
    <div className="space-y-6">
      <div className="panel p-5 space-y-4 max-w-2xl">
        <p className="font-black uppercase">🔨 Yangi auksion</p>
        <div>
          <label className="label">Akkaunt (faqat sotuvdagilar)</label>
          <select className="input" value={accId} onChange={e => pick(e.target.value)}>
            <option value="">— tanlang —</option>
            {accs.map(a => <option key={a.id} value={a.id}>{accNo(a.public_no)} · {game(a.game).name} · {a.title} · {som(a.price)}</option>)}
          </select>
          {accs.length === 0 && <p className="text-xs text-muted mt-1">Sotuvda akkaunt yo&apos;q. Avval &quot;Akkaunt joylash&quot; orqali qo&apos;shing.</p>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Boshlang&apos;ich narx</label>
            <input className="input" inputMode="numeric" value={start} onChange={e => setStart(e.target.value)} placeholder="100000" />
            {sel && <p className="text-[11px] text-muted mt-1">Bozordagi narxi: {som(sel.price)}</p>}
          </div>
          <div>
            <label className="label">Minimal qadam</label>
            <input className="input" inputMode="numeric" value={step} onChange={e => setStep(e.target.value)} placeholder="5000" />
          </div>
        </div>
        <div>
          <label className="label">Davomiyligi</label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map(d => (
              <button key={d.m} onClick={() => setDur(d.m)}
                className={clsx("chip !py-2 !px-3 border", dur === d.m ? "border-accent text-accent" : "border-line text-muted hover:text-white")}>{d.label}</button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-muted">Akkaunt auksion davomida bozordan olinadi. Taklif bo&apos;lmasa, vaqt tugagach bozorga qaytadi. G&apos;olibga oddiy xarid kabi kod beriladi — uni &quot;🔑 Kod&quot; bo&apos;limida topshirasiz.</p>
        <button disabled={busy} onClick={create} className="btn-accent w-full">Auksionni boshlash</button>
        {msg && <p className={clsx("text-sm font-bold", msg.ok ? "text-win" : "text-lose")}>{msg.t}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-black uppercase text-sm">Auksionlar</p>
          <button onClick={load} className="text-xs font-bold text-accent">↻ Yangilash</button>
        </div>
        {list === null ? <div className="panel p-6 text-muted text-sm">Yuklanmoqda…</div>
          : list.length === 0 ? <Empty text="Hali auksion yo'q" />
          : list.map(a => (
            <div key={a.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={clsx("chip", ST[a.status].c)}>{ST[a.status].t}</span>
                  <p className="font-extrabold truncate">{accNo(a.account.public_no)} {a.account.title}</p>
                </div>
                <p className="text-xs text-muted mt-1">
                  Boshl.: {som(a.start_price)} · Qadam: {som(a.min_step)} · Takliflar: {a.bids_count} · {a.status === "live" ? "Tugaydi" : "Tugadi"}: {dt(a.ends_at)}
                </p>
                {(a.winner || a.leader) && (
                  <p className="text-xs mt-1">
                    {a.winner ? "🏆 G'olib" : "Yetakchi"}: <b className="text-accent font-mono">ID {(a.winner || a.leader)!.public_id}</b> · {(a.winner || a.leader)!.username || "—"} · <Tg u={(a.winner || a.leader)!.telegram} />
                  </p>
                )}
              </div>
              <b className="text-accent whitespace-nowrap">{a.current_bid ? som(a.current_bid) : "—"}</b>
              {a.status === "live" && <button disabled={busy} onClick={() => cancel(a)} className="btn-ghost !py-2 text-lose">Bekor qilish</button>}
            </div>
          ))}
      </div>
    </div>
  );
}
