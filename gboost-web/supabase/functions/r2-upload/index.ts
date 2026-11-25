// Supabase Edge Function: admin uchun Cloudflare R2 ga yuklash havolasini (presigned URL) beradi.
// R2 kalitlari faqat shu yerda (Supabase Secrets) — saytning kodida hech qachon ko'rinmaydi.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL (masalan https://img.uzdrop.uz)
// Deploy:  supabase functions deploy r2-upload
import { createClient } from "jsr:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST kerak" }, 405);

  // 1) So'rov yuborgan odam haqiqatan adminmi — uning o'z tokeni bilan bazadan so'raymiz
  const auth = req.headers.get("Authorization") ?? "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: isAdmin, error } = await sb.rpc("is_admin");
  if (error || isAdmin !== true) return json({ error: "Faqat admin uchun" }, 403);

  // 2) Faqat rasm turlari
  const { contentType } = await req.json().catch(() => ({}));
  const ext = TYPES[contentType];
  if (!ext) return json({ error: "Faqat webp/jpg/png" }, 400);

  // 3) 5 daqiqa amal qiladigan yuklash havolasi
  const accountId = Deno.env.get("R2_ACCOUNT_ID")!;
  const bucket = Deno.env.get("R2_BUCKET")!;
  const key = `accounts/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const r2 = new AwsClient({
    accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
    service: "s3",
    region: "auto",
  });
  const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`);
  url.searchParams.set("X-Amz-Expires", "300");
  const signed = await r2.sign(new Request(url, { method: "PUT", headers: { "Content-Type": contentType } }), {
    aws: { signQuery: true },
  });

  const publicBase = Deno.env.get("R2_PUBLIC_URL")!.replace(/\/$/, "");
  return json({ uploadUrl: signed.url, publicUrl: `${publicBase}/${key}` });
});
