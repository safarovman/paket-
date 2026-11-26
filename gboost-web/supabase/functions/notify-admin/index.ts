// Supabase Edge Function: har bir yangi pul harakatini adminlarning Telegramiga yuboradi.
// Baza triggeri (12_notify.sql) faqat tranzaksiya ID sini yuboradi; funksiya ma'lumotni
// bazadan O'ZI o'qiydi va har bir tranzaksiya haqida faqat BIR marta xabar beradi —
// shuning uchun begona odam soxta xabar yubora olmaydi (maxfiy parol kerak emas).
//
// Secrets (Supabase → Edge Functions → Secrets):
//   TELEGRAM_BOT_TOKEN       — @BotFather bergan token
//   TELEGRAM_ADMIN_CHAT_IDS  — adminlar chat ID lari, vergul bilan (masalan "12345,67890")
import { createClient } from "jsr:@supabase/supabase-js@2";

const LABEL: Record<string, string> = {
  buy: "🛒 Akkaunt sotib olindi", deposit: "💳 Balans to'ldirildi", withdraw: "🏦 Pul yechish",
  sale: "💰 Sotuvchiga pul tushdi", quick_sell: "⚡ Tez sotish to'lovi", refund: "↩️ Pul qaytarildi",
  spin: "🎰 Spin", win_sell: "🎰 Yutuq sotildi", admin: "🛠 Admin tuzatishi",
};
const som = (n: number) => `${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;
const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST kerak", { status: 405 });
  const body = await req.json().catch(() => null);
  const id = body?.id;
  if (typeof id !== "string" || !UUID.test(id)) return new Response("bad id", { status: 400 });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Faqat hali xabar berilmagan, yangi (10 daqiqadan eski bo'lmagan) tranzaksiyani "egallaymiz"
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: t } = await sb.from("transactions")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id).is("notified_at", null).gte("created_at", since)
    .select("id,user_id,type,amount,note,created_at").maybeSingle();
  if (!t) return new Response("skip");

  const { data: p } = await sb.from("profiles").select("public_id,username,telegram,balance").eq("id", t.user_id).maybeSingle();

  const text = [
    `<b>${LABEL[t.type] ?? esc(t.type)}</b>`,
    `👤 ID <b>${esc(p?.public_id)}</b> — ${esc(p?.username)}${p?.telegram ? ` (@${esc(p.telegram)})` : ""}`,
    `${t.amount >= 0 ? "➕" : "➖"} ${som(t.amount)}`,
    t.note ? `📝 ${esc(t.note)}` : "",
    `💼 Balans: ${som(p?.balance ?? 0)}`,
  ].filter(Boolean).join("\n");

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chats = (Deno.env.get("TELEGRAM_ADMIN_CHAT_IDS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || chats.length === 0) return new Response("telegram sozlanmagan", { status: 500 });

  await Promise.all(chats.map((chat_id) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }),
    })
  ));
  return new Response("ok");
});
