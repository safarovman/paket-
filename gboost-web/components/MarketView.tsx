"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { GAMES, TELEGRAM_ADMIN, game, som, telegramLink, type Account } from "@/lib/uzdrop";
import AccountCard from "@/components/AccountCard";
import ImageCarousel from "@/components/ImageCarousel";
import AccountBindings from "@/components/AccountBindings";
import Icon, { GameIcon } from "@/components/Icon";
import HeroSlider from "@/components/HeroSlider";

export default function MarketView({ hero = false }: { hero?: boolean }) {
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
  const [filt, setFilt] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

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
    if (!user) { setNeedLogin(true); return; }
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("buy_account", { p_account: sel.id });
    if (error) { setMsg(errText(error)); setBusy(false); return; }
    setBought(data as string); setBusy(false); refresh(); load();
  };
  const close = () => { setSel(null); setBought(null); setMsg(""); setImg(0); setNeedLogin(false); };
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
      {/* Qidiruv (kichik) + filtr ikonkasi */}
      <div className="flex items-center gap-2 mb-3">
        <label className="relative flex-1 max-w-xl">
          <Icon name="search" className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input className="w-full h-10 rounded-full bg-panel border border-line pl-10 pr-4 text-sm outline-none focus:border-accent/60 placeholder:text-muted"
            placeholder="Akkauntlarni qidirish" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <div className="relative">
          <button onClick={() => setFilt(!filt)} aria-label="Filtr"
            className={`relative w-10 h-10 rounded-full border grid place-items-center transition-colors ${filt || sort !== "new" ? "bg-accent text-[#1B1400] border-accent" : "bg-panel border-line text-white hover:border-accent/60"}`}>
            <Icon name="filter" className="w-5 h-5" />
          </button>
          {filt && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setFilt(false)} />
              <div className="absolute right-0 top-12 z-40 w-48 panel p-1.5 shadow-2xl animate-fade-in">
                <p className="px-3 pt-1.5 pb-1 text-[10px] font-extrabold uppercase text-muted">Saralash</p>
                {([["new", "Yangilari"], ["cheap", "Arzonroq"], ["expensive", "Qimmatroq"]] as const).map(([id, l]) => (
                  <button key={id} onClick={() => { setSort(id); setFilt(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold ${sort === id ? "text-accent bg-accent/10" : "text-white/85 hover:bg-panel2"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Avatar banner (faqat bosh sahifada) — qidiruvdan keyin, akkauntlardan oldin */}
      {hero && <div className="mb-4"><HeroSlider compact /></div>}

      {/* O'yinlar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {[{ id: "all", name: "Barchasi" }, ...GAMES].map(x => (
          <button key={x.id} onClick={() => setG(x.id)}
            className={`chip !px-3 !py-1.5 whitespace-nowrap ${g === x.id ? "bg-accent text-[#1B1400]" : "bg-panel text-muted hover:text-white"}`}>
            {x.id !== "all" && <GameIcon game={x.id} className="w-3.5 h-3.5 mr-1" />}{x.name}
          </button>
        ))}
      </div>

      <div id="accounts" className="scroll-mt-24" />
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
                <Icon name="inbox" className="w-14 h-14 text-accent mx-auto" strokeWidth={1.6} />
                <p className="text-win font-black uppercase text-lg mt-2"><Icon name="check" className="w-5 h-5 mr-1.5" />Arizangiz qabul qilindi</p>
                <p className="mt-1 text-sm text-muted">{sel.title}</p>
                <p className="mt-3 inline-block rounded-xl border-2 border-dashed border-accent bg-accent/5 px-4 py-2 text-xl font-black tracking-widest text-accent">{bought}</p>
                <p className="text-sm text-white/80 mt-4">
                  Ariza ko&apos;rib chiqilmoqda. 5 daqiqa ichida adashgan bo&apos;lsangiz bekor qilishingiz mumkin.
                  Admin tasdiqlagach maxfiy kod va mas&apos;ul admin chiqadi.
                </p>
                <div className="grid gap-2 mt-5">
                  <Link href="/orders" className="btn-accent gap-2"><Icon name="inbox" />Arizalarim</Link>
                  <button onClick={close} className="btn-ghost">Yopish</button>
                </div>
              </div>
            ) : (
              <div className="relative max-w-[1400px] mx-auto">
                {/* Skrinshot: pastki qismi xira (blur) bo'lib eriydi, nomi va narxi o'sha joyda */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-panel">
                  {/* Orqa fon — joriy skrinshotning xira nusxasi */}
                  {gallery[img] && (
                    <img src={gallery[img]} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-70 transition-all duration-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />

                  {/* Rasm — butunligicha, pastki cheti blurga qo'shilib ketadi */}
                  <div className="relative aspect-video"
                    style={{ maskImage: "linear-gradient(to bottom, black 84%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black 84%, transparent)" }}>
                    {gallery.length
                      ? <ImageCarousel images={gallery} index={img} onIndex={setImg} alt={sel.title} interval={4000} dots={false} />
                      : <div className="absolute inset-0 grid place-items-center"><GameIcon game={sel.game} className="w-24 h-24" /></div>}
                  </div>
                  {gallery.length > 1 && [-1, 1].map(d => (
                    <button key={d} onClick={() => setImg((img + d + gallery.length) % gallery.length)}
                      aria-label={d < 0 ? "Oldingi" : "Keyingi"}
                      className={`absolute z-20 top-[28%] sm:top-[36%] -translate-y-1/2 ${d < 0 ? "left-3 sm:left-5" : "right-3 sm:right-5"} w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/25 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,.45)] grid place-items-center text-white transition-all hover:bg-accent hover:border-accent hover:text-[#1B1400] hover:scale-105 active:scale-95`}>
                      <svg viewBox="0 0 24 24" className={`w-5 h-5 sm:w-7 sm:h-7 ${d < 0 ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}

                  {/* Nomi, narxi — blur ustida, rasmning pastki qismiga kirib turadi */}
                  <div className="relative z-10 -mt-6 sm:-mt-12 px-4 sm:px-7 pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
                    <div className="flex-1 min-w-0">
                      <span className="chip bg-black/40 backdrop-blur text-white/80"><GameIcon game={sel.game} className="w-3.5 h-3.5 mr-1" />{game(sel.game).name}</span>
                      <h2 className="text-2xl sm:text-4xl font-black mt-2 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,.8)]">{sel.title}</h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-white/75">
                        {sel.public_no != null && <span>ID <b className="text-white">#{sel.public_no}</b></span>}
                        {sel.rank && <span>Rank <b className="text-white">{sel.rank}</b></span>}
                        {sel.level != null && <span>Level <b className="text-white">{sel.level}</b></span>}
                      </div>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-3xl sm:text-4xl font-black text-accent drop-shadow-[0_2px_8px_rgba(0,0,0,.8)]">{som(sel.price)}</p>
                    </div>
                  </div>

                  {gallery.length > 1 && (
                    <div className="relative z-10 flex gap-1.5 overflow-x-auto px-4 sm:px-7 pb-4">
                      {gallery.map((u, i) => (
                        <button key={u + i} onClick={() => setImg(i)} className={`shrink-0 w-20 sm:w-28 aspect-video rounded-md overflow-hidden border-2 bg-black/40 ${i === img ? "border-accent" : "border-transparent opacity-60"}`}>
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
                      <p className="text-xs font-extrabold uppercase text-muted mb-2">Tavsif</p>
                      {sel.description
                        ? <div className="rounded-xl bg-bg/70 border border-line p-3 text-sm text-white/85 whitespace-pre-line max-h-60 overflow-y-auto">{sel.description}</div>
                        : <p className="text-sm text-muted">Qo&apos;shimcha tavsif yo&apos;q. Savollar bo&apos;lsa adminga yozing.</p>}
                      {user && <div className="flex justify-between text-sm mt-3"><span className="text-muted">Balansingiz</span><b>{som(profile?.balance)}</b></div>}
                    </div>
                    <div className="space-y-3">
                      <AccountBindings bindings={sel.bindings} origin={sel.origin} />
                      <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
                        <p className="text-sm">
                          Qo&apos;shimcha ma&apos;lumot kerak bo&apos;lsa — Telegram orqali adminga murojaat qiling:
                          {" "}<b className="text-accent">@{TELEGRAM_ADMIN}</b>
                        </p>
                        <a href={telegramLink(`Salom! #${sel.public_no ?? ""} akkaunt haqida savolim bor`)} target="_blank" rel="noopener noreferrer"
                          className="btn-ghost !py-2 w-full mt-2 gap-2"><Icon name="send" />Telegramda yozish</a>
                      </div>
                    </div>
                  </div>

                  {needLogin && !user && (
                    <div className="mt-5 rounded-xl border border-accent/40 bg-accent/10 p-3 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
                      <p className="text-sm flex-1"><Icon name="lock" className="w-4 h-4 mr-1.5 text-accent" />Sotib olish uchun avval <b>ro&apos;yxatdan o&apos;tishingiz</b> kerak.</p>
                      <div className="flex gap-2 shrink-0">
                        <Link href="/register" className="btn-accent !py-2 !px-4 !text-sm">Ro&apos;yxatdan o&apos;tish</Link>
                        <Link href="/login" className="btn-ghost !py-2 !px-4 !text-sm">Kirish</Link>
                      </div>
                    </div>
                  )}

                  {/* Sotib olish — pastki o'ng burchakda, kichik */}
                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4">
                    {msg && <p className="text-lose text-sm font-bold sm:mr-auto">{msg}</p>}
                    <p className="text-[11px] text-muted sm:text-right sm:max-w-xs">Sotib olgach ariza yaratiladi. 5 daqiqa ichida bekor qilishingiz mumkin, keyin admin tasdiqlaydi.</p>
                    {(profile?.balance ?? 0) < sel.price && user
                      ? <Link href="/wallet" className="btn-accent !py-2 !px-5 !text-sm self-end shrink-0">Balansni to&apos;ldirish</Link>
                      : <button onClick={buy} disabled={busy} className="btn-accent !py-2 !px-5 !text-sm self-end shrink-0 gap-2"><Icon name="cart" />{busy ? "…" : `Sotib olish • ${som(sel.price)}`}</button>}
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

