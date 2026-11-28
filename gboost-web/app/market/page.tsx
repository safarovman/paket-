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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="panel aspect-video animate-pulse" />)}</div>
      ) : shown.length === 0 ? (
        <div className="panel p-12 text-center text-muted">Hech narsa topilmadi</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {shown.map(a => <AccountCard key={a.id} a={a} onClick={() => setSel(a)} />)}
        </div>
      )}

      {sel && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm sm:grid sm:place-items-center sm:p-6 animate-fade-in overflow-y-auto" onClick={close}>
          <div className="panel w-full min-h-full sm:min-h-0 rounded-none sm:rounded-2xl max-w-5xl p-4 sm:p-6 sm:my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end -mt-1 -mr-1 mb-1">
              <button onClick={close} className="text-muted hover:text-white text-2xl leading-none" aria-label="Yopish">×</button>
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
              <div className="grid md:grid-cols-[1.5fr_1fr] gap-5 md:gap-6">
                {/* Rasm */}
                <div>
                  <GameFrame game={sel.game} frame={sel.frame} className="w-full rounded-xl overflow-hidden bg-bg">
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#2a1015] to-[#0b0606]">
                      {gallery.length
                        ? <ImageCarousel images={gallery} index={img} onIndex={setImg} alt={sel.title} interval={3500} />
                        : <span className="text-7xl">{game(sel.game).icon}</span>}
                    </div>
                    {gallery.length > 1 && [-1, 1].map(d => (
                      <button key={d} onClick={() => setImg((img + d + gallery.length) % gallery.length)}
                        aria-label={d < 0 ? "Oldingi" : "Keyingi"}
                        className={`absolute z-20 top-1/2 -translate-y-1/2 ${d < 0 ? "left-[7%]" : "right-[7%]"} w-9 h-9 rounded-full bg-black/65 text-white text-xl grid place-items-center hover:bg-black/85`}>
                        {d < 0 ? "‹" : "›"}
                      </button>
                    ))}
                  </GameFrame>
                  {gallery.length > 1 && (
                    <div className="flex gap-1.5 mt-2 overflow-x-auto">
                      {gallery.map((u, i) => (
                        <button key={u + i} onClick={() => setImg(i)} className={`shrink-0 w-24 sm:w-28 aspect-video rounded-md overflow-hidden border-2 ${i === img ? "border-accent" : "border-transparent opacity-60"}`}>
                          <img src={u} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ma'lumot */}
                <div className="flex flex-col">
                  <span className="chip bg-bg text-muted self-start">{game(sel.game).icon} {game(sel.game).name}</span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-2 leading-tight">{sel.title}</h2>
                  <p className="text-3xl font-black text-accent mt-2">{som(sel.price)}</p>
                  <div className="mt-3 space-y-1.5 text-sm">
                    {sel.public_no != null && <div className="flex justify-between"><span className="text-muted">Akkaunt ID</span><b>#{sel.public_no}</b></div>}
                    {sel.rank && <div className="flex justify-between"><span className="text-muted">Rank</span><b>{sel.rank}</b></div>}
                    {sel.level != null && <div className="flex justify-between"><span className="text-muted">Daraja (level)</span><b>{sel.level}</b></div>}
                    {user && <div className="flex justify-between"><span className="text-muted">Balansingiz</span><b>{som(profile?.balance)}</b></div>}
                  </div>
                  <div className="mt-3"><AccountBindings bindings={sel.bindings} origin={sel.origin} /></div>
                  {sel.description && (
                    <div className="mt-3 rounded-xl bg-bg border border-line p-3 text-sm text-white/85 whitespace-pre-line max-h-48 overflow-y-auto">{sel.description}</div>
                  )}

                  <div className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3">
                    <p className="text-sm">
                      Qo&apos;shimcha ma&apos;lumot kerak bo&apos;lsa — Telegram orqali adminga murojaat qiling:
                      {" "}<b className="text-accent">@{TELEGRAM_ADMIN}</b>
                    </p>
                    <a href={telegramLink(`Salom! #${sel.public_no ?? ""} akkaunt haqida savolim bor`)} target="_blank" rel="noopener noreferrer"
                      className="btn-ghost !py-2 w-full mt-2">✈️ Telegramda yozish</a>
                  </div>

                  {msg && <p className="text-lose text-sm font-bold mt-3">{msg}</p>}
                  <div className="grid gap-2 mt-4 md:mt-auto md:pt-4">
                    {!user
                      ? <Link href="/login" className="btn-accent">Sotib olish uchun kiring</Link>
                      : (profile?.balance ?? 0) < sel.price
                        ? <Link href="/wallet" className="btn-accent">Balansni to&apos;ldirish</Link>
                        : <button onClick={buy} disabled={busy} className="btn-accent text-base">{busy ? "…" : `Sotib olish • ${som(sel.price)}`}</button>}
                    <p className="text-[11px] text-muted text-center">Sotib olgach ariza yaratiladi. 5 daqiqa ichida bekor qilishingiz mumkin, keyin admin tasdiqlaydi.</p>
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
