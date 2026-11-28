"use client";
import { useEffect, useState } from "react";

/**
 * UzDrop yordamchisi — niqobli personaj, nutq pufakchasi bilan saytni tushuntiradi.
 * Rasm: /mascot/<pose>.png (shaffof fonli PNG). Rasm bo'lmasa — SVG siluet chiziladi.
 * "×" bosilsa, shu joyda boshqa ko'rsatilmaydi (brauzerda eslab qolinadi).
 */
export type MascotPose = "desk" | "point-right" | "point-left" | "wave" | "think";

const KEY = "uzdrop.mascot.hidden";
const readHidden = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const writeHidden = (v: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ruxsat yo'q */ } };

function Placeholder({ pose }: { pose: MascotPose }) {
  // Kapyushonli, oq niqobli siluet (rasm qo'yilguncha)
  const arm = pose === "point-right" ? "M70 92 L112 70" : pose === "point-left" ? "M50 92 L8 70" : pose === "wave" ? "M70 92 L98 52" : pose === "think" ? "M60 96 Q72 84 66 72" : "M44 100 L76 100";
  return (
    <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-[0_8px_20px_rgba(220,38,38,.35)]" aria-hidden>
      <defs>
        <linearGradient id="mh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1414" /><stop offset="1" stopColor="#0b0606" /></linearGradient>
        <linearGradient id="mm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d9d2d2" /></linearGradient>
      </defs>
      {pose === "desk" && <rect x="6" y="112" width="108" height="10" rx="3" fill="#3a2a1a" />}
      <path d="M22 132 C22 96 36 80 60 80 C84 80 98 96 98 132 Z" fill="url(#mh)" stroke="#DC2626" strokeOpacity=".5" />
      <path d={arm} stroke="#1a0e0e" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d={arm} stroke="#DC2626" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M30 58 C30 26 46 12 60 12 C74 12 90 26 90 58 C90 78 78 88 60 88 C42 88 30 78 30 58 Z" fill="url(#mh)" stroke="#DC2626" strokeOpacity=".5" />
      <path d="M42 54 C42 40 50 32 60 32 C70 32 78 40 78 54 C78 70 70 80 60 80 C50 80 42 70 42 54 Z" fill="url(#mm)" />
      <path d="M48 52 L56 55 L48 58 Z" fill="#111" /><path d="M72 52 L64 55 L72 58 Z" fill="#111" />
      <path d="M52 68 Q60 72 68 68" stroke="#111" strokeWidth="1.6" fill="none" />
      <path d="M60 34 L60 46" stroke="#DC2626" strokeWidth="1.5" />
    </svg>
  );
}

// Rasm mavjudligini bir marta tekshirib, natijani eslab qolamiz (singan rasm ko'rinmasligi uchun)
const probe = new Map<string, Promise<boolean>>();
function imageExists(src: string) {
  if (!probe.has(src)) probe.set(src, new Promise(res => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = src; }));
  return probe.get(src)!;
}

export default function Mascot({ pose = "desk", text, side = "left", id, className = "" }: {
  pose?: MascotPose; text: React.ReactNode; side?: "left" | "right"; id?: string; className?: string;
}) {
  const hideId = id || `${typeof window !== "undefined" ? window.location.pathname : ""}#${pose}`;
  const [hidden, setHidden] = useState(false);
  const [imgOk, setImgOk] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => { setHidden(readHidden().includes(hideId)); const t = setTimeout(() => setShown(true), 150); return () => clearTimeout(t); }, [hideId]);
  useEffect(() => { let on = true; imageExists(`/mascot/${pose}.png`).then(ok => on && setImgOk(ok)); return () => { on = false; }; }, [pose]);
  if (hidden) return null;

  const close = () => { setHidden(true); writeHidden(Array.from(new Set([...readHidden(), hideId]))); };
  const avatar = (
    <div className="shrink-0 w-20 h-24 sm:w-28 sm:h-32">
      {imgOk
        ? <img src={`/mascot/${pose}.png`} alt="UzDrop yordamchisi" onError={() => setImgOk(false)} className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(220,38,38,.35)]" />
        : <Placeholder pose={pose} />}
    </div>
  );
  const bubble = (
    <div className={`relative panel px-4 py-3 text-sm leading-snug max-w-md border-accent/30 ${side === "left" ? "sm:ml-1" : "sm:mr-1"}`}>
      <span className={`hidden sm:block absolute top-6 w-3 h-3 rotate-45 bg-panel border-line ${side === "left" ? "-left-1.5 border-l border-b" : "-right-1.5 border-r border-t"}`} />
      <button onClick={close} aria-label="Yopish" className="absolute right-1.5 top-1 text-muted hover:text-white text-base leading-none">×</button>
      <p className="text-[10px] font-extrabold uppercase text-accent mb-0.5">UzDrop yordamchisi</p>
      <div className="pr-3 text-white/90">{text}</div>
    </div>
  );
  return (
    <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-2 transition-all duration-500 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${side === "right" ? "sm:flex-row-reverse sm:text-right" : ""} ${className}`}>
      {avatar}
      {bubble}
    </div>
  );
}
