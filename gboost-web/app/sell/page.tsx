"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { COMMISSION, TELEGRAM_ADMIN, telegramLink } from "@/lib/uzdrop";

function Sell() {
  const params = useSearchParams();
  const { user, profile } = useUser();
  const [quick, setQuick] = useState(params.get("quick") === "1");
  useEffect(() => { setQuick(params.get("quick") === "1"); }, [params]);
  const [copied, setCopied] = useState(false);

  const who = profile?.email || user?.email || "";
  const message = [
    quick ? "⚡ Salom! Akkauntimni TEZ SOTMOQCHIMAN." : "🛒 Salom! Akkauntimni UzDrop bozorida sotmoqchiman.",
    "",
    `UzDrop akkauntim: ${who}`,
    `ID: ${user?.id ?? ""}`,
    "",
    "O'yin: ",
    "Rank / daraja: ",
    "Skinlar / qahramonlar: ",
    quick ? "Qancha so'rayman: " : "Sotuv narxi: ",
    "",
    "(Skrinshotlarni shu yerga yuboraman)",
  ].join("\n");

  return (
    <div className="wrap py-6 max-w-3xl">
      <h1 className="h-title mb-1">Akkauntni sotish</h1>
      <p className="text-muted text-sm mb-5">Sotish Telegram orqali — admin akkauntni tekshiradi va o&apos;zi saytga joylaydi.</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {[
          { q: false, i: "🛒", t: "Bozorga qo'yish", d: `Narxni o'zingiz aytasiz. Sotilganda ${100 - COMMISSION * 100}% balansingizga tushadi.` },
          { q: true,  i: "⚡", t: "Tez sotish",      d: "UzDrop akkauntni o'zi sotib oladi — admin tasdiqlashi bilan pul darhol balansda." },
        ].map(o => (
          <button key={o.t} type="button" onClick={() => setQuick(o.q)}
            className={`panel p-4 text-left transition-colors ${quick === o.q ? "!border-accent bg-accent/5" : "hover:border-violet"}`}>
            <p className="text-2xl">{o.i}</p>
            <p className="font-black uppercase mt-1">{o.t}</p>
            <p className="text-xs text-muted mt-1">{o.d}</p>
          </button>
        ))}
      </div>

      <div className="panel p-5">
        <p className="font-black uppercase mb-4">Qanday ishlaydi</p>
        <ol className="space-y-3">
          {[
            ["Tizimga kiring", "Pul aynan shu UzDrop akkauntingiz balansiga tushadi."],
            ["Telegramda adminga yozing", `@${TELEGRAM_ADMIN} — tayyor xabar avtomatik ochiladi, bo'sh joylarni to'ldiring.`],
            ["Skrinshotlar va ma'lumotlarni yuboring", "Rank, skinlar, inventar rasmlari. Login/parolni admin so'raganda berasiz."],
            ["Admin tekshiradi va saytga joylaydi", quick ? "Narx kelishilgach pul darhol balansingizga tushadi." : "E'lon rasmlari bilan bozorda paydo bo'ladi."],
            [quick ? "Spin qiling yoki yeching" : "Sotilganda pul keladi", quick ? "Pulga keys oching yoki kartaga yeching." : "Xaridor sotib olishi bilan pul balansingizda."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-lg bg-violet grid place-items-center font-black text-sm">{i + 1}</span>
              <div><p className="font-bold text-sm">{t}</p><p className="text-xs text-muted">{d}</p></div>
            </li>
          ))}
        </ol>

        {user ? (
          <>
            <div className="mt-5 bg-bg border border-line rounded-xl p-3 text-xs text-muted whitespace-pre-line font-mono max-h-48 overflow-y-auto">{message}</div>
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              <a href={telegramLink(message)} target="_blank" rel="noopener noreferrer" className={quick ? "btn-accent" : "btn-violet"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9.8 15.6 9.4 20c.6 0 .9-.3 1.2-.6l2.9-2.8 6 4.4c1.1.6 1.9.3 2.2-1L24 3.6c.4-1.6-.6-2.3-1.6-1.9L1.1 10c-1.5.6-1.5 1.4-.3 1.8l5.5 1.7L19 5.5c.6-.4 1.1-.2.7.2" /></svg>
                Telegramda yozish
              </a>
              <button onClick={() => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="btn-ghost">
                {copied ? "✅ Nusxalandi" : "Xabarni nusxalash"}
              </button>
            </div>
          </>
        ) : (
          <Link href="/login" className="btn-accent w-full mt-5">Avval tizimga kiring</Link>
        )}
      </div>

      <p className="text-xs text-muted mt-4">🔒 Login va parolingiz faqat admin va xaridorga ko&apos;rinadi. Admin hech qachon kartangiz PIN-kodi yoki SMS kodini so&apos;ramaydi.</p>
    </div>
  );
}

export default function Page() { return <Suspense><Sell /></Suspense>; }
