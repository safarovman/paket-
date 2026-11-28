"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, errText } from "@/lib/supabase";

const BOT = (process.env.NEXT_PUBLIC_TELEGRAM_BOT || "").replace(/^@/, "");

declare global { interface Window { onUzdropTelegramAuth?: (u: Record<string, unknown>) => void } }

/** Telegram Login Widget → Edge Function "telegram-auth" → Supabase sessiya */
export default function TelegramLogin() {
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!BOT || !box.current) return;
    window.onUzdropTelegramAuth = async (tgUser) => {
      setErr(""); setBusy(true);
      try {
        const { data, error } = await supabase.functions.invoke("telegram-auth", { body: tgUser });
        if (error || !data?.token_hash) throw new Error(data?.error || error?.message || "Telegram orqali kirib bo'lmadi");
        const { error: e2 } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
        if (e2) throw e2;
        router.push("/");
      } catch (e) { setErr(errText(e)); setBusy(false); }
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", BOT);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "12");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-onauth", "onUzdropTelegramAuth(user)");
    box.current.innerHTML = "";
    box.current.appendChild(s);
    return () => { delete window.onUzdropTelegramAuth; };
  }, [router]);

  if (!BOT) return <button disabled className="btn-ghost w-full">Telegram orqali (tez kunda)</button>;
  return (
    <div className="text-center">
      <div ref={box} className={`flex justify-center min-h-[40px] ${busy ? "opacity-50 pointer-events-none" : ""}`} />
      {busy && <p className="text-xs text-muted mt-1">Kirilmoqda…</p>}
      {err && <p className="text-lose text-xs font-bold mt-1">{err}</p>}
    </div>
  );
}
