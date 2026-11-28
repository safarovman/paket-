"use client";
import { BINDINGS } from "@/lib/uzdrop";
import AccountBindings from "@/components/AccountBindings";

/** Admin: har bir platformadan nechta privyazka ulangan + asli nimada ochilgan */
export default function BindingsEditor({ value, origin, onChange, onOrigin }: {
  value: Record<string, number>; origin: string;
  onChange: (v: Record<string, number>) => void; onOrigin: (v: string) => void;
}) {
  const set = (id: string, n: number) => onChange({ ...value, [id]: Math.max(0, Math.min(20, n)) });
  return (
    <div className="rounded-xl border border-line p-3 space-y-3">
      <p className="label !mb-0">🔗 Ulangan privyazkalar</p>
      <div>
        <label className="label">Akkaunt asli nimada ochilgan</label>
        <select className="input" value={origin} onChange={e => onOrigin(e.target.value)}>
          <option value="">— Ko&apos;rsatilmagan —</option>
          {BINDINGS.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {BINDINGS.filter(b => b.id !== "guest").map(b => {
          const n = value[b.id] ?? 0;
          return (
            <div key={b.id} className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${n > 0 ? "border-accent/50 bg-accent/5" : "border-line"}`}>
              <span className="text-sm">{b.icon} {b.name}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => set(b.id, n - 1)} className="w-7 h-7 rounded-md bg-panel2 font-black">−</button>
                <span className="w-6 text-center font-black">{n}</span>
                <button type="button" onClick={() => set(b.id, n + 1)} className="w-7 h-7 rounded-md bg-panel2 font-black">+</button>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <p className="text-[11px] text-muted mb-1">Foydalanuvchilar shunday ko&apos;radi:</p>
        <AccountBindings bindings={value} origin={origin || null} />
      </div>
    </div>
  );
}
