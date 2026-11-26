"use client";
import { useMemo, useState } from "react";
import { GAMES, chances, game, som, type Case } from "@/lib/uzdrop";
import { Empty, num, type PoolRow } from "./shared";

const emptyCase = { id: "", name: "", game: GAMES[0].id, price: "", image_url: "", color: "#7C5CFF", sort: "0", active: true };

export default function CasesTab({ cases, pool, busy, onSave }: {
  cases: Case[]; pool: PoolRow[]; busy: boolean; onSave: (args: Record<string, unknown>) => Promise<boolean>;
}) {
  const [f, setF] = useState(emptyCase);
  const stats = useMemo(() => {
    const m: Record<string, { n: number; total: number; ev: number }> = {};
    for (const c of cases) {
      const items = pool.filter(p => p.case_id === c.id);
      const ch = chances(items);
      m[c.id] = { n: items.length, total: items.reduce((s, i) => s + i.price, 0), ev: items.reduce((s, i, k) => s + ch[k] * i.price, 0) };
    }
    return m;
  }, [cases, pool]);

  const save = async () => {
    const ok = await onSave({
      p_id: f.id || null, p_name: f.name, p_game: f.game, p_price: num(f.price), p_image_url: f.image_url,
      p_color: f.color, p_sort: num(f.sort) ?? 0, p_active: f.active,
    });
    if (ok) setF(emptyCase);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-3">
        {cases.length === 0 && <Empty text="Hali keys yo'q — o'ngdagi forma orqali yarating" />}
        {cases.map(c => {
          const s = stats[c.id] ?? { n: 0, total: 0, ev: 0 };
          const edge = s.ev ? (1 - s.ev / c.price) * 100 : 0;
          return (
            <div key={c.id} className="panel p-4 flex flex-col sm:flex-row gap-4 sm:items-center"
              style={{ boxShadow: `inset 4px 0 0 ${c.color}` }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold">{c.name}</p>
                  {!c.active && <span className="chip bg-lose/15 text-lose">O&apos;chiq</span>}
                </div>
                <p className="text-xs text-muted">{game(c.game).icon} {game(c.game).name} • narx <b className="text-accent">{som(c.price)}</b></p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                  <span>Akkauntlar: <b>{s.n}</b></span>
                  <span>Jami qiymat: <b>{som(s.total)}</b></span>
                  <span>O&apos;rtacha yutuq (EV): <b>{som(Math.round(s.ev))}</b></span>
                  {s.n > 0 && (
                    <span className={edge >= 0 ? "text-win" : "text-lose"}>
                      Sayt foydasi: <b>{edge.toFixed(1)}%</b>{edge < 0 && " ⚠️ zarar!"}
                    </span>
                  )}
                </div>
              </div>
              <button className="btn-ghost !py-2" onClick={() => setF({
                id: c.id, name: c.name, game: c.game, price: String(c.price), image_url: c.image_url ?? "",
                color: c.color, sort: String(c.sort), active: c.active,
              })}>Tahrirlash</button>
            </div>
          );
        })}
      </div>

      <div className="panel p-5 space-y-3 h-fit lg:sticky lg:top-24">
        <p className="font-extrabold uppercase text-sm">{f.id ? "Keysni tahrirlash" : "Yangi keys"}</p>
        <div><label className="label">Nomi</label><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">O&apos;yin</label>
          <select className="input" value={f.game} onChange={e => setF({ ...f, game: e.target.value })}>
            {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select></div>
        <div><label className="label">Narxi (so&apos;m)</label><input className="input" inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></div>
        <div><label className="label">Rasm URL</label><input className="input" value={f.image_url} onChange={e => setF({ ...f, image_url: e.target.value })} placeholder="https://…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Rang</label><input type="color" className="input !p-1 h-11" value={f.color} onChange={e => setF({ ...f, color: e.target.value })} /></div>
          <div><label className="label">Tartib</label><input className="input" inputMode="numeric" value={f.sort} onChange={e => setF({ ...f, sort: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> Faol</label>
        <div className="flex gap-2">
          <button disabled={busy || !f.name || !num(f.price)} className="btn-accent flex-1" onClick={save}>Saqlash</button>
          {f.id && <button className="btn-ghost" onClick={() => setF(emptyCase)}>Bekor</button>}
        </div>
      </div>
    </div>
  );
}

