"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SPIN_ENABLED, game, rarity, som, type Spin } from "@/lib/uzdrop";

/** Tepadagi jonli yutuqlar lentasi (spin yoqilganda) */
export default function LiveFeed() {
  return SPIN_ENABLED ? <Feed /> : null;
}

function Feed() {
  const [spins, setSpins] = useState<Spin[]>([]);

  useEffect(() => {
    supabase.from("spins").select("id,username,case_name,title,game,value,created_at")
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => data && setSpins(data as Spin[]));
    const ch = supabase.channel("live-spins")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "spins" },
        p => setSpins(s => [p.new as Spin, ...s].slice(0, 20)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="border-b border-line bg-[#060404]">
      <div className="flex items-stretch h-[72px]">
        <div className="hidden sm:flex flex-col justify-center items-center px-5 border-r border-line shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-win">
            <span className="w-2 h-2 rounded-full bg-win animate-glow" /> Live
          </span>
          <span className="text-[10px] text-muted font-bold uppercase">yutuqlar</span>
        </div>
        <div className="flex gap-1.5 overflow-hidden p-1.5 flex-1">
          {spins.length === 0 && (
            <p className="text-muted text-xs self-center px-3">Hali spinlar yo&apos;q — birinchi bo&apos;ling!</p>
          )}
          {spins.map(s => {
            const r = rarity(s.value);
            return (
              <div key={s.id} title={`${s.username ?? "Foydalanuvchi"} • ${s.case_name ?? ""}`}
                className="relative w-[132px] shrink-0 rounded-lg bg-panel overflow-hidden px-2.5 py-1.5 animate-ticker-in">
                <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: r.color }} />
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 120%, ${r.color}, transparent 70%)` }} />
                <p className="relative text-[10px] text-muted truncate">{game(s.game).icon} {s.username ?? "Mehmon"}</p>
                <p className="relative text-[11px] font-bold truncate">{s.title}</p>
                <p className="relative text-[11px] font-extrabold" style={{ color: r.color }}>{som(s.value)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
