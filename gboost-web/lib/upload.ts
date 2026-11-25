import { supabase } from "@/lib/supabase";

const BUCKET = "account-images";

/** Rasmni brauzerda kichraytiradi (max 1280px, WebP ~80%) — Supabase'ning bepul 1 GB joyini tejaydi */
async function compress(file: File, max = 1280): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("Rasmni o'qib bo'lmadi"))), "image/webp", 0.8));
}

/** Rasmni yuklaydi va ochiq URL qaytaradi (faqat admin yuklay oladi) */
export async function uploadImage(file: File): Promise<string> {
  const blob = await compress(file);
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Ochiq URL'dan faylni o'chiradi (tahrirda rasm olib tashlanganda) */
export async function deleteImage(url: string) {
  const i = url.indexOf(`/${BUCKET}/`);
  if (i < 0) return;
  await supabase.storage.from(BUCKET).remove([url.slice(i + BUCKET.length + 2)]);
}
