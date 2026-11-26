// Supabase Edge Function: har bir yangi pul harakatini adminning Telegramiga yuboradi.
// Supabase → Database → Webhooks: "transactions" jadvali, INSERT → shu funksiya,
// HTTP header:  x-webhook-secret: <NOTIFY_WEBHOOK_SECRET>
//
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_IDS (vergul bilan, masalan "12345,67890"),
//          NOTIFY_WEBHOOK_SECRET (o'zingiz o'ylab topgan uzun tasodifiy matn)
// Deploy:  supabase functions deploy notify-admin --no-verify-jwt
import { createClient } from "jsr:@supabase/supabase-js@2";

const LABEL: Record<string, string> = {
  buy: "🛒 Akkaunt sotib oldi", deposit: "💳 Balans to'ldirildi", withdraw: "🏦 Pul yechish so'rovi",
  sale: "💰 Sotuvchiga pul tushdi", quick_sell: "⚡ Tez sotish to'lovi", refund: "↩️ Pul qaytarildi",
  spin: "🎰 Spin", win_sell: "🎰 Yutuqni sotdi", admin: "🛠 Admin tuzatishi",
};
const som = (n: number) => `${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;
const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

Deno.serve(async (req) => {
  const secret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) return new Response("forbidden", { status: 403 });

  const body = await req.json().catch(() => null);
  const t = body?.record;
  if (body?.type !== "INSERT" || body?.table !== "transactions" || !t) return new Response("skip");

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: p } = await sb.from("profiles").select("public_id,username,telegram,balance").eq("id", t.user_id).maybeSingle();

  const text = [
    `<b>${LABEL[t.type] ?? t.type}</b>`,
    `👤 ID <b>${esc(p?.public_id)}</b> — ${esc(p?.username)}${p?.telegram ? ` (@${esc(p.telegram)})` : ""}`,
    `${t.amount >= 0 ? "➕" : "➖"} ${som(t.amount)}`,
    t.note ? `📝 ${esc(t.note)}` : "",
    `💼 Balans: ${som(p?.balance ?? 0)}`,
  ].filter(Boolean).join("\n");

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const chats = (Deno.env.get("TELEGRAM_ADMIN_CHAT_IDS") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  await Promise.all(chats.map(chat_id =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }),
    })));
  return new Response("ok");
});
