import { supabase } from "@/lib/supabase";

/**
 * Rasm ombori:
 *  - NEXT_PUBLIC_STORAGE=r2  → Cloudflare R2 (10 GB bepul, trafik bepul) — Supabase Edge Function "r2-upload" orqali
 *  - aks holda               → Supabase Storage ("account-images" bucket, 1 GB bepul)
 * Ikkalasida ham faqat admin yuklay oladi (server tomonda tekshiriladi).
 */
const USE_R2 = process.env.NEXT_PUBLIC_STORAGE === "r2";
const BUCKET = "account-images";

/** Rasmni brauzerda kichraytiradi (max 1280px, WebP ~80%) — joy va trafikni tejaydi */
async function compress(file: File, max = 1280): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("Rasmni o'qib bo'lmadi"))), "image/webp", 0.8));
}

async function uploadR2(blob: Blob): Promise<string> {
  const { data, error } = await supabase.functions.invoke("r2-upload", { body: { contentType: "image/webp" } });
  if (error) throw new Error(data?.error || error.message || "Yuklash havolasini olib bo'lmadi");
  const put = await fetch(data.uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/webp" } });
  if (!put.ok) throw new Error(`R2 yuklash xatosi (${put.status}) — R2 bucket CORS sozlamasini tekshiring`);
  return data.publicUrl as string;
}

async function uploadSupabase(blob: Blob): Promise<string> {
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Rasmni yuklaydi va ochiq URL qaytaradi */
export async function uploadImage(file: File): Promise<string> {
  const blob = await compress(file);
  return USE_R2 ? uploadR2(blob) : uploadSupabase(blob);
}
