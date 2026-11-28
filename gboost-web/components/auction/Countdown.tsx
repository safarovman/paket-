"use client";
import { useEffect, useState } from "react";

/** Jonli teskari sanoq: "2k 03:14:09" / "04:59" */
export default function Countdown({ to, onEnd }: { to: string; onEnd?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, new Date(to).getTime() - now);
  useEffect(() => { if (left === 0) onEnd?.(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [left === 0]);

  if (left === 0) return <span className="font-black text-lose">Tugadi</span>;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const urgent = s < 120;
  return (
    <span className={`font-black font-mono tabular-nums ${urgent ? "text-lose animate-pulse" : "text-accent"}`}>
      {d > 0 && `${d}k `}{(d > 0 || h > 0) && `${pad(h)}:`}{pad(m)}:{pad(sec)}
    </span>
  );
}
