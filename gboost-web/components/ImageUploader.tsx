"use client";
import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";
import { errText } from "@/lib/supabase";

/** Admin uchun: bir nechta rasm yuklash, tartiblash (birinchisi — muqova), o'chirish */
export default function ImageUploader({ value, onChange, max = 8 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);

  const add = async (files: FileList | File[]) => {
    setErr("");
    const list = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, max - value.length);
    if (!list.length) return;
    setBusy(list.length);
    const urls: string[] = [];
    for (const f of list) {
      try { urls.push(await uploadImage(f)); } catch (e) { setErr(errText(e)); }
      setBusy(b => b - 1);
    }
    onChange([...value, ...urls]);
  };
  const move = (i: number, d: number) => { const v = [...value]; const j = i + d; if (j < 0 || j >= v.length) return; [v[i], v[j]] = [v[j], v[i]]; onChange(v); };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((u, i) => (
          <div key={u} className="relative aspect-video rounded-lg overflow-hidden border border-line group">
            <img src={u} alt="" className="w-full h-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 chip bg-accent text-[#03140A]">Muqova</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
              <button type="button" onClick={() => move(i, -1)} className="px-2 py-1">◀</button>
              <button type="button" onClick={() => onChange(value.filter(x => x !== u))} className="px-2 py-1 text-lose font-bold">✕</button>
              <button type="button" onClick={() => move(i, 1)} className="px-2 py-1">▶</button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => input.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
            className={`aspect-video rounded-lg border-2 border-dashed grid place-items-center text-xs font-bold text-muted transition-colors ${drag ? "border-accent text-accent" : "border-line hover:border-violet"}`}>
            {busy ? `Yuklanmoqda… (${busy})` : "＋ Rasm qo'shish"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      <p className="text-[11px] text-muted mt-1.5">Skrinshotlarni tashlang yoki tanlang. Birinchi rasm — muqova. Rasmlar avtomatik kichraytiriladi.</p>
      {err && <p className="text-lose text-xs font-bold mt-1">{err}</p>}
    </div>
  );
}
