"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import GameFrame from "@/components/GameFrame";
import { IMAGE_ASPECT, IMAGE_OUT_W, game as gameInfo } from "@/lib/uzdrop";

/**
 * Instagram'dagidek rasm kesish oynasi.
 * Admin skrinshotni surib / kattalashtirib, aynan saytdagi karta o'lchamiga (16:9) moslaydi.
 * O'ng tomonda — saytdagi kartada (ramka bilan) qanday ko'rinishi.
 */
export default function ImageCropper({ file, game, frame, index, total, onDone, onCancel }: {
  file: File; game: string; frame?: string | null; index: number; total: number;
  onDone: (out: File) => void; onCancel: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });   // rasm markazining ko'rinish markazidan siljishi (px, box o'lchamida)
  const [boxW, setBoxW] = useState(480);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const boxH = boxW / IMAGE_ASPECT;

  // Faylni yuklash
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); setZoom(1); setPos({ x: 0, y: 0 }); };
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Oyna o'lchami
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el); setBoxW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Rasm o'lchami (cover * zoom)
  const scale = img ? Math.max(boxW / img.width, boxH / img.height) * zoom : 1;
  const dw = img ? img.width * scale : 0, dh = img ? img.height * scale : 0;

  // Bo'sh joy qolmasligi uchun chegaralash
  const clamp = useCallback((p: { x: number; y: number }) => {
    const mx = Math.max(0, (dw - boxW) / 2), my = Math.max(0, (dh - boxH) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  }, [dw, dh, boxW, boxH]);
  useEffect(() => { setPos(p => clamp(p)); }, [clamp]);

  // Natijani chizish (ko'rinish va saqlash uchun bir xil hisob)
  const draw = useCallback((cv: HTMLCanvasElement, outW: number) => {
    if (!img) return;
    const outH = Math.round(outW / IMAGE_ASPECT);
    cv.width = outW; cv.height = outH;
    const k = outW / boxW;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingQuality = "high";
    const x = (boxW / 2 + pos.x - dw / 2) * k, y = (boxH / 2 + pos.y - dh / 2) * k;
    ctx.drawImage(img, x, y, dw * k, dh * k);
  }, [img, boxW, boxH, dw, dh, pos]);

  useEffect(() => { if (preview.current) draw(preview.current, 400); }, [draw]);

  const save = () => {
    const cv = document.createElement("canvas");
    draw(cv, IMAGE_OUT_W);
    cv.toBlob(b => {
      if (!b) return;
      onDone(new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos(clamp({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y }));
  };
  const onWheel = (e: React.WheelEvent) => setZoom(z => Math.min(4, Math.max(1, z - e.deltaY * 0.0015)));

  const g = gameInfo(game);

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm grid place-items-center p-3 overflow-y-auto">
      <div className="panel w-full max-w-4xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-black uppercase text-sm">✂️ Rasmni moslash {total > 1 && <span className="text-muted">({index + 1}/{total})</span>}</p>
          <button onClick={onCancel} className="text-muted hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="grid md:grid-cols-[1fr_220px] gap-5">
          {/* Kesish maydoni */}
          <div>
            <div ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => { drag.current = null; }} onWheel={onWheel}
              className="relative w-full overflow-hidden rounded-xl bg-black cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ aspectRatio: String(IMAGE_ASPECT) }}>
              {img && (
                <img src={img.src} alt="" draggable={false} className="absolute max-w-none pointer-events-none"
                  style={{ width: dw, height: dh, left: boxW / 2 + pos.x - dw / 2, top: boxH / 2 + pos.y - dh / 2 }} />
              )}
              {/* Instagram'dagidek 3x3 to'r */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/15" />)}
              </div>
              <div className="absolute inset-0 pointer-events-none ring-2 ring-accent/70 rounded-xl" />
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-muted">🔍</span>
              <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-[#FFC83D]" />
              <button type="button" onClick={() => { setZoom(1); setPos({ x: 0, y: 0 }); }} className="btn-ghost !py-1.5 !px-3 !text-xs">Qayta</button>
            </div>
            <p className="text-[11px] text-muted mt-1">Rasmni sichqoncha yoki barmoq bilan suring, g&apos;ildirak / slayder bilan kattalashtiring. Sariq chiziq ichidagi qism saytda ko&apos;rinadi.</p>
          </div>

          {/* Saytda qanday ko'rinadi */}
          <div>
            <p className="label">Saytda shunday ko&apos;rinadi</p>
            <div>
              <div className="panel p-3 relative overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <span className="chip bg-bg/60 text-muted">{g.icon} {g.name}</span>
                  <span className="chip bg-accent/15 text-accent">Namuna</span>
                </div>
                <GameFrame game={game} frame={frame ?? null} className="rounded-lg overflow-hidden">
                  <canvas ref={preview} className="absolute inset-0 w-full h-full rounded-lg block" />
                </GameFrame>
                <p className="font-extrabold text-sm mt-2">Akkaunt nomi</p>
                <p className="text-xs text-muted">#1001 Rank</p>
                <p className="font-black text-accent mt-1">150 000 so&apos;m</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onCancel} className="btn-ghost">Bekor qilish</button>
          <button onClick={save} disabled={!img} className="btn-accent">✓ Saqlash va yuklash</button>
        </div>
      </div>
    </div>
  );
}
