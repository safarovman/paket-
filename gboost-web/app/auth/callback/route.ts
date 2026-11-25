import { NextRequest, NextResponse } from "next/server";

// Supabase sessiyani brauzerda (detectSessionInUrl) o'zi oladi — bu yerda faqat bosh sahifaga qaytaramiz,
// kod/token parametrlarini saqlab.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  return NextResponse.redirect(`${url.origin}/login/done${url.search}${url.hash}`);
}
