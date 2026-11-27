"use client";
import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile — "men robot emasman" tekshiruvi (bepul, ko'pincha ko'rinmas).
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY o'rnatilmagan bo'lsa — hech narsa chiqmaydi (o'chiq).
 */
export const TURNSTILE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile yuklanmadi"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** onToken(token) — tekshiruv o'tganda; token bir marta ishlatiladi, keyin resetKey ni o'zgartiring */
export default function Turnstile({ onToken, resetKey }: { onToken: (t: string | null) => void; resetKey?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_KEY || !box.current) return;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !box.current || !window.turnstile) return;
      id.current = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_KEY,
        theme: "dark",
        language: "uz",
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    }).catch(() => onToken(null));
    return () => {
      cancelled = true;
      if (id.current && window.turnstile) window.turnstile.remove(id.current);
      id.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Har urinishdan keyin yangi token olish
  useEffect(() => {
    if (resetKey && id.current && window.turnstile) { onToken(null); window.turnstile.reset(id.current); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!TURNSTILE_KEY) return null;
  return <div ref={box} className="flex justify-center min-h-[65px]" />;
}
