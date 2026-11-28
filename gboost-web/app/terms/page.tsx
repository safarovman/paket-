import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Foydalanish shartlari — UzzDrop" };

export default function Terms() {
  return (
    <div className="wrap py-10 max-w-3xl">
      <h1 className="h-title">Foydalanish shartlari</h1>
      <p className="text-muted text-sm mt-1">Oxirgi yangilanish: 2026-yil 27-noyabr</p>
      <div className="panel p-6 mt-6 space-y-4 text-sm leading-relaxed text-white/85">
        <p><b className="text-accent">1.</b> UzzDrop&apos;dan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.</p>
        <p><b className="text-accent">2.</b> Saytdagi har bir akkaunt admin tomonidan tekshiriladi. Xariddan so&apos;ng akkaunt Telegram orqali mas&apos;ul admin tomonidan topshiriladi.</p>
        <p><b className="text-accent">3.</b> Akkaunt ishlamasa yoki tavsifga mos kelmasa, admin xaridni bekor qilib, pulni balansingizga qaytaradi.</p>
        <p><b className="text-accent">4.</b> Maxfiy kodingizni hech kimga bermang. Kodni boshqa shaxsga berish oqibatlari uchun sayt javobgar emas.</p>
        <p><b className="text-accent">5.</b> Firibgarlik, boshqalarning akkauntini sotish yoki soxta to&apos;lov qilish taqiqlanadi va hisob bloklanadi.</p>
        <p><b className="text-accent">6.</b> Sayt shartlarni o&apos;zgartirish huquqini saqlab qoladi.</p>
      </div>
      <p className="text-sm text-muted mt-4">Shuningdek qarang: <Link href="/privacy" className="text-accent font-bold">Maxfiylik siyosati</Link></p>
    </div>
  );
}
