import { supabase } from "@/lib/supabase";

/**
 * Rasm ombori:
 *  - asosiy: Cloudflare R2 (10 GB bepul, trafik bepul) — Supabase Edge Function "r2-upload" orqali
 *  - R2 hali sozlanmagan bo'lsa (funksiya yo'q) → avtomatik Supabase Storage ("account-images", 1 GB)
 *  - NEXT_PUBLIC_STORAGE=supabase → faqat Supabase Storage
 * Ikkalasida ham faqat admin yuklay oladi (server tomonda tekshiriladi).
 */
const USE_R2 = process.env.NEXT_PUBLIC_STORAGE !== "supabase";
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
  if (error) throw Object.assign(new Error(data?.error || error.message || "Yuklash havolasini olib bo'lmadi"), { noR2: true });
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
  if (!USE_R2) return uploadSupabase(blob);
  try {
    return await uploadR2(blob);
  } catch (e: any) {
    // R2 funksiyasi hali joylanmagan bo'lsa — Supabase Storage'ga
    if (e?.noR2 && !String(e.message).includes("admin")) return uploadSupabase(blob);
    throw e;
  }
}
