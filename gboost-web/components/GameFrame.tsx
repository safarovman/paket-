"use client";
import { useState } from "react";

/**
 * O'yinga mos bezakli ramka.
 * Avval /frames/frame-<game>.png (keyin frame-default.png) rasmini ustiga qo'yadi
 * (3:4 vertikal PNG, o'rtasi shaffof). Rasm yo'q bo'lsa — CSS/SVG ramka chiziladi.
 */
type Theme = { c1: string; c2: string; glow: string; kind: "rivet" | "tactical" | "ornate" | "fire" | "steel" | "cartoon" | "default" };

const THEMES: Record<string, Theme> = {
  pubg:      { c1: "#D4A93C", c2: "#5B6B2F", glow: "rgba(212,169,60,.35)", kind: "rivet" },
  standoff2: { c1: "#FF8A2A", c2: "#7A8794", glow: "rgba(255,138,42,.35)", kind: "tactical" },
  mlbb:      { c1: "#F2C94C", c2: "#2F6BFF", glow: "rgba(47,107,255,.35)", kind: "ornate" },
  freefire:  { c1: "#FF5A1F", c2: "#D7261E", glow: "rgba(255,90,31,.4)", kind: "fire" },
  cs2:       { c1: "#FF9A3D", c2: "#9AA6B2", glow: "rgba(154,166,178,.3)", kind: "steel" },
  brawl:     { c1: "#FFD43B", c2: "#FF4DD2", glow: "rgba(255,77,210,.35)", kind: "cartoon" },
  default:   { c1: "#FFC83D", c2: "#DC2626", glow: "rgba(220,38,38,.3)", kind: "default" },
};

function Corner({ t, rot }: { t: Theme; rot: number }) {
  const s = { transform: `rotate(${rot}deg)` };
  const common = "w-7 h-7";
  switch (t.kind) {
    case "rivet": return (
      <svg viewBox="0 0 28 28" className={common} style={s}>
        <path d="M2 26V8L8 2h18" fill="none" stroke={t.c1} strokeWidth="3" />
        <path d="M6 26V10l4-4h16" fill="none" stroke={t.c2} strokeWidth="2" />
        <circle cx="5" cy="5" r="2.2" fill={t.c1} /><circle cx="14" cy="5" r="1.4" fill={t.c1} /><circle cx="5" cy="14" r="1.4" fill={t.c1} />
      </svg>);
    case "tactical": return (
      <svg viewBox="0 0 28 28" className={common} style={s}>
        <path d="M2 18V2h16" fill="none" stroke={t.c1} strokeWidth="3.5" />
        <path d="M8 2l-6 6" stroke={t.c2} strokeWidth="2" /><path d="M7 7h7M7 7v7" stroke={t.c2} strokeWidth="1.5" />
      </svg>);
    case "ornate": return (
      <svg viewBox="0 0 28 28" className={common} style={s}>
        <path d="M2 26C2 12 12 2 26 2" fill="none" stroke={t.c1} strokeWidth="2.5" />
        <path d="M6 26C6 15 15 6 26 6" fill="none" stroke={t.c2} strokeWidth="1.5" />
        <path d="M4 4l5 2-2 3z" fill={t.c1} /><circle cx="11" cy="11" r="2" fill={t.c1} />
      </svg>);
    case "fire": return (
      <svg viewBox="0 0 28 28" className={common} style={s}>
        <path d="M2 26V4h22" fill="none" stroke={t.c1} strokeWidth="3" />
        <path d="M4 18c2-3 0-5 3-8 0 3 2 3 2 6M12 4c3 2 5 0 8 3-3 0-3 2-6 2" fill={t.c2} />
      </svg>);
    case "steel": return (
      <svg viewBox="0 0 28 28" className={common} style={s}>
        <path d="M2 24V6l4-4h18" fill="none" stroke={t.c2} strokeWidth="3" />
        <path d="M2 10h4M10 2v4" stroke={t.c1} strokeWidth="2.5" /><rect x="7" y="7" width="4" height="4" fill={t.c1} />
      </svg>);
    case "cartoon": return (
      <svg viewBox="0 0 28 28" className={common} style={s}>
        <path d="M3 25V9a6 6 0 0 1 6-6h16" fill="none" stroke="#111" strokeWidth="5" strokeLinecap="round" />
        <path d="M3 25V9a6 6 0 0 1 6-6h16" fill="none" stroke={t.c1} strokeWidth="3" strokeLinecap="round" />
        <path d="M9 10l2-5 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3z" fill={t.c2} transform="scale(.6) translate(4 4)" />
      </svg>);
    default: return (
      <svg viewBox="0 0 28 28" className={common} style={s}>
        <path d="M2 22V2h20" fill="none" stroke={t.c1} strokeWidth="3" />
        <path d="M7 16V7h9" fill="none" stroke={t.c2} strokeWidth="2" />
      </svg>);
  }
}

