"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { TELEGRAM_ADMIN, accNo, som, telegramLink } from "@/lib/uzdrop";

/**
 * Xarid / spin / to'ldirishdan keyin chiqadigan oyna.
 * Akkaunt uchun: akkaunt ID (#1024) + maxfiy kod + shu akkauntga mas'ul adminning @telegram'i.
 * Foydalanuvchi aynan o'sha adminga yozadi, admin kodni tekshirib akkauntni beradi.
 */
export default function CodeCard({ code, kind, title, amount, accountId }: {
  code: string; kind: "buy" | "spin" | "deposit"; title?: string; amount?: number; accountId?: string;
}) {
  const { profile } = useUser();
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState<{ public_no: number | null; admin_telegram: string | null } | null>(null);

  useEffect(() => {
    if (!accountId) return;
    supabase.rpc("account_contact", { p_account: accountId }).then(({ data }) => data && setContact(data as any));
  }, [accountId]);

  const admin = contact?.admin_telegram || TELEGRAM_ADMIN;
  const no = accNo(contact?.public_no);
  const head = kind === "deposit" ? "Balans to'ldirish" : kind === "spin" ? "Spin yutug'i" : "Akkaunt xaridi";
  const msg = [
    head,
    no ? `Akkaunt ID: ${no}` : "",
    `Kod: ${code}`,
    title ? `Akkaunt: ${title}` : "",
    amount ? `Summa: ${som(amount)}` : "",
    `Mening UzDrop ID: ${profile?.public_id ?? "—"}`,
    kind === "deposit" ? "(To'lov chekini shu yerga yuboraman)" : "",
  ].filter(Boolean).join("\n");

  const copy = () => { navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="text-center">
      {no && (
        <div className="mb-3">
          <p className="text-xs font-extrabold uppercase text-muted">Akkaunt ID</p>
          <p className="text-3xl font-black">{no}</p>
        </div>
      )}
      <p className="text-xs font-extrabold uppercase text-muted">Maxfiy kod</p>
      <button onClick={copy} className="mt-1 w-full rounded-xl border-2 border-dashed border-accent bg-accent/5 py-3 text-2xl sm:text-3xl font-black tracking-widest text-accent">
        {code}
      </button>

      <div className="mt-4 rounded-xl bg-violet/10 border border-violet/30 p-3">
        <p className="text-xs text-muted">{kind === "deposit" ? "To'lovni tasdiqlovchi admin" : "Bu akkauntga mas'ul admin"}</p>
        <p className="text-lg font-black text-violet-light">@{admin}</p>
      </div>

      <ol className="text-left text-xs text-muted mt-4 space-y-1.5 list-decimal pl-5">
        <li>Pastdagi tugma bilan Telegramda <b className="text-white">@{admin}</b> ga yozing — {no ? "akkaunt ID, " : ""}kod va ID raqamingiz avtomatik qo&apos;shiladi.</li>
        {kind === "deposit"
          ? <li>To&apos;lov chekini (skrinshot) yuboring. Admin tekshirib balansingizni to&apos;ldiradi.</li>
          : <li>Admin kodni tekshiradi va akkaunt login/parolini Telegramda beradi.</li>}
        <li>Kodni faqat <b className="text-white">@{admin}</b> ga bering. Boshqa hech kimga bermang — admin sizga o&apos;zi birinchi yozmaydi.</li>
      </ol>
      <div className="grid gap-2 mt-4">
        <a href={telegramLink(msg, admin)} target="_blank" rel="noopener noreferrer" className="btn-accent">@{admin} ga yozish</a>
        <button onClick={copy} className="btn-ghost">{copied ? "Nusxalandi" : "Xabarni nusxalash"}</button>
      </div>
    </div>
  );
}
