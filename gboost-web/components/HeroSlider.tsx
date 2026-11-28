"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

/**
 * Bosh sahifadagi promo-banner: katta niqobli yordamchi banner ICHIDA, yozuvlar yonida.
 * Slaydlar o'zi almashadi (6 s), strelkalar, nuqtalar, telefonda surish.
 * Rasm: /mascot/<pose>.png (shaffof PNG). Yuklanmasa — rasmsiz ko'rinadi.
 */
type Slide = {
  tag: string;
  title: React.ReactNode;
  text: string;
  cta: { label: string; href: string };
  cta2?: { label: string; href: string };
  pose: "desk" | "point-right" | "point-left" | "wave" | "think";
  bg: string;      // fon gradienti
  glow: string;    // avatar ortidagi yorug'lik rangi
  badge?: string;  // avatar yonidagi "shisha" yorliq
};

const SLIDES: Slide[] = [
  {
    tag: "UZDROP",
    title: <>O&apos;yin <span className="text-accent">akkauntlarini</span> xavfsiz sotib oling</>,
    text: "Har bir akkauntni admin tekshiradi. Xariddan keyin akkaunt Telegram orqali shaxsan topshiriladi.",
    cta: { label: "Akkauntlarni ko'rish", href: "#accounts" },
    cta2: { label: "Akkauntimni sotaman", href: "/sell" },
    pose: "desk",
    bg: "from-[#5A0F12] via-[#2A0B0C] to-[#0B0606]",
    glow: "rgba(220,38,38,.55)",
    badge: "Tekshirilgan",
  },
  {
    tag: "AUKSION",
    title: <>O&apos;z narxingizni <span className="text-accent">taklif qiling</span></>,
    text: "Noyob akkauntlar auksionda. Eng yuqori taklif bergan oladi — oxirgi daqiqada vaqt uzayadi.",
    cta: { label: "Auksionga o'tish", href: "/auction" },
    pose: "point-right",
    bg: "from-[#4A2A05] via-[#22140A] to-[#0B0606]",
    glow: "rgba(255,200,61,.5)",
    badge: "Jonli",
  },
  {
    tag: "SOTISH",
    title: <>Akkauntingizni <span className="text-accent">pulga</span> aylantiring</>,
    text: "Adminga Telegramda yozing — akkauntni tekshirib, rasmlari bilan saytga joylaydi. Sotilganda pul balansingizda.",
    cta: { label: "Qanday sotiladi?", href: "/sell" },
    pose: "wave",
    bg: "from-[#3D0A1E] via-[#1F0A12] to-[#0B0606]",
    glow: "rgba(255,107,107,.5)",
    badge: "Tez",
  },
  {
    tag: "XAVFSIZLIK",
    title: <>Maxfiy <span className="text-accent">kod</span> — faqat sizga</>,
    text: "Sotib olgach maxfiy kod va akkaunt ID beriladi. Mas'ul admin kodni tekshirib, login/parolni shaxsan beradi.",
    cta: { label: "Batafsil", href: "/terms" },
    pose: "think",
    bg: "from-[#2A0A0A] via-[#160808] to-[#0B0606]",
    glow: "rgba(220,38,38,.45)",
    badge: "Maxfiy kod",
  },
];

const ok = new Map<string, boolean>();

function MascotImg({ pose, className }: { pose: Slide["pose"]; className: string }) {
  const src = `/mascot/${pose}.png`;
  const [show, setShow] = useState(ok.get(src) !== false);
  if (!show) return null;
  return (
    <img src={src} alt="" draggable={false}
      onLoad={() => ok.set(src, true)} onError={() => { ok.set(src, false); setShow(false); }}
      className={className} />
  );
}

