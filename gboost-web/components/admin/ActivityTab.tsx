"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { supabase, errText } from "@/lib/supabase";
import { som } from "@/lib/uzdrop";
import { Empty, Tg, dt, num } from "./shared";
import { FILTERS, rel, txLabel } from "./activity";

interface FeedRow {
  id: string; type: string; amount: number; note: string | null; created_at: string;
  user: { id: string; public_id: number | null; username: string | null; telegram: string | null; balance: number };
}

/**
 * Jonli faollik lentasi. `tick` — sahifa darajasidagi realtime obuna har yangi tranzaksiyada oshiradi;
 * lenta 500 ms debounce bilan qayta yuklanadi.
 */
export default function ActivityTab({ tick, onOpenUser }: { tick: number; onOpenUser: (publicId: number) => void }) {
  const [rows, setRows] = useState<FeedRow[] | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [, setNow] = useState(0);
  const [idText, setIdText] = useState("");
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_activity_feed", { p_limit: 150 });
    if (error) { setErr(errText(error)); return; }
    setErr("");
    const list = (data ?? []) as FeedRow[];
    // yangi kelganlarni qisqa vaqt yoritish
    if (known.current) {
      const nw = list.filter(r => !known.current!.has(r.id)).map(r => r.id);
      if (nw.length) {
        setFresh(new Set(nw));
        setTimeout(() => setFresh(new Set()), 4000);
      }
    }
    known.current = new Set(list.map(r => r.id));
    setRows(list);
  }, []);

  useEffect(() => { load(); }, [load]);
  // realtime signal → debounce 500ms
  useEffect(() => {
    if (!tick) return;
    const t = setTimeout(load, 500);
    return () => clearTimeout(t);
  }, [tick, load]);
  // "X daqiqa oldin" yangilanib tursin
  useEffect(() => { const t = setInterval(() => setNow(n => n + 1), 30_000); return () => clearInterval(t); }, []);

  const f = FILTERS.find(x => x.id === filter)!;
  const shown = (rows ?? []).filter(r => !f.types || f.types.includes(r.type));
  const openById = () => { const id = num(idText); if (id) onOpenUser(id); };

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
        <p className="label !mb-0 shrink-0">ID bo&apos;yicha foydalanuvchi tarixi</p>
        <input className="input sm:max-w-xs font-mono" inputMode="numeric" placeholder="100002" value={idText}
          onChange={e => setIdText(e.target.value)} onKeyDown={e => e.key === "Enter" && openById()} />
        <button className="btn-accent !py-2.5" disabled={!num(idText)} onClick={openById}>📜 Tarixni ochish</button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1.5 chip bg-win/10 text-win !px-2.5 !py-1.5 mr-2">
          <span className="w-2 h-2 rounded-full bg-win animate-glow" /> Jonli
        </span>
        {FILTERS.map(x => (
          <button key={x.id} onClick={() => setFilter(x.id)}
            className={clsx("chip !px-3 !py-1.5", filter === x.id ? "bg-accent text-[#1B1400]" : "bg-panel text-muted hover:text-white")}>
            {x.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-xs font-bold text-accent">↻ Yangilash</button>
      </div>

      {err && <p className="text-lose text-sm font-bold">{err}</p>}
      {rows === null && !err && <div className="panel p-10 text-center text-muted text-sm">Yuklanmoqda…</div>}
      {rows !== null && shown.length === 0 && <Empty text="Hozircha amallar yo'q" />}

      {shown.length > 0 && (
        <div className="panel divide-y divide-line overflow-hidden">
          {shown.map(r => (
            <div key={r.id} className={clsx("flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 transition-colors duration-1000",
              fresh.has(r.id) ? "bg-accent/10" : "")}>
              <div className="sm:w-48 shrink-0">
                <p className="font-bold text-sm">{txLabel(r.type)}</p>
                <p className="text-[11px] text-muted" title={dt(r.created_at)}>{rel(r.created_at)} • {dt(r.created_at)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <button onClick={() => r.user.public_id && onOpenUser(r.user.public_id)}
                    className="font-mono font-black text-accent hover:underline">ID {r.user.public_id ?? "—"}</button>
                  {" • "}{r.user.username || "—"}{" • "}<Tg u={r.user.telegram} />
                </p>
                {r.note && <p className="text-xs text-muted truncate">📝 {r.note}</p>}
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                <span className={clsx("font-black whitespace-nowrap", r.amount >= 0 ? "text-win" : "text-lose")}>
                  {r.amount >= 0 ? "+" : "−"}{som(Math.abs(r.amount))}
                </span>
                <span className="text-[11px] text-muted whitespace-nowrap">Balans: {som(r.user.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
