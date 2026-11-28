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

/** Ramkaning ichki shaffof oynasi (%): rasm aynan shu joyga joylashadi, ramka uni yopmaydi.
 *  [chap, o'ng, tepa, past] — PNG lardan o'lchangan, chetlari ramka ostiga ozgina kiradi. */
const INSET: Record<string, [number, number, number, number]> = {
  pubg: [5.4, 5.4, 11.6, 9.4], standoff2: [5, 5, 10.2, 10.3], mlbb: [5.8, 5.8, 15.6, 15.6], freefire: [5.9, 5.9, 11.6, 11.5],
  cs2: [4.3, 4.3, 7, 7.2], brawl: [8.2, 8.2, 14.4, 13.6], default: [4.1, 4.1, 7.3, 7.3],
};
const SIMPLE_INSET: [number, number, number, number] = [3.8, 3.8, 6.6, 6.7];
export function frameInset(game?: string | null, frame?: string | null): [number, number, number, number] {
  const f = frameSrc(game, frame);
  if (!f) return [0, 0, 0, 0];
  return frame?.startsWith("simple-") ? SIMPLE_INSET : INSET[f.key] ?? INSET.default;
}

/** Rasm qutisi (16:9) — ichiga rasm/karusel qo'yiladi, ustiga ramka */
export default function GameFrame({ game, frame, children, className = "" }: {
  game?: string | null; frame?: string | null; children: React.ReactNode; className?: string;
}) {
  const f = frameSrc(game, frame);
  const [bad, setBad] = useState(() => (f ? failed.has(f.src) : false));
  const c = f ? COLORS[f.key] : "#FFC83D";
  const [l, r, t, b] = frameInset(game, frame);

  return (
    <div className={`relative aspect-video ${className}`}>
      {/* Rasm — ramka ichidagi oynada */}
      <div className="absolute overflow-hidden" style={{ left: `${l}%`, right: `${r}%`, top: `${t}%`, bottom: `${b}%` }}>
        {children}
      </div>
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
