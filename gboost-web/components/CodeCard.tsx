"use client";
import { useState } from "react";
import { useUser } from "@/components/UserProvider";
import { TELEGRAM_ADMIN, som, telegramLink } from "@/lib/uzdrop";

/**
 * Xarid / spin / to'ldirishdan keyin chiqadigan kod.
 * Foydalanuvchi kod + ID raqamini Telegramda adminga yuboradi, admin tekshirib beradi.
 */
export default function CodeCard({ code, kind, title, amount }: {
  code: string; kind: "buy" | "spin" | "deposit"; title?: string; amount?: number;
}) {
  const { profile } = useUser();
  const [copied, setCopied] = useState(false);
  const id = profile?.public_id ?? "—";
  const head = kind === "deposit" ? "💳 Balans to'ldirish" : kind === "spin" ? "🎰 Spin yutug'i" : "🛒 Akkaunt xaridi";
  const msg = [
    `${head}`,
    `Kod: ${code}`,
    `Mening ID: ${id}`,
    title ? `Akkaunt: ${title}` : "",
    amount ? `Summa: ${som(amount)}` : "",
    kind === "deposit" ? "(To'lov chekini shu yerga yuboraman)" : "",
  ].filter(Boolean).join("\n");

  const copy = () => { navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="text-center">
      <p className="text-xs font-extrabold uppercase text-muted">Sizning kodingiz</p>
      <button onClick={copy} className="mt-2 w-full rounded-xl border-2 border-dashed border-accent bg-accent/5 py-4 text-2xl sm:text-3xl font-black tracking-widest text-accent">
        {code}
      </button>
      <div className="flex justify-center gap-2 mt-3 text-sm">
        <span className="chip bg-violet/20 text-violet-light !text-xs">Sizning ID: {id}</span>
        {profile?.telegram && <span className="chip bg-panel2 text-muted !text-xs">@{profile.telegram}</span>}
      </div>
      <ol className="text-left text-xs text-muted mt-4 space-y-1.5 list-decimal pl-5">
        <li>Pastdagi tugma bilan Telegramda <b className="text-white">@{TELEGRAM_ADMIN}</b> ga yozing — kod va ID avtomatik qo&apos;shiladi.</li>
        {kind === "deposit"
          ? <li>To&apos;lov chekini (skrinshot) yuboring. Admin tekshirib balansingizni to&apos;ldiradi.</li>
          : <li>Admin ID raqamingizni tekshiradi va akkaunt ma&apos;lumotlarini Telegramda beradi.</li>}
        <li>Kodni hech kimga bermang — u faqat sizga tegishli.</li>
      </ol>
      {!profile?.telegram && (
        <p className="text-[11px] text-accent mt-3">Maslahat: profilga Telegram username&apos;ingizni yozing — admin sizni tezroq tasdiqlaydi.</p>
      )}
      <div className="grid gap-2 mt-4">
        <a href={telegramLink(msg)} target="_blank" rel="noopener noreferrer" className="btn-accent">Telegramda adminga yuborish</a>
        <button onClick={copy} className="btn-ghost">{copied ? "✅ Nusxalandi" : "Kod va ID ni nusxalash"}</button>
      </div>
    </div>
  );
}
