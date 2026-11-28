"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import GameFrame from "@/components/GameFrame";
import { IMAGE_ASPECT, IMAGE_OUT_W, game as gameInfo } from "@/lib/uzdrop";

/** Kesish sozlamasi: zoom (1 = ramkani to'liq qoplaydi, <1 — kichikroq), siljish — oyna o'lchamiga nisbatan */
export type CropParams = { zoom: number; px: number; py: number };

/** Rasmni berilgan sozlama bilan 16:9 kanvasga chizadi. Bo'sh joy — rasmning xira nusxasi. */
export function drawCrop(cv: HTMLCanvasElement, img: HTMLImageElement | ImageBitmap, outW: number, p: CropParams) {
  const outH = Math.round(outW / IMAGE_ASPECT);
  cv.width = outW; cv.height = outH;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  const iw = img.width, ih = img.height;
  const cover = Math.max(outW / iw, outH / ih);
  // Fon: xira nusxa (rasm kichraytirilganda bo'sh joy qolmasin)
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, outW, outH);
  if (p.zoom < 1) {
    ctx.save();
    if ("filter" in ctx) ctx.filter = `blur(${Math.round(outW / 40)}px) brightness(.6)`;
    const cw = iw * cover * 1.1, ch = ih * cover * 1.1;
    ctx.drawImage(img, (outW - cw) / 2, (outH - ch) / 2, cw, ch);
    ctx.restore();
  }
  const sc = cover * p.zoom, dw = iw * sc, dh = ih * sc;
  ctx.drawImage(img, outW / 2 + p.px * outW - dw / 2, outH / 2 + p.py * outH - dh / 2, dw, dh);
}

/** Faylni sozlama bilan kesib, yangi JPEG fayl qaytaradi (oynasiz — "hammasiga qo'llash" uchun) */
export async function cropFile(file: File, p: CropParams): Promise<File> {
  const bmp = await createImageBitmap(file);
  const cv = document.createElement("canvas");
  drawCrop(cv, bmp, IMAGE_OUT_W, p);
  const b: Blob = await new Promise((res, rej) => cv.toBlob(x => (x ? res(x) : rej(new Error("Rasmni kesib bo'lmadi"))), "image/jpeg", 0.92));
  return new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

/**
 * Instagram'dagidek rasm kesish oynasi.
 * Admin skrinshotni surib / kattalashtirib, aynan saytdagi karta o'lchamiga (16:9) moslaydi.
 * O'ng tomonda — saytdagi kartada (ramka bilan) qanday ko'rinishi.
 */
export default function ImageCropper({ file, game, frame, index, total, onDone, onCancel, restCount = 0, title }: {
  file: File; game: string; frame?: string | null; index: number; total: number;
  onDone: (out: File, params: CropParams, applyRest: boolean) => void; onCancel: () => void;
  /** Shu sozlamani qo'llash mumkin bo'lgan qolgan rasmlar soni */
  restCount?: number; title?: string;
}) {
  const [applyRest, setApplyRest] = useState(restCount > 0);
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
    const mx = Math.abs(dw - boxW) / 2, my = Math.abs(dh - boxH) / 2;
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  }, [dw, dh, boxW, boxH]);
  useEffect(() => { setPos(p => clamp(p)); }, [clamp]);

  // Natijani chizish (ko'rinish va saqlash uchun bir xil hisob)
  const params: CropParams = { zoom, px: pos.x / boxW, py: pos.y / boxH };
  const draw = useCallback((cv: HTMLCanvasElement, outW: number) => {
    if (!img) return;
    drawCrop(cv, img, outW, { zoom, px: pos.x / boxW, py: pos.y / boxH });
  }, [img, boxW, boxH, zoom, pos]);

  useEffect(() => { if (preview.current) draw(preview.current, 400); }, [draw]);

  const save = () => {
    const cv = document.createElement("canvas");
    draw(cv, IMAGE_OUT_W);
    cv.toBlob(b => {
      if (!b) return;
      onDone(new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }), params, restCount > 0 && applyRest);
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
  const onWheel = (e: React.WheelEvent) => setZoom(z => Math.min(4, Math.max(0.5, z - e.deltaY * 0.0015)));

  const g = gameInfo(game);

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm grid place-items-center p-3 overflow-y-auto">
      <div className="panel w-full max-w-4xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-black uppercase text-sm">{title ?? "Rasmni moslash"} {total > 1 && <span className="text-muted">({index + 1}/{total})</span>}</p>
          <button onClick={onCancel} className="text-muted hover:text-white text-xl leading-none" aria-label="Yopish">×</button>
        </div>

        <div className="grid md:grid-cols-[1fr_220px] gap-5">
          {/* Kesish maydoni */}
          <div>
            <div ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => { drag.current = null; }} onWheel={onWheel}
              className="relative w-full overflow-hidden rounded-xl bg-black cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ aspectRatio: String(IMAGE_ASPECT) }}>
              {img && zoom < 1 && (
                <img src={img.src} alt="" aria-hidden draggable={false} className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl brightness-[.6] pointer-events-none" />
              )}
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
              <span className="text-[11px] font-bold text-muted">Kichik</span>
              <input type="range" min={0.5} max={4} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-[#FFC83D]" />
              <span className="text-[11px] font-bold text-muted">Katta</span>
              <button type="button" onClick={() => { setZoom(1); setPos({ x: 0, y: 0 }); }} className="btn-ghost !py-1.5 !px-3 !text-xs">Qayta</button>
            </div>
            <p className="text-[11px] text-muted mt-1">Rasmni sichqoncha yoki barmoq bilan suring, g&apos;ildirak / slayder bilan kattalashtiring yoki kichiklashtiring (bo&apos;sh joy xira fon bilan to&apos;ladi). Sariq chiziq ichidagi qism saytda ko&apos;rinadi.</p>
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
                  <canvas ref={preview} className="absolute inset-0 w-full h-full block object-cover" />
                </GameFrame>
                <p className="font-extrabold text-sm mt-2">Akkaunt nomi</p>
                <p className="text-xs text-muted">#1001 Rank</p>
                <p className="font-black text-accent mt-1">150 000 so&apos;m</p>
              </div>
            </div>
          </div>
        </div>

        {restCount > 0 && (
          <label className="mt-4 flex items-center gap-2.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={applyRest} onChange={e => setApplyRest(e.target.checked)} className="w-4 h-4 accent-[#FFC83D]" />
            <span className="text-sm"><b>Qolgan {restCount} ta rasmga ham</b> xuddi shu o&apos;lcham va joylashuvni qo&apos;llash</span>
          </label>
        )}
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onCancel} className="btn-ghost">Bekor qilish</button>
          <button onClick={save} disabled={!img} className="btn-accent">Saqlash</button>
        </div>
      </div>
    </div>
  );
}
