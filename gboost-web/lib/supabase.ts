import { createClient } from "@supabase/supabase-js";

// Supabase loyihasi: uzdrop (Europe). URL ochiq ma'lumot.
// anon kalit Cloudflare Pages → Environment variables → NEXT_PUBLIC_SUPABASE_ANON_KEY orqali beriladi.
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://acwlvsazpqjnunqbaxyx.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon-key-not-set";

if (typeof window !== "undefined" && SUPABASE_ANON === "anon-key-not-set") {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY o'rnatilmagan — Cloudflare Pages sozlamalariga qo'shing.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

export const errText = (e: any): string => e?.message || String(e);
