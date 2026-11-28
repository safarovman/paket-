"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Avtomatik aylanadigan rasmlar (3 soniyada almashadi, sichqoncha ustida to'xtaydi,
 * telefonda surib almashtiriladi). Bitta rasm bo'lsa — oddiy rasm.
 * index/onIndex berilsa — tashqaridan boshqariladi (masalan, kichik rasmlar bilan sinxron).
 */
/** Rasm butunligicha (qirqilmasdan) ko'rinadi, bo'sh joy o'sha rasmning xira nusxasi bilan to'ladi */
function Slide({ src, alt, eager, className = "" }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <img src={src} alt="" aria-hidden loading={eager ? "eager" : "lazy"} draggable={false}
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60" />
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} draggable={false}
        className="relative w-full h-full object-contain" />
    </div>
  );
}

export default function ImageCarousel({ images, className = "", interval = 3000, arrows = false, index, onIndex, alt = "", dots = true }: {
  images: string[]; className?: string; interval?: number; arrows?: boolean;
  index?: number; onIndex?: (i: number) => void; alt?: string; dots?: boolean;
}) {
  const list = images.filter(Boolean);
  const [inner, setInner] = useState(0);
  const cur = (index ?? inner) % Math.max(list.length, 1);
  const set = (i: number) => { const n = (i + list.length) % list.length; onIndex ? onIndex(n) : setInner(n); };
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const curRef = useRef(cur); curRef.current = cur;

  useEffect(() => {
    if (list.length < 2 || paused) return;
    const t = setInterval(() => set(curRef.current + 1), interval);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, paused, interval, onIndex]);

  if (list.length === 0) return null;
  if (list.length === 1) return <div className={`relative w-full h-full ${className}`}><Slide src={list[0]} alt={alt} eager /></div>;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={e => { touch.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={e => {
        const s = touch.current; touch.current = null; setPaused(false);
        if (s == null) return;
        const dx = e.changedTouches[0].clientX - s;
        if (Math.abs(dx) > 30) set(cur + (dx < 0 ? 1 : -1));
      }}>
      {list.map((u, i) => (
        <Slide key={u + i} src={u} alt={alt} eager={i === 0}
          className={`transition-opacity duration-700 ${i === cur ? "opacity-100" : "opacity-0"}`} />
      ))}
      {arrows && (
        <>
          <button type="button" onClick={e => { e.stopPropagation(); set(cur - 1); }} aria-label="Oldingi"
            className="absolute left-[6%] top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 text-white grid place-items-center hover:bg-black/80">‹</button>
          <button type="button" onClick={e => { e.stopPropagation(); set(cur + 1); }} aria-label="Keyingi"
            className="absolute right-[6%] top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 text-white grid place-items-center hover:bg-black/80">›</button>
        </>
      )}
      {dots && <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 z-20">
        {list.map((_, i) => (
          <button key={i} type="button" aria-label={`${i + 1}-rasm`} onClick={e => { e.stopPropagation(); set(i); }}
            className={`h-1.5 rounded-full transition-all ${i === cur ? "w-4 bg-accent" : "w-1.5 bg-white/50"}`} />
        ))}
      </div>}
    </div>
  );
}
