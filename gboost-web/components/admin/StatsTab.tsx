"use client";
import { useEffect, useState } from "react";
import { supabase, errText } from "@/lib/supabase";
import { game, som } from "@/lib/uzdrop";
import { Empty, Tg, dt } from "./shared";

interface Stats {
  totals: { users: number; new_today: number; new_7d: number; deposits_sum: number; sales_count: number; active_listings: number };
  top_depositors: { public_id: number; username: string | null; email: string | null; telegram: string | null; total: number; count: number; last_at: string }[];
  new_users: { public_id: number; username: string | null; email: string | null; telegram: string | null; created_at: string; balance: number }[];
  big_wins: { username: string | null; public_id: number | null; title: string | null; game: string | null; value: number; created_at: string }[];
}

function Card({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="panel p-4">
      <p className="label !mb-1">{label}</p>
      <p className={`text-2xl font-black ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}

export default function StatsTab() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    const { data, error } = await supabase.rpc("admin_stats");
    if (error) return setErr(errText(error));
    setS(data as Stats);
  };
  useEffect(() => { load(); }, []);

  if (err) return <div className="panel p-6 text-lose text-sm font-bold">{err}<p className="text-muted font-normal mt-1">supabase/06_admin_stats.sql ishga tushirilganini tekshiring.</p></div>;
  if (!s) return <div className="panel p-8 text-center text-muted">Yuklanmoqda…</div>;
  const t = s.totals;

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><button onClick={load} className="btn-ghost !py-2">↻ Yangilash</button></div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card label="Foydalanuvchilar" value={t.users} />
        <Card label="Bugun yangi" value={t.new_today} />
        <Card label="7 kunda yangi" value={t.new_7d} />
        <Card label="Jami depozit" value={som(t.deposits_sum)} accent />
        <Card label="Sotilgan akkaunt" value={t.sales_count} />
        <Card label="Sotuvda" value={t.active_listings} />
      </div>

      <section>
        <h2 className="font-black uppercase mb-3">💰 Eng katta depozit qilganlar</h2>
        {s.top_depositors.length === 0 ? <Empty text="Hali depozitlar yo'q" /> : (
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-xs uppercase"><tr className="border-b border-line">
                <th className="text-left p-3">#</th><th className="text-left p-3">ID</th><th className="text-left p-3">Foydalanuvchi</th>
                <th className="text-right p-3">Jami</th><th className="text-right p-3">Soni</th><th className="text-right p-3">Oxirgisi</th>
              </tr></thead>
              <tbody>
                {s.top_depositors.map((u, i) => (
                  <tr key={u.public_id} className="border-b border-line/50 last:border-0">
                    <td className="p-3 font-black text-muted">{i + 1}</td>
                    <td className="p-3 font-mono font-black text-accent">{u.public_id}</td>
                    <td className="p-3"><p className="font-bold">{u.username || "—"}</p><p className="text-xs text-muted">{u.email} • <Tg u={u.telegram} /></p></td>
                    <td className="p-3 text-right font-black text-win whitespace-nowrap">{som(u.total)}</td>
                    <td className="p-3 text-right">{u.count}</td>
                    <td className="p-3 text-right text-xs text-muted whitespace-nowrap">{dt(u.last_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-black uppercase mb-3">🆕 Yangi foydalanuvchilar</h2>
        {s.new_users.length === 0 ? <Empty text="Foydalanuvchilar yo'q" /> : (
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-xs uppercase"><tr className="border-b border-line">
                <th className="text-left p-3">ID</th><th className="text-left p-3">Foydalanuvchi</th>
                <th className="text-right p-3">Balans</th><th className="text-right p-3">Ro&apos;yxatdan o&apos;tgan</th>
              </tr></thead>
              <tbody>
                {s.new_users.map(u => (
                  <tr key={u.public_id} className="border-b border-line/50 last:border-0">
                    <td className="p-3 font-mono font-black text-accent text-base">{u.public_id}</td>
                    <td className="p-3"><p className="font-bold">{u.username || "—"}</p><p className="text-xs text-muted">{u.email || "—"} • <Tg u={u.telegram} /></p></td>
                    <td className="p-3 text-right whitespace-nowrap">{som(u.balance)}</td>
                    <td className="p-3 text-right text-xs text-muted whitespace-nowrap">{dt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-black uppercase mb-3">🏆 Katta yutuqlar</h2>
        {s.big_wins.length === 0 ? <Empty text="Spin hali yoqilmagan" /> : (
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {s.big_wins.map((w, i) => (
                  <tr key={i} className="border-b border-line/50 last:border-0">
                    <td className="p-3 font-mono font-black text-accent">{w.public_id ?? "—"}</td>
                    <td className="p-3 font-bold">{w.username || "—"}</td>
                    <td className="p-3">{game(w.game).icon} {w.title}</td>
                    <td className="p-3 text-right font-black text-win whitespace-nowrap">{som(w.value)}</td>
                    <td className="p-3 text-right text-xs text-muted whitespace-nowrap">{dt(w.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
