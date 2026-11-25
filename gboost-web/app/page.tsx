"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { game, som, type Account, type Case } from "@/lib/uzdrop";
import AccountCard from "@/components/AccountCard";
import CaseArt from "@/components/CaseArt";

export default function Home() {
  const [cases, setCases] = useState<Case[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [latest, setLatest] = useState<Account[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabase.from("cases").select("*").eq("active", true).order("sort").order("price")
      .then(({ data }) => setCases((data as Case[]) || []));
    supabase.from("accounts").select("case_id").eq("status", "pool").then(({ data }) => {
      const c: Record<string, number> = {};
      (data || []).forEach((r: any) => { if (r.case_id) c[r.case_id] = (c[r.case_id] || 0) + 1; });
      setCounts(c);
    });
    supabase.from("accounts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => setLatest((data as Account[]) || []));
  }, []);

  const shown = (cases || []).filter(c => filter === "all" || c.game === filter);
  const games = Array.from(new Set((cases || []).map(c => c.game)));

  return (
    <div className="wrap py-6 space-y-10">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#1E1650] via-[#151A33] to-[#0F1325] p-6 sm:p-10">
        <div className="absolute -right-10 -top-16 w-80 h-80 rounded-full bg-violet/30 blur-3xl" />
        <div className="absolute right-24 bottom-0 w-60 h-60 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-xl">
          <span className="chip bg-accent/15 text-accent mb-3">🎰 Akkaunt spin</span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase leading-[1.05]">
            Keys oching — <span className="text-accent">akkaunt</span> yuting
          </h1>
          <p className="text-muted mt-3 text-sm sm:text-base">
            Balansni to&apos;ldiring, keysni aylantiring va haqiqiy o&apos;yin akkauntini oling.
            Yoqmasa — bir tugma bilan darhol soting va yana spin qiling.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <a href="#cases" className="btn-accent">Spin qilish</a>
            <Link href="/sell?quick=1" className="btn-violet">⚡ Tez sotish</Link>
            <Link href="/market" className="btn-ghost">Akkaunt sotib olish</Link>
          </div>
        </div>
      </section>

      {/* Qanday ishlaydi */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["💳", "Balansni to'ldiring", "Click, Payme, Uzcard, Humo"],
          ["🎰", "Spin qiling", "Keys ichidan tasodifiy akkaunt"],
          ["🛒", "Sotib oling", "Bozordan kerakli akkauntni"],
          ["⚡", "Tez soting", "Akkauntingizni sayt darhol oladi"],
        ].map(([i, t, d]) => (
          <div key={t} className="panel p-4 flex gap-3 items-center">
            <span className="text-2xl">{i}</span>
            <div><p className="font-extrabold text-sm">{t}</p><p className="text-xs text-muted">{d}</p></div>
          </div>
        ))}
      </section>

      {/* Keyslar */}
      <section id="cases" className="scroll-mt-28">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h2 className="h-title mr-3">Keyslar</h2>
          {["all", ...games].map(g => (
            <button key={g} onClick={() => setFilter(g)}
              className={`chip !px-3 !py-1.5 ${filter === g ? "bg-accent text-[#1B1400]" : "bg-panel text-muted hover:text-white"}`}>
              {g === "all" ? "Barchasi" : `${game(g).icon} ${game(g).name}`}
            </button>
          ))}
        </div>

        {cases === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="panel h-64 animate-pulse" />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="panel p-10 text-center text-muted">Hozircha keyslar yo&apos;q. Admin paneldan keys qo&apos;shing.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {shown.map(c => (
              <Link key={c.id} href={`/case?id=${c.id}`}
                className="group relative rounded-2xl overflow-hidden border border-line bg-panel hover:-translate-y-1 transition-transform">
                <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity"
                  style={{ background: `radial-gradient(circle at 50% 35%, ${c.color}, transparent 65%)` }} />
                <div className="relative p-4 flex flex-col items-center text-center">
                  <div className="h-32 grid place-items-center">
                    {c.image_url
                      ? <img src={c.image_url} alt="" className="max-h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" />
                      : <CaseArt color={c.color} icon={game(c.game).icon} />}
                  </div>
                  <p className="font-black uppercase text-sm mt-2">{c.name}</p>
                  <p className="text-[11px] text-muted">{game(c.game).name} • {counts[c.id] || 0} ta akkaunt</p>
                  <span className="mt-3 w-full rounded-xl bg-bg/70 border border-line py-2 font-black text-accent group-hover:bg-accent group-hover:text-[#1B1400] transition-colors">
                    {som(c.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bozordan */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="h-title">Sotuvdagi akkauntlar</h2>
          <Link href="/market" className="text-sm font-bold text-accent">Barchasi →</Link>
        </div>
        {latest.length === 0 ? (
          <div className="panel p-8 text-center text-muted">
            Hali e&apos;lonlar yo&apos;q. <Link href="/sell" className="text-accent font-bold">Birinchi bo&apos;lib soting</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {latest.map(a => <Link key={a.id} href={`/market?id=${a.id}`}><AccountCard a={a} onClick={() => {}} /></Link>)}
          </div>
        )}
      </section>

      <section className="grid sm:grid-cols-3 gap-3 text-center">
        {[
          ["🔒", "Xavfsiz", "Har bir akkaunt admin tomonidan tekshiriladi"],
          ["🔑", "Kod orqali", "Xariddan keyin kod beriladi — admin Telegramda topshiradi"],
          ["🎁", "Halol spin", "Natija serverda hisoblanadi, ehtimollar ochiq"],
        ].map(([i, t, d]) => (
          <div key={t} className="panel p-5"><div className="text-3xl">{i}</div><p className="font-black uppercase mt-2">{t}</p><p className="text-xs text-muted mt-1">{d}</p></div>
        ))}
      </section>
    </div>
  );
}