export default function HeroSlider({ compact = false }: { compact?: boolean }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI(x => (x + d + n) % n), [n]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [paused, go, i]);

  const s = SLIDES[i];

  return (
    <section className={compact ? "relative pt-10 sm:pt-12" : "grid lg:grid-cols-[1fr_300px] gap-4"}>
      <div className="relative">
      {/* Ixcham banner: avatar kartadan tashqariga — boshi yuqoriga chiqib turadi */}
      {compact && (
        <div key={`pop-${s.pose}`} className="absolute z-20 right-0 sm:right-8 bottom-0 w-[60%] sm:w-[36%] sm:h-[128%] flex items-end justify-end pointer-events-none animate-fade-in">
          <MascotImg pose={s.pose}
            className="w-full h-auto sm:h-full sm:w-auto object-contain object-bottom drop-shadow-[0_18px_30px_rgba(0,0,0,.7)] select-none" />
        </div>
      )}
      {/* Asosiy slayder */}
      <div
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onTouchStart={e => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current; touch.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
        className={`relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br ${s.bg} ${compact ? "min-h-[170px] sm:min-h-[260px] rounded-2xl" : "min-h-[480px] sm:min-h-[340px]"} transition-colors duration-700`}>
        {/* fon bezaklari */}
        <div className="absolute inset-0 opacity-[.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${s.glow}, transparent 65%)` }} />
        {/* yorug'lik nurlari */}
        <div className="absolute right-[18%] -top-10 w-24 h-[140%] rotate-[24deg] bg-gradient-to-b from-white/10 to-transparent blur-md pointer-events-none" />
        <div className="absolute right-[32%] -top-10 w-10 h-[140%] rotate-[24deg] bg-gradient-to-b from-accent/15 to-transparent blur-md pointer-events-none" />

        {/* Avatar — banner ichida, o'ng tomonda, katta (to'liq bannerda) */}
        {!compact && <div key={s.pose} className={`absolute z-0 bottom-0 flex items-end justify-end pointer-events-none animate-fade-in ${compact ? "-right-2 sm:right-4 h-[100%] sm:h-[112%] w-[48%] sm:w-[40%]" : "-right-6 sm:right-0 h-[82%] sm:h-[108%] w-[88%] sm:w-[48%] opacity-60 sm:opacity-100"}`}>
          <MascotImg pose={s.pose}
            className="h-full w-auto object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,.6)] select-none" />
        </div>}
        {/* Telefonda: matn o'qilishi uchun avatar ustidan qorong'i parda */}
        <div className={`sm:hidden absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r ${compact ? "from-black/60 via-black/20" : "from-black/75 via-black/45"} to-transparent`} />
        {s.badge && !compact && (
          <span className="hidden sm:inline-flex absolute right-[30%] bottom-10 items-center rounded-2xl px-4 py-2 text-sm font-black text-white bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
            {s.badge}
          </span>
        )}

        {/* Matn */}
        <div key={`t${i}`} className={`relative animate-fade-in ${compact ? "z-30 p-4 pb-9 sm:p-8 sm:pb-10 max-w-[60%] sm:max-w-[56%]" : "z-10 p-6 sm:p-10 max-w-[560px] sm:max-w-[54%]"}`}>
          <span className="text-[11px] font-extrabold tracking-[.2em] text-white/60">{s.tag}</span>
          <h1 className={`font-black uppercase leading-[1.05] ${compact ? "mt-1 text-lg sm:text-3xl" : "mt-2 text-3xl sm:text-[44px]"}`}>{s.title}</h1>
          <p className={`text-white/70 max-w-md ${compact ? "hidden sm:block mt-1.5 text-sm line-clamp-2" : "mt-3 text-sm sm:text-base"}`}>{s.text}</p>
          <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : "mt-6 gap-3"}`}>
            {s.cta.href.startsWith("#")
              ? <a href={s.cta.href} className={`btn-accent ${compact ? "!py-1.5 !px-3 !text-[11px] sm:!py-2.5 sm:!px-5 sm:!text-sm" : ""}`}>{s.cta.label}</a>
              : <Link href={s.cta.href} className={`btn-accent ${compact ? "!py-1.5 !px-3 !text-[11px] sm:!py-2.5 sm:!px-5 sm:!text-sm" : ""}`}>{s.cta.label}</Link>}
            {s.cta2 && !compact && <Link href={s.cta2.href} className="btn-ghost !bg-black/40 backdrop-blur">{s.cta2.label}</Link>}
          </div>
        </div>

        {/* Nuqtalar */}
        <div className={`absolute z-10 flex gap-1.5 ${compact ? "bottom-3 left-4 sm:left-8" : "top-5 right-5 sm:right-8"}`}>
          {SLIDES.map((_, k) => (
            <button key={k} aria-label={`Slayd ${k + 1}`} onClick={() => setI(k)}
              className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`} />
          ))}
        </div>
        {/* Strelkalar */}
        <div className={`absolute z-10 bottom-5 right-5 sm:right-8 gap-2 ${compact ? "hidden" : "hidden sm:flex"}`}>
          {[-1, 1].map(d => (
            <button key={d} onClick={() => go(d)} aria-label={d < 0 ? "Oldingi" : "Keyingi"}
              className="w-10 h-10 rounded-xl bg-black/40 border border-white/15 backdrop-blur grid place-items-center text-white hover:bg-black/60">
              {d < 0 ? "‹" : "›"}
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Yon karta — auksion */}
      {!compact && <Link href="/auction"
        className="group relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-[#3A2306] via-[#1C1007] to-[#0B0606] min-h-[200px] lg:min-h-0 p-5 flex flex-col justify-end">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 30%, rgba(255,200,61,.35), transparent 60%)" }} />
        <div className="absolute inset-x-0 top-0 h-[70%] flex justify-center items-end pointer-events-none">
          <MascotImg pose="point-left" className="h-full w-auto object-contain object-bottom group-hover:scale-105 transition-transform duration-500" />
        </div>
        <span className="absolute top-4 left-4 chip bg-black/50 text-accent backdrop-blur gap-1.5"><Icon name="gavel" className="w-3.5 h-3.5" />Jonli auksion</span>
        <div className="relative rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md p-3 flex items-center justify-between">
          <div>
            <p className="font-black text-sm">Auksionda qatnashing</p>
            <p className="text-xs text-muted">Noyob akkauntlar — sizning narxingizda</p>
          </div>
          <span className="text-accent text-xl font-black group-hover:translate-x-1 transition-transform">›</span>
        </div>
      </Link>}
    </section>
  );
}