// Yuklanmagan ramka rasmlarini eslab qolamiz — har kartada qayta-qayta 404 so'ramaslik uchun
const failed = new Set<string>();
const startStage = (key: string): 0 | 1 | 2 =>
  !failed.has(`/frames/frame-${key}.png`) ? 0 : !failed.has("/frames/frame-default.png") ? 1 : 2;

/** Admin tanlashi mumkin bo'lgan ramkalar ("" = o'yin bo'yicha avtomatik) */
export const FRAME_OPTIONS: { id: string; name: string }[] = [
  { id: "", name: "Avtomatik (o'yin bo'yicha)" },
  { id: "pubg", name: "PUBG" }, { id: "standoff2", name: "Standoff 2" }, { id: "mlbb", name: "Mobile Legends" },
  { id: "freefire", name: "Free Fire" }, { id: "cs2", name: "CS2" }, { id: "brawl", name: "Brawl Stars" },
  { id: "default", name: "UzDrop" }, { id: "none", name: "Ramkasiz" },
];

export default function GameFrame({ game, frame, children, className = "" }: { game?: string | null; frame?: string | null; children: React.ReactNode; className?: string }) {
  if (frame === "none") return <div className={`relative ${className}`}>{children}</div>;
  return <Framed key={frame || game || "default"} game={frame || game} className={className}>{children}</Framed>;
}

function Framed({ game, children, className = "" }: { game?: string | null; children: React.ReactNode; className?: string }) {
  const key = game && THEMES[game] ? game : "default";
  const t = THEMES[key];
  // 0 = o'yinga xos PNG, 1 = umumiy PNG, 2 = CSS ramka
  const [stage, setStage] = useState<0 | 1 | 2>(() => startStage(key));
  const src = stage === 0 ? `/frames/frame-${key}.png` : "/frames/frame-default.png";

  return (
    <div className={`relative ${className}`}>
      {children}
      {stage < 2 ? (
        <img src={src} alt="" aria-hidden loading="lazy" draggable={false}
          onError={() => { failed.add(src); setStage(s => (s === 0 && key !== "default" && !failed.has("/frames/frame-default.png") ? 1 : 2)); }}
          className="pointer-events-none absolute inset-0 w-full h-full z-10" style={{ objectFit: "fill" }} />
      ) : null}
      {stage === 2 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
          style={{
            border: `1.5px solid ${t.c1}55`,
            boxShadow: `inset 0 0 0 1px ${t.c2}33, inset 0 0 18px ${t.glow}`,
            background: t.kind === "fire" ? `linear-gradient(to top, ${t.c2}22, transparent 30%)` : undefined,
          }}>
          <div className="absolute left-0.5 top-0.5"><Corner t={t} rot={0} /></div>
          <div className="absolute right-0.5 top-0.5"><Corner t={t} rot={90} /></div>
          <div className="absolute right-0.5 bottom-0.5"><Corner t={t} rot={180} /></div>
          <div className="absolute left-0.5 bottom-0.5"><Corner t={t} rot={270} /></div>
        </div>
      )}
    </div>
  );
}
