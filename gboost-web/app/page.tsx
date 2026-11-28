"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TELEGRAM_ADMIN, game, telegramLink, type Account } from "@/lib/uzdrop";
import AccountCard from "@/components/AccountCard";
import Mascot from "@/components/Mascot";
import HeroSlider from "@/components/HeroSlider";

export default function Home() {
  const [list, setList] = useState<Account[] | null>(null);
  const [g, setG] = useState("all");
  const [top, setTop] = useState<Account[] | null>(null);

  useEffect(() => {
    supabase.from("accounts").select("*").eq("status", "active").order("price", { ascending: false }).limit(10)
      .then(({ data }) => setTop((data as Account[]) || []));
    supabase.from("accounts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(24)
      .then(({ data }) => setList((data as Account[]) || []));
  }, []);

  const games = useMemo(() => Array.from(new Set((list || []).map(a => a.game))), [list]);
  const shown = (list || []).filter(a => g === "all" || a.game === g);

  return (
    <div className="wrap py-6 space-y-10">
      {/* Promo-banner: avatar banner ichida */}
      <HeroSlider />

      {/* Qanday ishlaydi */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["💳", "Balansni to'ldiring", "Admin orqali Telegramda"],
          ["🛒", "Akkauntni tanlang", "Har biri tekshirilgan, ID raqamli"],
          ["🔑", "Kod oling", "Xariddan so'ng maxfiy kod beriladi"],
          ["✅", "Akkauntni oling", "Mas'ul admin Telegramda topshiradi"],
        ].map(([i, t, d], n) => (
          <div key={t} className="panel p-4 flex gap-3 items-center">
            <span className="text-2xl">{i}</span>
            <div><p className="font-extrabold text-sm"><span className="text-accent">{n + 1}.</span> {t}</p><p className="text-xs text-muted">{d}</p></div>
          </div>
        ))}
      </section>

      {/* Top 10 */}
      {top && top.length > 0 && (
        <section>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-4">
            <h2 className="h-title">🏆 Top 10 akkauntlar</h2>
            <Mascot id="home-top10" pose="point-right" side="right" className="lg:max-w-md"
              text="Eng qimmat va noyob akkauntlar shu yerda. Kartani bosib batafsil ko'ring." />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
            {top.map((a, i) => {
              const medal = i === 0 ? "#FFC83D" : i === 1 ? "#C9D1DA" : i === 2 ? "#CD7F32" : null;
              return (
                <Link key={a.id} href={`/market?id=${a.id}`} className="relative shrink-0 w-56 snap-start">
                  <span className="absolute -left-1 -top-2 z-30 min-w-9 h-9 px-2 rounded-xl grid place-items-center font-black text-sm shadow-lg"
                    style={medal ? { background: medal, color: "#1B1400" } : { background: "#1D1313", color: "#F7EDED", border: "1px solid #2F1E1E" }}>
                    #{i + 1}
                  </span>
                  <AccountCard a={a} compact onClick={() => {}} />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Akkauntlar */}
      <section id="accounts" className="scroll-mt-24">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h2 className="h-title mr-3">Sotuvdagi akkauntlar</h2>
          {["all", ...games].map(x => (
            <button key={x} onClick={() => setG(x)}
              className={`chip !px-3 !py-1.5 ${g === x ? "bg-accent text-[#1B1400]" : "bg-panel text-muted hover:text-white"}`}>
              {x === "all" ? "Barchasi" : `${game(x).icon} ${game(x).name}`}
            </button>
          ))}
          <Link href="/market" className="ml-auto text-sm font-bold text-accent">Qidirish va saralash →</Link>
        </div>
        {list === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="panel h-64 animate-pulse" />)}</div>
        ) : shown.length === 0 ? (
          <div className="panel p-10 text-center text-muted">Hozircha sotuvda akkaunt yo&apos;q. Tez orada qo&apos;shiladi!</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {shown.map(a => (
              <Link key={a.id} href={`/market?id=${a.id}`}>
                <AccountCard a={a} onClick={() => {}} footer={<span className="btn-accent !py-2 w-full">Sotib olish</span>} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Sotish + Spin tez kunda */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="panel p-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-accent/10 blur-2xl" />
          <p className="text-3xl">💰</p>
          <p className="font-black uppercase text-lg mt-2">Akkauntingizni soting</p>
          <p className="text-sm text-muted mt-1">Adminga Telegramda yozing — u akkauntni tekshirib, rasmlari bilan saytga joylaydi. Sotilganda pul balansingizga tushadi.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/sell" className="btn-accent">Batafsil</Link>
            <a href={telegramLink("Salom! Akkauntimni UzDrop'da sotmoqchiman.")} target="_blank" rel="noopener noreferrer" className="btn-ghost">@{TELEGRAM_ADMIN}</a>
          </div>
        </div>
        <div className="panel p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,200,61,.12) 18px 36px)" }} />
          <p className="relative text-3xl">🎰</p>
          <div className="relative flex items-center gap-2 mt-2">
            <p className="font-black uppercase text-lg">Akkaunt spin</p>
            <span className="chip bg-accent/15 text-accent">Tez kunda</span>
          </div>
          <p className="relative text-sm text-muted mt-1">Keys ochib haqiqiy o&apos;yin akkauntini yutish imkoniyati tez orada qo&apos;shiladi. Kuzatib boring!</p>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-3 text-center">
        {[
          ["🔒", "Xavfsiz", "Login/parol saytda hech kimga ko'rinmaydi — faqat admin topshiradi"],
          ["🆔", "Har bir akkaunt ID raqamli", "Qaysi admin javobgarligi aniq ko'rinadi"],
          ["↩️", "Pul qaytarish", "Akkaunt ishlamasa admin pulni balansga qaytaradi"],
        ].map(([i, t, d]) => (
          <div key={t} className="panel p-5"><div className="text-3xl">{i}</div><p className="font-black uppercase mt-2">{t}</p><p className="text-xs text-muted mt-1">{d}</p></div>
        ))}
      </section>
    </div>
  );
}
