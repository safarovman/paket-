import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnon);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Users jadvaliga qo'shish (agar yangi bo'lsa)
      await supabase.from("users").upsert({
        id:    data.user.id,
        name:  data.user.user_metadata?.full_name ||
               data.user.user_metadata?.name ||
               data.user.email?.split("@")[0] || "Foydalanuvchi",
        email: data.user.email,
        role:  "client",
        karma: 100,
      }, { onConflict: "id", ignoreDuplicates: true });

      return NextResponse.redirect(`${origin}${next}?welcome=1`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
