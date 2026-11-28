"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { accNo, som } from "@/lib/uzdrop";
import CodeCard from "@/components/CodeCard";
import AuctionCard from "@/components/auction/AuctionCard";
import type { AuctionItem } from "@/components/auction/types";
import Icon from "@/components/Icon";

export default function AuctionPage() {
  const { user } = useUser();
  const [live, setLive] = useState<AuctionItem[] | null>(null);
  const [ended, setEnded] = useState<AuctionItem[]>([]);
  const [myWins, setMyWins] = useState<{ code: string; account_id: string; title: string; price: number }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    await supabase.rpc("finalize_auctions"); // tugagan auksionlarni yakunlash
    const [l, e] = await Promise.all([
      supabase.rpc("auction_list", { p_status: "live", p_limit: 50 }),
      supabase.rpc("auction_list", { p_status: "ended", p_limit: 10 }),
    ]);
    setLive((l.data as AuctionItem[]) || []);
    const endedList = (e.data as AuctionItem[]) || [];
    setEnded(endedList);

    // Men yutgan auksionlar uchun kod
    const won = endedList.filter(x => x.is_mine_won);
    if (user && won.length) {
      const { data } = await supabase.from("deliveries").select("code,account_id,price")
        .eq("user_id", user.id).in("account_id", won.map(w => w.account.id)).eq("status", "waiting");
      setMyWins(((data as { code: string; account_id: string; price: number }[]) || []).map(d => ({
        ...d, title: won.find(w => w.account.id === d.account_id)?.account.title ?? "",
      })));
    } else setMyWins([]);
  }, [user]);

  const reload = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 400);
  }, [load]);

  useEffect(() => { load(); }, [load]);

  // Jonli yangilanish: auksionlar o'zgarganda (+ har 15 soniyada zaxira tekshiruv)
  useEffect(() => {
    const ch = supabase.channel("auctions-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, reload)
      .subscribe();
    const t = setInterval(load, 15000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [load, reload]);

  return (
    <div className="wrap py-6 space-y-8">
      <div>
        <h1 className="h-title"><Icon name="gavel" className="w-6 h-6 text-accent mr-2" />Akkaunt auksioni</h1>
        <p className="text-muted text-sm mt-1">
          Eng yuqori taklif bergan yutadi. Taklif summasi balansdan darhol yechiladi — taklifingiz oshib ketilsa, pul to&apos;liq qaytariladi.
          Oxirgi 2 daqiqada taklif tushsa, auksion 2 daqiqaga uzayadi.
        </p>
      </div>

      {myWins.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-black uppercase text-win"><Icon name="trophy" className="mr-1.5" />Siz yutdingiz!</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {myWins.map(w => (
              <div key={w.code} className="panel p-5 border-win/40">
                <p className="font-black text-center mb-3">{w.title} — {som(w.price)}</p>
                <CodeCard code={w.code} kind="buy" title={w.title} accountId={w.account_id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-black uppercase">Jonli auksionlar {live && <span className="text-muted">({live.length})</span>}</h2>
        {live === null ? (
          <div className="panel h-48 animate-pulse" />
        ) : live.length === 0 ? (
          <div className="panel p-10 text-center text-muted">Hozircha faol auksion yo&apos;q. Tez orada yangilari qo&apos;shiladi!</div>
        ) : (
          live.map(a => <AuctionCard key={a.id} a={a} onChanged={reload} />)
        )}
      </section>

      {ended.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-black uppercase text-muted">Yakunlangan auksionlar</h2>
          <div className="panel divide-y divide-line">
            {ended.map(e => (
              <div key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="font-bold flex-1 min-w-0 truncate">{accNo(e.account.public_no)} {e.account.title}</span>
                {e.winner
                  ? <span><Icon name="trophy" className="w-3.5 h-3.5 mr-1 text-accent" /><b className={e.is_mine_won ? "text-win" : ""}>{e.is_mine_won ? "Siz" : e.winner.name}</b> <span className="text-muted">ID {e.winner.public_id}</span></span>
                  : <span className="text-muted">Taklif bo&apos;lmadi</span>}
                <b className="text-accent">{e.current_bid ? som(e.current_bid) : "—"}</b>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
