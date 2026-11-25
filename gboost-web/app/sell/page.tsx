"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { COMMISSION, GAMES, som } from "@/lib/uzdrop";

function Sell() {
  const params = useSearchParams();
  const { user } = useUser();
  const [quick, setQuick] = useState(params.get("quick") === "1");
  useEffect(() => { setQuick(params.get("quick") === "1"); }, [params]);

  const [f, setF] = useState({ game: "standoff2", title: "", rank: "", level: "", description: "", image_url: "", price: "", login: "", password: "", extra: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const price = parseInt(f.price.replace(/\D/g, "")) || 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!f.title.trim()) return setErr("Sarlavhani kiriting");
    if (price < 1000) return setErr("Narxni kiriting (kamida 1 000 so'm)");
    setBusy(true);
    const { error } = await supabase.rpc("submit_account", {
      p_kind: quick ? "quick" : "market", p_game: f.game, p_title: f.title.trim(), p_description: f.description.trim() || null,
      p_rank: f.rank.trim() || null, p_level: f.level ? parseInt(f.level) : null, p_image_url: f.image_url.trim() || null,
      p_price: price, p_login: f.login.trim(), p_password: f.password, p_extra: f.extra.trim() || null,
    });
    setBusy(false);
    if (error) return setErr(errText(error));
    setDone(true);
  };

  if (!user) return (
    <div className="wrap py-20 text-center">
      <p className="text-5xl">💰</p><h1 className="h-title mt-3">Akkaunt sotish</h1>
      <p className="text-muted mt-2 mb-6">Sotish uchun avval tizimga kiring</p>
      <Link href="/login" className="btn-accent">Kirish</Link>
    </div>
  );

  if (done) return (
    <div className="wrap py-20 text-center max-w-lg">
      <p className="text-6xl">{quick ? "⚡" : "✅"}</p>
      <h1 className="h-title mt-3">So&apos;rov yuborildi!</h1>
      <p className="text-muted mt-2">
        {quick
          ? "Admin akkauntni tekshiradi va pul balansingizga darhol tushadi. Shu pulga spin qilishingiz mumkin."
          : "Admin tekshirgandan so'ng e'loningiz bozorda paydo bo'ladi. Sotilganda pul balansingizga tushadi."}
      </p>
      <div className="flex gap-3 justify-center mt-6">
        <Link href="/profile" className="btn-violet">E&apos;lonlarim</Link>
        <button onClick={() => { setDone(false); setF({ ...f, title: "", login: "", password: "", extra: "", description: "" }); }} className="btn-ghost">Yana sotish</button>
      </div>
    </div>
  );

  return (
    <div className="wrap py-6 max-w-3xl">
      <h1 className="h-title mb-4">Akkauntni sotish</h1>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {[
          { q: false, i: "🛒", t: "Bozorga qo'yish", d: `O'zingiz narx qo'yasiz. Sotilganda ${100 - COMMISSION * 100}% sizga.` },
          { q: true,  i: "⚡", t: "Tez sotish",      d: "UzDrop akkauntni o'zi sotib oladi — kutish yo'q, pul darhol balansga." },
        ].map(o => (
          <button key={o.t} type="button" onClick={() => setQuick(o.q)}
            className={`panel p-4 text-left transition-colors ${quick === o.q ? "!border-accent bg-accent/5" : "hover:border-violet"}`}>
            <p className="text-2xl">{o.i}</p>
            <p className="font-black uppercase mt-1">{o.t}</p>
            <p className="text-xs text-muted mt-1">{o.d}</p>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="panel p-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">O&apos;yin</label>
          <select className="input" value={f.game} onChange={set("game")}>
            {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select>
        </div>
        <div><label className="label">Sarlavha *</label><input className="input" placeholder="Masalan: 15 ta pichoq, Gold rank" value={f.title} onChange={set("title")} /></div>
        <div><label className="label">Rank / unvon</label><input className="input" placeholder="Legendary, Conqueror…" value={f.rank} onChange={set("rank")} /></div>
        <div><label className="label">Daraja (level)</label><input className="input" inputMode="numeric" value={f.level} onChange={set("level")} /></div>
        <div className="sm:col-span-2">
          <label className="label">Tavsif</label>
          <textarea className="input min-h-[90px]" placeholder="Skinlar, qahramonlar, bog'langan pochta va h.k." value={f.description} onChange={set("description")} />
        </div>
        <div className="sm:col-span-2"><label className="label">Rasm havolasi (ixtiyoriy)</label><input className="input" placeholder="https://…" value={f.image_url} onChange={set("image_url")} /></div>
        <div className="sm:col-span-2">
          <label className="label">{quick ? "Qancha so'raysiz? *" : "Sotuv narxi *"}</label>
          <input className="input text-lg font-black" inputMode="numeric" placeholder="100 000" value={f.price} onChange={set("price")} />
          {price > 0 && (
            <p className="text-xs text-muted mt-1.5">
              {quick
                ? <>Admin narxni tekshirib, adolatli taklif beradi (odatda so&apos;ralgan narx). Tasdiqlangach <b className="text-win">darhol</b> balansga tushadi.</>
                : <>Sotilganda sizga: <b className="text-win">{som(Math.floor(price * (1 - COMMISSION)))}</b> (komissiya {COMMISSION * 100}%)</>}
            </p>
          )}
        </div>

        <div className="sm:col-span-2 border-t border-line pt-4">
          <p className="font-extrabold text-sm">🔒 Akkauntga kirish ma&apos;lumotlari</p>
          <p className="text-xs text-muted">Faqat admin va xaridorga ko&apos;rinadi. Xaridgacha hech kimga ochilmaydi.</p>
        </div>
        <div><label className="label">Login / Email / ID *</label><input className="input" value={f.login} onChange={set("login")} autoComplete="off" /></div>
        <div><label className="label">Parol *</label><input className="input" value={f.password} onChange={set("password")} autoComplete="off" /></div>
        <div className="sm:col-span-2"><label className="label">Qo&apos;shimcha (pochta paroli, kodlar)</label><input className="input" value={f.extra} onChange={set("extra")} autoComplete="off" /></div>

        {err && <p className="sm:col-span-2 text-lose text-sm font-bold">{err}</p>}
        <button disabled={busy} className={`${quick ? "btn-accent" : "btn-violet"} sm:col-span-2`}>
          {busy ? "Yuborilmoqda…" : quick ? "⚡ Tez sotish" : "Bozorga qo'yish"}
        </button>
      </form>
    </div>
  );
}

export default function Page() { return <Suspense><Sell /></Suspense>; }
