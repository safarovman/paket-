"use client";
import GameFrame, { FRAME_OPTIONS } from "@/components/GameFrame";
import { game as gameInfo } from "@/lib/uzdrop";

const GROUPS: { id: "auto" | "ornate" | "simple" | "none"; title: string }[] = [
  { id: "auto", title: "" }, { id: "ornate", title: "Bezakli" }, { id: "simple", title: "Oddiy (neon)" }, { id: "none", title: "" },
];

/** Akkaunt rasmi ramkasini tanlash — har variantning haqiqiy ko'rinishi bilan */
export default function FramePicker({ value, onChange, game }: { value: string; onChange: (v: string) => void; game: string }) {
  const icon = gameInfo(game).icon;
  const Opt = ({ id, name }: { id: string; name: string }) => (
    <button type="button" onClick={() => onChange(id)}
      className={`rounded-xl p-1.5 border transition-colors text-left ${value === id ? "border-accent bg-accent/10" : "border-line hover:border-violet"}`}>
      <GameFrame game={game} frame={id || null} className="rounded-md overflow-hidden bg-gradient-to-br from-[#3a1520] to-[#120808]">
        <div className="absolute inset-0 grid place-items-center text-2xl">{icon}</div>
      </GameFrame>
      <p className="text-[10px] font-bold mt-1 leading-tight truncate">{name}</p>
    </button>
  );
  return (
    <div className="space-y-2">
      <label className="label !mb-0">Rasm ramkasi</label>
      {GROUPS.map(gr => {
        const opts = FRAME_OPTIONS.filter(o => o.group === gr.id);
        if (gr.id === "auto" || gr.id === "none") return null;
        return (
          <div key={gr.id}>
            <p className="text-[11px] font-bold text-muted mb-1">{gr.title}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{opts.map(o => <Opt key={o.id} id={o.id} name={o.name} />)}</div>
          </div>
        );
      })}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FRAME_OPTIONS.filter(o => o.group === "auto" || o.group === "none").map(o => <Opt key={o.id || "auto"} id={o.id} name={o.id ? o.name : "Avtomatik (o'yin bo'yicha)"} />)}
      </div>
    </div>
  );
}
