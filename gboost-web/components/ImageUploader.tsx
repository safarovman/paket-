"use client";
import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";
import { errText } from "@/lib/supabase";
import ImageCropper, { cropFile, type CropParams } from "@/components/admin/ImageCropper";
import Icon from "@/components/Icon";

/** Yuklangan rasmni (URL) qayta kesish uchun faylga aylantiradi */
async function urlToFile(url: string): Promise<File> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Rasmni olib bo'lmadi (${r.status})`);
  const b = await r.blob();
  return new File([b], url.split("/").pop()?.split("?")[0] || "rasm.jpg", { type: b.type || "image/jpeg" });
}

/**
 * Admin uchun: bir nechta rasm yuklash, tartiblash (birinchisi — muqova), o'chirish
 * va oldin yuklangan rasmni QAYTA KESISH (kattalashtirish / kichiklashtirish / surish).
 * Bitta rasmda qilingan sozlamani qolgan rasmlarga ham bir bosishda qo'llash mumkin.
 */
export default function ImageUploader({ value, onChange, max = 8, game = "other", frame = null }: {
  value: string[]; onChange: (v: string[]) => void; max?: number; game?: string; frame?: string | null;
}) {
  // Yangi rasmlar navbati: har biri kesish oynasidan o'tadi
  const [queue, setQueue] = useState<File[]>([]);
  const [qi, setQi] = useState(0);
  const [done, setDone] = useState<File[]>([]);
  // Mavjud rasmni tahrirlash
  const [edit, setEdit] = useState<{ i: number; file: File } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);

  // 1) Fayllar tanlanadi → kesish navbatiga
  const add = (files: FileList | File[]) => {
    setErr("");
    const list = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, max - value.length);
    if (!list.length) return;
    setDone([]); setQi(0); setQueue(list);
  };

  // 2) Kesilganlar yuklanadi
  const upload = async (files: File[]) => {
    if (!files.length) return;
    const urls: string[] = [];
    for (let k = 0; k < files.length; k++) {
      setBusy(`Yuklanmoqda… ${k + 1}/${files.length}`);
      try { urls.push(await uploadImage(files[k])); } catch (e) { setErr(errText(e)); }
    }
    setBusy("");
    onChange([...value, ...urls]);
  };

  const next = async (out: File | null, params?: CropParams, applyRest?: boolean) => {
    let acc = out ? [...done, out] : done;
    // Shu sozlamani navbatdagi qolgan rasmlarga ham qo'llash
    if (out && params && applyRest) {
      const rest = queue.slice(qi + 1);
      setQueue([]); setDone([]); setQi(0);
      setBusy("Kesilmoqda…");
      for (const f of rest) { try { acc = [...acc, await cropFile(f, params)]; } catch (e) { setErr(errText(e)); } }
      upload(acc);
      return;
    }
    if (qi + 1 < queue.length) { setDone(acc); setQi(qi + 1); return; }
    setQueue([]); setDone([]); setQi(0);
    upload(acc);
  };

  // 3) Mavjud rasmni tahrirlash
  const startEdit = async (i: number) => {
    setErr(""); setBusy("Rasm ochilmoqda…");
    try { setEdit({ i, file: await urlToFile(value[i]) }); }
    catch (e) { setErr(errText(e)); }
    setBusy("");
  };

  const saveEdit = async (out: File, params: CropParams, applyRest: boolean) => {
    if (!edit) return;
    const i = edit.i; setEdit(null); setErr("");
    const v = [...value];
    try {
      setBusy("Saqlanmoqda…");
      v[i] = await uploadImage(out);
      if (applyRest) {
        const others = v.map((_, k) => k).filter(k => k !== i);
        for (let n = 0; n < others.length; n++) {
          const k = others[n];
          setBusy(`Qolgan rasmlar to'g'rilanmoqda… ${n + 1}/${others.length}`);
          try { v[k] = await uploadImage(await cropFile(await urlToFile(value[k]), params)); }
          catch (e) { setErr(errText(e)); }
        }
      }
      onChange(v);
    } catch (e) { setErr(errText(e)); }
    setBusy("");
  };

  const move = (i: number, d: number) => { const v = [...value]; const j = i + d; if (j < 0 || j >= v.length) return; [v[i], v[j]] = [v[j], v[i]]; onChange(v); };
  const ctl = "flex-1 py-1.5 grid place-items-center hover:bg-white/10 disabled:opacity-30";

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {value.map((u, i) => (
          <div key={u} className="rounded-lg overflow-hidden border border-line bg-panel2">
            <div className="relative aspect-video">
              <img src={u} alt="" className="w-full h-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 chip !text-[9px] bg-accent text-[#1B1400]">Muqova</span>}
            </div>
            <div className="flex text-xs border-t border-line">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || !!busy} className={ctl} aria-label="Chapga">
                <Icon name="arrow" className="w-3.5 h-3.5 rotate-180" />
              </button>
              <button type="button" onClick={() => startEdit(i)} disabled={!!busy} className={`${ctl} text-accent font-bold`} title="Kesish / kattalashtirish">
                <span className="flex items-center gap-1"><Icon name="crop" className="w-3.5 h-3.5" />Tahrirlash</span>
              </button>
              <button type="button" onClick={() => onChange(value.filter(x => x !== u))} disabled={!!busy} className={`${ctl} text-lose`} aria-label="O'chirish">
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1 || !!busy} className={ctl} aria-label="O'ngga">
                <Icon name="arrow" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => input.current?.click()} disabled={!!busy}
            onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
            className={`aspect-video rounded-lg border-2 border-dashed grid place-items-center text-xs font-bold text-muted transition-colors ${drag ? "border-accent text-accent" : "border-line hover:border-violet"}`}>
            {busy || "+ Rasm qo'shish"}
          </button>
        )}
      </div>
      {busy && value.length >= max && <p className="text-xs text-accent font-bold mt-1">{busy}</p>}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      <p className="text-[11px] text-muted mt-1.5">
        Skrinshotlarni tashlang yoki tanlang — har biri saytdagi o&apos;lchamga (16:9) moslab kesiladi. Birinchi rasm — muqova.
        Yuklangan rasmni to&apos;g&apos;rilash uchun <b className="text-accent">Tahrirlash</b>ni bosing.
      </p>
      {err && <p className="text-lose text-xs font-bold mt-1">{err}</p>}
      {queue[qi] && (
        <ImageCropper key={`q${qi}`} file={queue[qi]} game={game} frame={frame} index={qi} total={queue.length}
          restCount={queue.length - qi - 1}
          onDone={(out, p, all) => next(out, p, all)} onCancel={() => next(null)} />
      )}
      {edit && (
        <ImageCropper key={`e${edit.i}`} file={edit.file} game={game} frame={frame} index={0} total={1}
          title={`Rasmni tahrirlash (${edit.i + 1}-rasm)`} restCount={value.length - 1}
          onDone={saveEdit} onCancel={() => setEdit(null)} />
      )}
    </div>
  );
}
