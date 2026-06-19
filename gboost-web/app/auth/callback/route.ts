import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code         = searchParams.get("code");
  const token_hash   = searchParams.get("token_hash");
  const type         = searchParams.get("type");
  const next         = searchParams.get("next") ?? "/dashboard";

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://heohxnkmwodsnhzgixst.supabase.co";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlb2h4bmttd29kc25oemdpeHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjE2MTQsImV4cCI6MjA5Njk5NzYxNH0.60Wnh9PvI6MfEeDC70e8BDBeti22cjnOZTmxdVtfL7A";
  const supabase = createClient(supabaseUrl, supabaseAnon);

  // Magic Link (token_hash) orqali kirish
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (!error && data.user) {
      await supabase.from("users").upsert({
        id:    data.user.id,
        name:  data.user.user_metadata?.full_name ||
               data.user.user_metadata?.name ||
               data.user.email?.split("@")[0] || "Foydalanuvchi",
        email: data.user.email,
        role:  "client",
        karma: 100,
      }, { onConflict: "id", ignoreDuplicates: true });
      return NextResponse.redirect(`${origin}/dashboard?welcome=1`);
    }
  }

  // OAuth code orqali kirish
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await supabase.from("users").upsert({
        id:    data.user.id,
        name:  data.user.user_metadata?.full_name ||
               data.user.user_metadata?.name ||
               data.user.email?.split("@")[0] || "Foydalanuvchi",
        email: data.user.email,
        role:  "client",
        karma: 100,
      }, { onConflict: "id", ignoreDuplicates: true });
      return NextResponse.redirect(`${origin}/dashboard?welcome=1`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
