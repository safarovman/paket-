"use client";
import { useState } from "react";

/**
 * Akkaunt RASMI atrofidagi 16:9 ramka.
 *  - Bezakli:  /frames/frame-<o'yin>.png
 *  - Oddiy:    /frames/simple/frame-<o'yin>.png
 * PNG 1280x720, o'rtasi shaffof — rasm (16:9) ustiga aynan bir xil o'lchamda qo'yiladi.
 * PNG yuklanmasa — CSS burchakli ramka chiziladi.
 *
 * Ramka qiymati (accounts.frame):
 *   null           — avtomatik: o'yinga mos bezakli ramka
 *   "<o'yin>"      — shu o'yinning bezakli ramkasi (pubg, standoff2, mlbb, freefire, cs2, brawl, default)
 *   "simple-<o'yin>" — oddiy (yupqa neon) ramka
 *   "none"         — ramkasiz
 */
export const FRAME_GAMES = ["pubg", "standoff2", "mlbb", "freefire", "cs2", "brawl", "default"] as const;
const NAMES: Record<string, string> = {
  pubg: "PUBG", standoff2: "Standoff 2", mlbb: "Mobile Legends", freefire: "Free Fire",
  cs2: "CS2", brawl: "Brawl Stars", default: "UzDrop",
};

/** Admin tanlashi mumkin bo'lgan ramkalar ("" = o'yin bo'yicha avtomatik) */
export const FRAME_OPTIONS: { id: string; name: string; group: "auto" | "ornate" | "simple" | "none" }[] = [
  { id: "", name: "Avtomatik", group: "auto" },
  ...FRAME_GAMES.map(g => ({ id: g, name: NAMES[g], group: "ornate" as const })),
  ...FRAME_GAMES.map(g => ({ id: `simple-${g}`, name: NAMES[g], group: "simple" as const })),
  { id: "none", name: "Ramkasiz", group: "none" },
];

const COLORS: Record<string, string> = {
  pubg: "#D4A93C", standoff2: "#FF8A2A", mlbb: "#4F7BFF", freefire: "#FF5A1F",
  cs2: "#9AA6B2", brawl: "#FF4DD2", default: "#FFC83D",
};

/** frame + game → PNG manzili (yoki null = ramkasiz) */
export function frameSrc(game?: string | null, frame?: string | null): { src: string; key: string } | null {
  if (frame === "none") return null;
  const simple = !!frame && frame.startsWith("simple-");
  const raw = frame ? frame.replace(/^simple-/, "") : game || "default";
  const key = (FRAME_GAMES as readonly string[]).includes(raw) ? raw : "default";
  return { src: simple ? `/frames/simple/frame-${key}.png` : `/frames/frame-${key}.png`, key };
}

const failed = new Set<string>();

/** Rasm qutisi (16:9) — ichiga rasm/karusel qo'yiladi, ustiga ramka */
export default function GameFrame({ game, frame, children, className = "" }: {
  game?: string | null; frame?: string | null; children: React.ReactNode; className?: string;
}) {
  const f = frameSrc(game, frame);
  const [bad, setBad] = useState(() => (f ? failed.has(f.src) : false));
  const c = f ? COLORS[f.key] : "#FFC83D";

  return (
    <div className={`relative aspect-video ${className}`}>
      {children}
      {f && !bad && (
        <img key={f.src} src={f.src} alt="" aria-hidden loading="lazy" draggable={false}
          onError={() => { failed.add(f.src); setBad(true); }}
          className="pointer-events-none absolute inset-0 w-full h-full z-10 select-none" style={{ objectFit: "fill" }} />
      )}
      {f && bad && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-lg"
          style={{ border: `2px solid ${c}99`, boxShadow: `inset 0 0 14px ${c}55, 0 0 12px ${c}33` }} />
      )}
    </div>
  );
}
