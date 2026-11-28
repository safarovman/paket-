"use client";
import GameFrame, { FRAME_OPTIONS } from "@/components/GameFrame";
import { game as gameInfo } from "@/lib/uzdrop";

/** Akkaunt ramkasini tanlash: har variantning kichik ko'rinishi bilan */
export default function FramePicker({ value, onChange, game }: { value: string; onChange: (v: string) => void; game: string }) {
  return (
    <div>
      <label className="label">Ramka</label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {FRAME_OPTIONS.map(o => (
          <button key={o.id || "auto"} type="button" onClick={() => onChange(o.id)}
            className={`rounded-xl p-1.5 border transition-colors text-left ${value === o.id ? "border-accent bg-accent/10" : "border-line hover:border-violet"}`}>
            <GameFrame game={game} frame={o.id || null} className="aspect-[3/4] rounded-lg overflow-hidden">
              <div className="w-full h-full grid place-items-center bg-bg text-2xl">{gameInfo(o.id && o.id !== "none" && o.id !== "default" ? o.id : game).icon}</div>
            </GameFrame>
            <p className="text-[10px] font-bold mt-1 leading-tight truncate">{o.name}</p>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted mt-1">&quot;Avtomatik&quot; — o&apos;yinga mos ramka. Rasm ramkalar (public/frames) yuklansa, ular ishlatiladi.</p>
    </div>
  );
}
