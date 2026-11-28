import { BINDINGS, binding } from "@/lib/uzdrop";

/** Foydalanuvchiga: akkauntga nimalar ulangan va asli nimada ochilgani */
export default function AccountBindings({ bindings, origin }: { bindings?: Record<string, number> | null; origin?: string | null }) {
  const list = BINDINGS.filter(b => (bindings?.[b.id] ?? 0) > 0);
  const o = binding(origin);
  if (!list.length && !o) return null;
  const total = list.reduce((s, b) => s + (bindings?.[b.id] ?? 0), 0);
  return (
    <div className="rounded-xl border border-line bg-bg/60 p-3">
      <p className="text-xs font-extrabold uppercase text-muted mb-2">🔗 Ulangan privyazkalar {total > 0 && <span className="text-white">({total})</span>}</p>
      {o && (
        <p className="text-sm mb-2">
          <span className="text-muted">Asl ochilgan: </span>
          <b className="text-accent">{o.icon} {o.name}</b>
        </p>
      )}
      {list.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {list.map(b => (
            <span key={b.id} className="inline-flex items-center gap-1 rounded-lg bg-panel2 border border-line px-2 py-1 text-xs font-bold">
              {b.icon} {b.name}
              <span className="ml-0.5 rounded-md bg-accent text-[#1B1400] px-1.5 text-[11px] font-black">{bindings?.[b.id]}</span>
            </span>
          ))}
        </div>
      ) : <p className="text-xs text-muted">Hech narsa ulanmagan</p>}
    </div>
  );
}
