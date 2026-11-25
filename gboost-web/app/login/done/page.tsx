"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/** OAuth / email havola qaytgan joy */
export default function Done() {
  const router = useRouter();
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(window.location.search);
      const code = q.get("code"), th = q.get("token_hash"), type = q.get("type");
      if (code) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (error) return setErr(error.message); }
      else if (th && type) { const { error } = await supabase.auth.verifyOtp({ token_hash: th, type: type as any }); if (error) return setErr(error.message); }
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { router.replace("/"); return; }
        await new Promise(r => setTimeout(r, 250));
      }
      setErr("Kirish amalga oshmadi, qayta urinib ko'ring.");
    })();
  }, [router]);
  return <div className="wrap py-24 text-center text-muted">{err ? <span className="text-lose font-bold">{err}</span> : "Kirilmoqda…"}</div>;
}
