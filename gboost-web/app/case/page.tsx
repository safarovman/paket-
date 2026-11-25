"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { chances, game, rarity, som, type Account, type Case } from "@/lib/uzdrop";
import AccountCard from "@/components/AccountCard";
import CaseArt from "@/components/CaseArt";
import CodeCard from "@/components/CodeCard";

type Item = Pick<Account, "id" | "title" | "game" | "rank" | "image_url" | "price">;
const CELL = 148;          // bitta katak eni (px), oraliq bilan
const WIN_INDEX = 42;      // lentadagi yutuq joyi
const STRIP = 50;

function CasePage() {
  const id = useSearchParams().get("id") || "";
  const { user, profile, refresh } = useUser();
  const [c, setC] = useState<Case | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [strip, setStrip] = useState<Item[]>([]);
  const [offset, setOffset] = useState(0);
  const [anim, setAnim] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<Item | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<{ code: string; title: string } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [{ data: cs }, { data: acc }] = await Promise.all([
      supabase.from("cases").select("*").eq("id", id).maybeSingle(),
      supabase.from("accounts").select("id,title,game,rank,image_url,price").eq("case_id", id).eq("status", "pool").order("price", { ascending: false }),
    ]);
    setC(cs as Case);
    setItems((acc as Item[]) || []);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const p = chances(items);
  const pick = () => {
    let r = Math.random(); for (let i = 0; i < items.length; i++) { r -= p[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  useEffect(() => { if (items.length && !spinning) setStrip(Array.from({ length: STRIP }, pick)); /* eslint-disable-next-line */ }, [items]);

  const open = async () => {
    if (!user) { window.location.href = "/login"; return; }
    if (!c) return;
    setMsg(""); setWon(null); setSpinning(true);
    const { data, error } = await supabase.rpc("open_case", { p_case: c.id });
    if (error) { setMsg(errText(error)); setSpinning(false); return; }
    const prize = (Array.isArray(data) ? data[0] : data) as Item;
    refresh();

    // lentani tayyorlash va aylantirish
    const s = Array.from({ length: STRIP }, pick);
    s[WIN_INDEX] = prize;
    setAnim(false); setOffset(0); setStrip(s);
    const w = boxRef.current?.clientWidth ?? 800;
    const jitter = (Math.random() - 0.5) * 110;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnim(true);
      setOffset(WIN_INDEX * CELL + 70 - w / 2 + jitter);
    }));
    setTimeout(() => { setWon(prize); setSpinning(false); }, 6600);
  };

  const sell = async () => {
    if (!won) return; setBusy(true);
    const { error } = await supabase.rpc("sell_won", { p_account: won.id });
    setBusy(false);
    if (error) { setMsg(errText(error)); return; }
    setMsg(`✅ ${som(won.price)} balansingizga qo'shildi`); setWon(null); refresh(); load();
  };
  const keep = async () => {
    if (!won) return; setBusy(true);
    const { data, error } = await supabase.rpc("claim_won", { p_account: won.id });
    setBusy(false);
    if (error) { setMsg(errText(error)); return; }
    setCode({ code: data as string, title: won.title }); setWon(null);
  };

  if (!c) return <div className="wrap py-20 text-center text-muted">Yuklanmoqda…</div>;
  const g = game(c.game);
  const enough = (profile?.balance ?? 0) >= c.price;

  return (
    <div className="wrap py-6">
      <Link href="/" className="text-sm text-muted hover:text-white">← Barcha keyslar</Link>

      <div className="text-center mt-4">
        <div className="inline-block">{c.image_url ? <img src={c.image_url} alt="" className="h-28 mx-auto" /> : <CaseArt color={c.color} icon={g.icon} />}</div>
        <h1 className="h-title mt-3">{c.name}</h1>
        <p className="text-muted text-sm">{g.icon} {g.name} • {items.length} ta akkaunt</p>
      </div>

      {/* Ruletka */}
      <div ref={boxRef} className="relative mt-6 h-[210px] rounded-2xl border border-line bg-[#080B14] overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[#080B14] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[#080B14] to-transparent" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-accent z-20 shadow-[0_0_16px_#FFC83D]" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 z-20 w-0 h-0 border-x-[10px] border-x-transparent border-t-[12px] border-t-accent" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-20 w-0 h-0 border-x-[10px] border-x-transparent border-b-[12px] border-b-accent" />
        {items.length === 0 ? (
          <p className="h-full grid place-items-center text-muted">Keys hozircha bo&apos;sh</p>
        ) : (
          <div className="flex gap-2 h-full items-center px-0"
            style={{
              transform: `translateX(${-offset}px)`,
              transition: anim ? "transform 6.2s cubic-bezier(.08,.6,.12,1)" : "none",
            }}>
            {strip.map((it, i) => {
              const r = rarity(it.price);
              return (
                <div key={i} className="relative shrink-0 w-[140px] h-[170px] rounded-xl bg-panel overflow-hidden flex flex-col items-center justify-center p-2">
                  <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 40%, ${r.color}, transparent 70%)` }} />
                  <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: r.color }} />
                  {it.image_url ? <img src={it.image_url} alt="" className="relative h-16 object-contain" /> : <span className="relative text-4xl">{game(it.game).icon}</span>}
                  <p className="relative text-[11px] font-bold text-center mt-2 line-clamp-2">{it.title}</p>
                  <p className="relative text-[11px] font-black" style={{ color: r.color }}>{som(it.price)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 mt-6">
        {user && !enough && !spinning ? (
          <Link href="/wallet" className="btn-accent min-w-[260px]">Balansni to&apos;ldirish</Link>
        ) : (
          <button onClick={open} disabled={spinning || items.length === 0} className="btn-accent min-w-[260px] text-base">
            {spinning ? "Aylanmoqda…" : user ? `Ochish • ${som(c.price)}` : "Ochish uchun kiring"}
          </button>
        )}
        {msg && <p className="text-sm font-bold text-center">{msg}</p>}
      </div>

      {/* Yutuq oynasi */}
      {won && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4 animate-fade-in">
          <div className="panel w-full max-w-sm p-6 text-center">
            <p className="text-xs font-extrabold uppercase text-muted">Siz yutdingiz!</p>
            <div className="my-4"><AccountCard a={won} /></div>
            <div className="grid gap-2">
              <button onClick={sell} disabled={busy} className="btn-win">⚡ Sotish +{som(won.price)}</button>
              <button onClick={keep} disabled={busy} className="btn-violet">Akkauntni olish</button>
              <button onClick={() => setWon(null)} className="btn-ghost">Keyinroq (inventarda qoladi)</button>
            </div>
          </div>
        </div>
      )}

      {code && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4 animate-fade-in" onClick={() => setCode(null)}>
          <div className="panel w-full max-w-sm p-6 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <p className="font-black text-center mb-3">🎉 {code.title}</p>
            <CodeCard code={code.code} kind="spin" title={code.title} />
            <button onClick={() => setCode(null)} className="btn-ghost w-full mt-3">Yopish</button>
          </div>
        </div>
      )}

      {/* Keys ichidagilar */}
      <h2 className="h-title mt-12 mb-4">Keys ichida</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((it, i) => (
          <AccountCard key={it.id} a={it} compact
            footer={<p className="text-[11px] text-muted">Ehtimol: <b className="text-white">{(p[i] * 100).toFixed(p[i] < 0.01 ? 2 : 1)}%</b></p>} />
        ))}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><CasePage /></Suspense>; }
