// Supabase Edge Function: Telegram Login Widget orqali kirish.
// 1) Telegram yuborgan ma'lumot imzosini bot tokeni bilan tekshiradi (rasmiy algoritm)
// 2) Foydalanuvchini yaratadi (bo'lmasa) va bir martalik kirish tokenini qaytaradi
//
// Secrets: TELEGRAM_BOT_TOKEN (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY avtomatik bor)
// Deploy:  supabase functions deploy telegram-auth --no-verify-jwt
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function verifyTelegram(data: Record<string, unknown>, botToken: string) {
  const { hash, ...fields } = data;
  if (typeof hash !== "string") return false;
  const check = Object.keys(fields)
    .filter(k => fields[k] !== undefined && fields[k] !== null)
    .sort()
    .map(k => `${k}=${fields[k]}`)
    .join("\n");
  const secret = await crypto.subtle.digest("SHA-256", enc.encode(botToken));
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = hex(await crypto.subtle.sign("HMAC", key, enc.encode(check)));
  return safeEqual(sig, hash.toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST kerak" }, 405);

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) return json({ error: "Telegram sozlanmagan" }, 500);

  const tg = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!tg || !tg.id || !tg.hash) return json({ error: "Noto'g'ri so'rov" }, 400);

  if (!(await verifyTelegram(tg, botToken))) return json({ error: "Telegram imzosi noto'g'ri" }, 401);
  const authDate = Number(tg.auth_date);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return json({ error: "Telegram ma'lumoti eskirgan, qayta urinib ko'ring" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const id = String(tg.id).replace(/\D/g, "");
  const email = `tg${id}@telegram.uzdrop.local`;
  const username = typeof tg.username === "string" ? tg.username.toLowerCase() : null;
  const fullName = [tg.first_name, tg.last_name].filter(Boolean).join(" ") || username || `tg${id}`;

  let userId: string | null = null;
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, telegram_id: id, telegram_username: username, avatar: tg.photo_url ?? null },
  });
  if (created.data?.user) userId = created.data.user.id;
  // mavjud foydalanuvchi bo'lsa xato qaytadi — e'tiborsiz qoldiramiz

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error || !link.data?.properties?.hashed_token) return json({ error: "Kirish havolasini yaratib bo'lmadi" }, 500);
  userId = userId ?? link.data.user?.id ?? null;

  if (userId && username && /^[a-z0-9_]{5,32}$/.test(username)) {
    await admin.from("profiles").update({ telegram: username }).eq("id", userId);
  }

  return json({ token_hash: link.data.properties.hashed_token });
});
