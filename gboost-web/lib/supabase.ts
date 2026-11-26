import { createClient } from "@supabase/supabase-js";

// Supabase loyihasi: uzdrop (Europe). URL ochiq ma'lumot.
// anon kalit Cloudflare Pages → Environment variables → NEXT_PUBLIC_SUPABASE_ANON_KEY orqali beriladi.
const DEFAULT_URL = "https://acwlvsazpqjnunqbaxyx.supabase.co";
// Env qiymatlaridagi kichik xatolarni tozalash: bo'sh joy, qo'shtirnoq, oxiridagi "/"
const clean = (v?: string) => (v ?? "").trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
const envUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
// Faqat https://<loyiha>.supabase.co ko'rinishidagi manzil qabul qilinadi (supabase.com — dashboard, server emas)
const SUPABASE_URL  = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(envUrl) ? envUrl : DEFAULT_URL;
const SUPABASE_ANON = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || "anon-key-not-set";

if (typeof window !== "undefined" && SUPABASE_ANON === "anon-key-not-set") {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY o'rnatilmagan — Cloudflare Pages sozlamalariga qo'shing.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

export const errText = (e: any): string => e?.message || String(e);
