"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { GAMES, TELEGRAM_ADMIN, game, som, telegramLink, type Account } from "@/lib/uzdrop";
import AccountCard from "@/components/AccountCard";
import GameFrame from "@/components/GameFrame";
import ImageCarousel from "@/components/ImageCarousel";
import Mascot from "@/components/Mascot";
import AccountBindings from "@/components/AccountBindings";

function Market() {
  const params = useSearchParams();
  const { user, profile, refresh } = useUser();
  const [list, setList] = useState<Account[] | null>(null);
  const [g, setG] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "cheap" | "expensive">("new");
  const [sel, setSel] = useState<Account | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [bought, setBought] = useState<string | null>(null);
  const [img, setImg] = useState(0);

  const load = () => supabase.from("accounts").select("*").eq("status", "active").order("created_at", { ascending: false })
    .then(({ data }) => {
      setList((data as Account[]) || []);
      const id = params.get("id");
      if (id) { const a = (data as Account[] | null)?.find(x => x.id === id); if (a) setSel(a); }
    });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const shown = useMemo(() => {
    let l = (list || []).filter(a => (g === "all" || a.game === g) &&
      (!q || (a.title + " " + (a.rank || "") + " " + (a.description || "")).toLowerCase().includes(q.toLowerCase())));
    if (sort === "cheap") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "expensive") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [list, g, q, sort]);

  const buy = async () => {
    if (!sel) return;
    if (!user) { window.location.href = "/login"; return; }
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("buy_account", { p_account: sel.id });
    if (error) { setMsg(errText(error)); setBusy(false); return; }
    setBought(data as string); setBusy(false); refresh(); load();
  };
  const close = () => { setSel(null); setBought(null); setMsg(""); setImg(0); };
  const gallery = sel ? (sel.images?.length ? sel.images : sel.image_url ? [sel.image_url] : []) : [];

  // To'liq ekranli oyna: Esc — yopish, ← → — rasmlarni almashtirish, orqa sahifa aylanmaydi
  useEffect(() => {
    if (!sel) return;
    const n = gallery.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (n > 1 && e.key === "ArrowRight") setImg(i => (i + 1) % n);
      else if (n > 1 && e.key === "ArrowLeft") setImg(i => (i - 1 + n) % n);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.id, gallery.length]);

  return (
    <div className="wrap py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="h-title">Akkauntlar bozori</h1>
          <p className="text-muted text-sm">Admin tekshirgan akkauntlar — rasmni bosing, batafsil ma&apos;lumot ochiladi</p>
        </div>
        <Link href="/sell" className="btn-violet">+ Akkaunt sotish</Link>
      </div>

      <Mascot id="market-intro" pose="think" className="mb-5"
        text={<>Kerakli akkauntni toping va rasmini bosing. Sotib olsangiz <b className="text-accent">ariza</b> yaratiladi — 5 daqiqa ichida bekor qilishingiz mumkin. Admin tasdiqlagach <b className="text-accent">maxfiy kod</b> va mas&apos;ul admin chiqadi.</>} />

      <div className="panel p-3 flex flex-col lg:flex-row gap-3 mb-5">
        <input className="input lg:max-w-xs" placeholder="Qidirish: rank, skin, nom…" value={q} onChange={e => setQ(e.target.value)} />
        <div className="flex gap-1.5 overflow-x-auto">
          {[{ id: "all", name: "Barchasi", icon: "🎮" }, ...GAMES].map(x => (
            <button key={x.id} onClick={() => setG(x.id)}
              className={`chip !px-3 !py-2 whitespace-nowrap ${g === x.id ? "bg-accent text-[#1B1400]" : "bg-bg text-muted hover:text-white"}`}>
              {x.icon} {x.name}
            </button>
          ))}
        </div>
        <select className="input lg:w-44 lg:ml-auto" value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="new">Yangilari</option><option value="cheap">Arzonlari</option><option value="expensive">Qimmatlari</option>
        </select>
      </div>

      {list === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="panel aspect-video animate-pulse" />)}</div>
      ) : shown.length === 0 ? (
        <div className="panel p-12 text-center text-muted">Hech narsa topilmadi</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {shown.map(a => <AccountCard key={a.id} a={a} onClick={() => setSel(a)} />)}
        </div>
      )}

      {sel && (
        <div className="fixed inset-0 z-[60] bg-black/95 animate-fade-in overflow-y-auto" onClick={close}>
          <div className="w-full min-h-full bg-bg px-4 sm:px-8 lg:px-12 py-4 sm:py-6" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-30 flex justify-end -mx-2 mb-2">
              <button onClick={close} className="w-11 h-11 rounded-full bg-panel2 border border-line text-white text-2xl leading-none hover:bg-line" aria-label="Yopish">×</button>
            </div>
            {bought ? (
              <div className="text-center max-w-md mx-auto py-4">
                <p className="text-5xl">📥</p>
                <p className="text-win font-black uppercase text-lg mt-2">✅ Arizangiz qabul qilindi</p>
                <p className="mt-1 text-sm text-muted">{sel.title}</p>
                <p className="mt-3 inline-block rounded-xl border-2 border-dashed border-accent bg-accent/5 px-4 py-2 text-xl font-black tracking-widest text-accent">{bought}</p>
                <p className="text-sm text-white/80 mt-4">
                  Ariza ko&apos;rib chiqilmoqda. 5 daqiqa ichida adashgan bo&apos;lsangiz bekor qilishingiz mumkin.
                  Admin tasdiqlagach maxfiy kod va mas&apos;ul admin chiqadi.
                </p>
                <div className="grid gap-2 mt-5">
                  <Link href="/orders" className="btn-accent">📥 Arizalarim</Link>
                  <button onClick={close} className="btn-ghost">Yopish</button>
                </div>
              </div>
            ) : (
              <div className="relative max-w-[1400px] mx-auto">
                {/* Orqa fon: joriy skrinshotning xira (blur) nusxasi — rasm va yozuvlar orasini yumshoq bog'laydi */}
                <div aria-hidden className="pointer-events-none absolute -inset-x-10 -top-6 h-[calc(100%+2rem)] overflow-hidden"
                  style={{ maskImage: "radial-gradient(ellipse 60% 55% at 50% 55%, black 40%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 55%, black 40%, transparent 100%)" }}>
                  {gallery[img]
                    ? <img src={gallery[img]} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-40 transition-all duration-700" />
                    : <div className="w-full h-full bg-gradient-to-b from-violet/30 to-transparent blur-3xl" />}
                </div>

                {/* Rasm — katta, to'liq kenglikda */}
                <div className="relative z-10">
                  <GameFrame game={sel.game} frame="none" className="w-full rounded-2xl overflow-hidden bg-bg border border-white/10">
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#2a1015] to-[#0b0606]">
                      {gallery.length
                        ? <ImageCarousel images={gallery} index={img} onIndex={setImg} alt={sel.title} interval={3500} />
                        : <span className="text-8xl">{game(sel.game).icon}</span>}
                    </div>
                    {gallery.length > 1 && [-1, 1].map(d => (
                      <button key={d} onClick={() => setImg((img + d + gallery.length) % gallery.length)}
                        aria-label={d < 0 ? "Oldingi" : "Keyingi"}
                        className={`absolute z-20 top-1/2 -translate-y-1/2 ${d < 0 ? "left-3 sm:left-5" : "right-3 sm:right-5"} w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 backdrop-blur text-white text-2xl grid place-items-center hover:bg-black/85`}>
                        {d < 0 ? "‹" : "›"}
                      </button>
                    ))}
                  </GameFrame>
                  {gallery.length > 1 && (
                    <div className="flex gap-1.5 mt-3 overflow-x-auto justify-center">
                      {gallery.map((u, i) => (
                        <button key={u + i} onClick={() => setImg(i)} className={`shrink-0 w-20 sm:w-28 aspect-video rounded-md overflow-hidden border-2 ${i === img ? "border-accent" : "border-transparent opacity-60"}`}>
                          <img src={u} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ma'lumot — rasm ostida, xira shisha (blur) panelda */}
                <div className="relative z-10 mt-6 rounded-2xl border border-white/10 bg-bg/50 backdrop-blur-xl p-4 sm:p-6">
                  <div className="grid md:grid-cols-2 gap-5 lg:gap-8">
                    <div>
                      <span className="chip bg-bg text-muted">{game(sel.game).icon} {game(sel.game).name}</span>
                      <h2 className="text-2xl sm:text-3xl font-black mt-2 leading-tight">{sel.title}</h2>
                      <p className="text-3xl font-black text-accent mt-2">{som(sel.price)}</p>
                      <div className="mt-3 space-y-1.5 text-sm">
                        {sel.public_no != null && <div className="flex justify-between"><span className="text-muted">Akkaunt ID</span><b>#{sel.public_no}</b></div>}
                        {sel.rank && <div className="flex justify-between"><span className="text-muted">Rank</span><b>{sel.rank}</b></div>}
                        {sel.level != null && <div className="flex justify-between"><span className="text-muted">Daraja (level)</span><b>{sel.level}</b></div>}
                        {user && <div className="flex justify-between"><span className="text-muted">Balansingiz</span><b>{som(profile?.balance)}</b></div>}
                      </div>
                      {sel.description && (
                        <div className="mt-3 rounded-xl bg-bg/70 border border-line p-3 text-sm text-white/85 whitespace-pre-line max-h-48 overflow-y-auto">{sel.description}</div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <AccountBindings bindings={sel.bindings} origin={sel.origin} />
                      <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
                        <p className="text-sm">
                          Qo&apos;shimcha ma&apos;lumot kerak bo&apos;lsa — Telegram orqali adminga murojaat qiling:
                          {" "}<b className="text-accent">@{TELEGRAM_ADMIN}</b>
                        </p>
                        <a href={telegramLink(`Salom! #${sel.public_no ?? ""} akkaunt haqida savolim bor`)} target="_blank" rel="noopener noreferrer"
                          className="btn-ghost !py-2 w-full mt-2">✈️ Telegramda yozish</a>
                      </div>
                    </div>
                  </div>

                  {/* Sotib olish — pastki o'ng burchakda, kichik */}
                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4">
                    {msg && <p className="text-lose text-sm font-bold sm:mr-auto">{msg}</p>}
                    <p className="text-[11px] text-muted sm:text-right sm:max-w-xs">Sotib olgach ariza yaratiladi. 5 daqiqa ichida bekor qilishingiz mumkin, keyin admin tasdiqlaydi.</p>
                    {!user
                      ? <Link href="/login" className="btn-accent !py-2 !px-5 !text-sm self-end shrink-0">Sotib olish uchun kiring</Link>
                      : (profile?.balance ?? 0) < sel.price
                        ? <Link href="/wallet" className="btn-accent !py-2 !px-5 !text-sm self-end shrink-0">Balansni to&apos;ldirish</Link>
                        : <button onClick={buy} disabled={busy} className="btn-accent !py-2 !px-5 !text-sm self-end shrink-0">{busy ? "…" : `🛒 Sotib olish • ${som(sel.price)}`}</button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() { return <Suspense><Market /></Suspense>; }
