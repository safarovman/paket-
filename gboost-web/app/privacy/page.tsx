import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Maxfiylik siyosati — UzzDrop" };

const UPDATED = "2026-yil 27-noyabr";

export default function Privacy() {
  return (
    <div className="wrap py-10 max-w-3xl">
      <h1 className="h-title">Maxfiylik siyosati</h1>
      <p className="text-muted text-sm mt-1">Oxirgi yangilanish: {UPDATED}</p>

      <div className="panel p-6 mt-6 space-y-5 text-sm leading-relaxed text-white/85">
        <section>
          <h2 className="font-black uppercase text-accent mb-1">1. Umumiy</h2>
          <p>UzzDrop (&quot;sayt&quot;) — o&apos;yin akkauntlarini sotish va sotib olish platformasi. Ushbu siyosat qaysi ma&apos;lumotlarni yig&apos;ishimiz, ulardan qanday foydalanishimiz va qanday himoya qilishimizni tushuntiradi.</p>
        </section>
        <section>
          <h2 className="font-black uppercase text-accent mb-1">2. Qanday ma&apos;lumotlarni yig&apos;amiz</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email manzil va ism (ro&apos;yxatdan o&apos;tishda yoki Google / Telegram orqali kirishda).</li>
            <li>Telegram username (agar o&apos;zingiz kiritsangiz).</li>
            <li>Balans, to&apos;ldirish va xarid tarixi.</li>
          </ul>
          <p className="mt-2">Biz parolingizni ochiq ko&apos;rinishda saqlamaymiz va Google akkauntingiz paroliga kirish huquqiga ega emasmiz.</p>
        </section>
        <section>
          <h2 className="font-black uppercase text-accent mb-1">3. Ma&apos;lumotlardan foydalanish</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hisobingizni yaratish va unga kirishni ta&apos;minlash.</li>
            <li>Xaridlarni bajarish va akkauntlarni topshirish.</li>
            <li>Firibgarlikning oldini olish va xavfsizlik.</li>
            <li>Siz bilan bog&apos;lanish (masalan, tasdiqlash kodlari).</li>
          </ul>
          <p className="mt-2">Ma&apos;lumotlaringizni sotmaymiz va reklama uchun uchinchi shaxslarga bermaymiz.</p>
        </section>
        <section>
          <h2 className="font-black uppercase text-accent mb-1">4. Saqlash va himoya</h2>
          <p>Ma&apos;lumotlar himoyalangan serverlarda (Supabase, Cloudflare) saqlanadi. Akkaunt login/parollari faqat adminlarga ko&apos;rinadi va faqat xaridorga topshiriladi.</p>
        </section>
        <section>
          <h2 className="font-black uppercase text-accent mb-1">5. Sizning huquqlaringiz</h2>
          <p>Siz ma&apos;lumotlaringizni ko&apos;rish, o&apos;zgartirish yoki hisobingizni o&apos;chirishni so&apos;rashingiz mumkin. Buning uchun Telegram orqali admin bilan bog&apos;laning.</p>
        </section>
        <section>
          <h2 className="font-black uppercase text-accent mb-1">6. Bog&apos;lanish</h2>
          <p>Savollar bo&apos;yicha saytdagi admin Telegram manziliga yozing.</p>
        </section>
      </div>
      <p className="text-sm text-muted mt-4">Shuningdek qarang: <Link href="/terms" className="text-accent font-bold">Foydalanish shartlari</Link></p>
    </div>
  );
}
