"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { accNo, ago, som } from "@/lib/uzdrop";
import AccountCard from "@/components/AccountCard";
import Countdown from "./Countdown";
import type { AuctionBid, AuctionItem } from "./types";

const fmt = (n: number) => (n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "");
const digits = (s: string) => Number(s.replace(/\D/g, "")) || 0;

export default function AuctionCard({ a, onChanged }: { a: AuctionItem; onChanged: () => void }) {
  const { user, profile, refresh } = useUser();
  const [amount, setAmount] = useState(a.min_next);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [showBids, setShowBids] = useState(false);
  const [bids, setBids] = useState<AuctionBid[] | null>(null);

  // Yangi taklif kelganda minimal summani yangilash
  useEffect(() => { setAmount(v => (v < a.min_next ? a.min_next : v)); }, [a.min_next]);

  const loadBids = async () => {
    const { data } = await supabase.rpc("auction_bids", { p_auction: a.id });
    setBids((data as AuctionBid[]) || []);
  };
  useEffect(() => { if (showBids) loadBids(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [showBids, a.bids_count]);

  const bid = async () => {
    if (!user) { window.location.href = "/login/"; return; }
    setMsg(null);
    if (amount < a.min_next) return setMsg({ ok: false, t: `Taklif kamida ${som(a.min_next)}` });
    setBusy(true);
    const { error } = await supabase.rpc("place_bid", { p_auction: a.id, p_amount: amount });
    setBusy(false);
    if (error) return setMsg({ ok: false, t: errText(error) });
    setMsg({ ok: true, t: `✅ Taklifingiz qabul qilindi: ${som(amount)}` });
    await refresh();
    onChanged();
  };

  // O'z taklifini oshirganda faqat farq yechiladi
  const charge = a.is_mine_leading && a.current_bid ? amount - a.current_bid : amount;

  return (
    <div className="panel p-4 grid md:grid-cols-[240px_1fr] gap-4">
      <AccountCard a={a.account} compact />

      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-black text-lg truncate">{accNo(a.account.public_no)} {a.account.title}</p>
          <span className="chip bg-lose/15 text-lose">🔨 Jonli auksion</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-bg border border-line p-2">
            <p className="text-[10px] uppercase font-bold text-muted">Joriy taklif</p>
            <p className="font-black text-accent">{a.current_bid ? som(a.current_bid) : "—"}</p>
          </div>
          <div className="rounded-xl bg-bg border border-line p-2">
            <p className="text-[10px] uppercase font-bold text-muted">Qolgan vaqt</p>
            <p className="text-lg"><Countdown to={a.ends_at} onEnd={onChanged} /></p>
          </div>
          <div className="rounded-xl bg-bg border border-line p-2">
            <p className="text-[10px] uppercase font-bold text-muted">Takliflar</p>
            <p className="font-black">{a.bids_count}</p>
          </div>
        </div>

        <p className="text-xs text-muted">
          Boshlang&apos;ich narx: <b className="text-white">{som(a.start_price)}</b> · Minimal qadam: <b className="text-white">{som(a.min_step)}</b>
          {a.leader && <> · Yetakchi: <b className={a.is_mine_leading ? "text-win" : "text-white"}>{a.is_mine_leading ? "Siz" : `${a.leader.name} (ID ${a.leader.public_id})`}</b></>}
        </p>

        {a.is_mine_leading && <p className="text-xs font-bold text-win">🏆 Hozir siz yetakchisiz! Taklifingiz oshib ketilsa, pulingiz balansga to&apos;liq qaytadi.</p>}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <input className="input font-black text-lg" inputMode="numeric" value={fmt(amount)}
              onChange={e => setAmount(digits(e.target.value))} placeholder={fmt(a.min_next)} />
            <p className="text-[11px] text-muted mt-1">Kamida {som(a.min_next)}{user && <> · Balansingiz: {som(profile?.balance)}</>}</p>
          </div>
          <button disabled={busy} onClick={bid} className="btn-accent sm:self-start">
            {busy ? "…" : user ? `Taklif berish` : "Kirish"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 5].map(k => (
            <button key={k} onClick={() => setAmount(Math.max(a.min_next, (a.current_bid ?? a.start_price - a.min_step) + a.min_step * k))}
              className="chip !py-1.5 !px-2.5 bg-bg border border-line text-muted hover:text-white">
              +{fmt(a.min_step * k)}
            </button>
          ))}
        </div>
        {user && amount >= a.min_next && (
          <p className="text-[11px] text-muted">Balansdan yechiladi: <b className="text-white">{som(charge)}</b>. Auksionda yutqazsangiz, pul to&apos;liq qaytariladi.</p>
        )}
        {msg && <p className={`text-sm font-bold ${msg.ok ? "text-win" : "text-lose"}`}>{msg.t}</p>}

        <button onClick={() => setShowBids(!showBids)} className="text-xs text-muted hover:text-white self-start">
          {showBids ? "▲ Takliflar tarixini yashirish" : `▼ Takliflar tarixi (${a.bids_count})`}
        </button>
        {showBids && (
          <div className="rounded-xl border border-line divide-y divide-line text-sm max-h-56 overflow-y-auto">
            {bids === null ? <p className="p-3 text-muted">Yuklanmoqda…</p>
              : bids.length === 0 ? <p className="p-3 text-muted">Hali taklif yo&apos;q — birinchi bo&apos;ling!</p>
              : bids.map((b, i) => (
                <div key={i} className={`flex justify-between px-3 py-2 ${i === 0 ? "bg-accent/5" : ""}`}>
                  <span>{i === 0 && "🏆 "}<b className={b.is_mine ? "text-win" : ""}>{b.is_mine ? "Siz" : b.bidder_name}</b> <span className="text-muted text-xs">ID {b.bidder_public_id}</span></span>
                  <span><b className="text-accent">{som(b.amount)}</b> <span className="text-muted text-xs">{ago(b.created_at)} oldin</span></span>
                </div>
              ))}
          </div>
        )}
        {!user && <Link href="/login/" className="text-xs text-accent font-bold">Taklif berish uchun tizimga kiring →</Link>}
      </div>
    </div>
  );
}
