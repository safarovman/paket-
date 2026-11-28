"use client";
import GameFrame, { FRAME_OPTIONS } from "@/components/GameFrame";
import { GameIcon } from "@/components/Icon";

const GROUPS: { id: "auto" | "ornate" | "simple"; title: string }[] = [
  { id: "auto", title: "" }, { id: "ornate", title: "Bezakli" }, { id: "simple", title: "Oddiy (neon)" },
];

/**
 * Akkaunt rasmi ramkasi — majburiy emas.
 * Avval: "Ramkasiz" yoki "Ramka bilan". "Ramka bilan" tanlansa — ramkalar ro'yxati chiqadi.
 */
export default function FramePicker({ value, onChange, game }: { value: string; onChange: (v: string) => void; game: string }) {
  const none = value === "none";
  const Opt = ({ id, name }: { id: string; name: string }) => (
    <button type="button" onClick={() => onChange(id)}
      className={`rounded-xl p-1.5 border transition-colors text-left ${value === id ? "border-accent bg-accent/10" : "border-line hover:border-violet"}`}>
      <GameFrame game={game} frame={id || null} className="rounded-md overflow-hidden bg-gradient-to-br from-[#3a1520] to-[#120808]">
        <div className="absolute inset-0 grid place-items-center"><GameIcon game={game} className="w-6 h-6" /></div>
      </GameFrame>
      <p className="text-[10px] font-bold mt-1 leading-tight truncate">{name}</p>
    </button>
  );
  return (
    <div className="space-y-2">
      <label className="label !mb-0">Rasm ramkasi</label>
      <div className="grid grid-cols-2 gap-2">
        {[{ v: true, t: "Ramkasiz", d: "Faqat skrinshot" }, { v: false, t: "Ramka bilan", d: "Bezakli yoki neon ramka" }].map(o => (
          <button key={o.t} type="button" onClick={() => onChange(o.v ? "none" : "")}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${none === o.v ? "border-accent bg-accent/10" : "border-line hover:border-violet"}`}>
            <p className={`text-sm font-black ${none === o.v ? "text-accent" : ""}`}>{o.t}</p>
            <p className="text-[11px] text-muted">{o.d}</p>
          </button>
        ))}
      </div>
      {!none && GROUPS.map(gr => {
        const opts = FRAME_OPTIONS.filter(o => o.group === gr.id);
        return (
          <div key={gr.id}>
            {gr.title && <p className="text-[11px] font-bold text-muted mb-1">{gr.title}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {opts.map(o => <Opt key={o.id || "auto"} id={o.id} name={o.id ? o.name : "Avtomatik (o'yin bo'yicha)"} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
