"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase, errText } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";
import { GAMES, game, som, type Account } from "@/lib/uzdrop";
import AccountCard from "@/components/AccountCard";

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
  const [bought, setBought] = useState<{ login: string; password: string; extra: string | null } | null>(null);

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
    const { error } = await supabase.rpc("buy_account", { p_account: sel.id });
    if (error) { setMsg(errText(error)); setBusy(false); return; }
    const { data } = await supabase.from("account_secrets").select("login,password,extra").eq("account_id", sel.id).maybeSingle();
    setBought(data as any); setBusy(false); refresh(); load();
  };
  const close = () => { setSel(null); setBought(null); setMsg(""); };

  return (
    <div className="wrap py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="h-title">Akkauntlar bozori</h1>
          <p className="text-muted text-sm">Tekshirilgan akkauntlar — xariddan keyin login/parol darhol ochiladi</p>
        </div>
        <Link href="/sell" className="btn-violet">+ Akkaunt sotish</Link>
      </div>

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="panel h-60 animate-pulse" />)}</div>
      ) : shown.length === 0 ? (
        <div className="panel p-12 text-center text-muted">Hech narsa topilmadi</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {shown.map(a => <AccountCard key={a.id} a={a} onClick={() => setSel(a)}
            footer={<span className="btn-accent !py-2 w-full">Sotib olish</span>} />)}
        </div>
      )}

      {sel && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4 animate-fade-in" onClick={close}>
          <div className="panel w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {bought ? (
              <>
                <p className="text-win font-black uppercase text-center">✅ Xarid muvaffaqiyatli!</p>
                <p className="text-muted text-sm text-center mb-4">{sel.title}</p>
                <Secret label="Login" v={bought.login} />
                <Secret label="Parol" v={bought.password} />
                {bought.extra && <Secret label="Qo'shimcha" v={bought.extra} />}
                <p className="text-xs text-muted mt-3">Ma&apos;lumotlar profil → Xaridlar bo&apos;limida ham saqlanadi. Parolni darhol almashtiring.</p>
                <button onClick={close} className="btn-ghost w-full mt-4">Yopish</button>
              </>
            ) : (
              <>
                <AccountCard a={sel} />
                {sel.description && <p className="text-sm text-muted mt-4 whitespace-pre-line">{sel.description}</p>}
                <div className="flex justify-between text-sm mt-4"><span className="text-muted">O&apos;yin</span><b>{game(sel.game).name}</b></div>
                {sel.level != null && <div className="flex justify-between text-sm"><span className="text-muted">Daraja</span><b>{sel.level}</b></div>}
                <div className="flex justify-between text-sm"><span className="text-muted">Balansingiz</span><b>{som(profile?.balance)}</b></div>
                {msg && <p className="text-lose text-sm font-bold mt-3">{msg}</p>}
                <div className="grid gap-2 mt-5">
                  {user && (profile?.balance ?? 0) < sel.price
                    ? <Link href="/wallet" className="btn-accent">Balansni to&apos;ldirish</Link>
                    : <button onClick={buy} disabled={busy} className="btn-accent">{busy ? "…" : `Sotib olish • ${som(sel.price)}`}</button>}
                  <button onClick={close} className="btn-ghost">Bekor qilish</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Secret({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex items-center gap-2 bg-bg border border-line rounded-xl px-3 py-2 mt-2">
      <span className="text-xs text-muted w-20">{label}</span>
      <code className="flex-1 font-bold text-sm break-all">{v}</code>
      <button onClick={() => navigator.clipboard.writeText(v)} className="text-xs text-accent font-bold">Nusxa</button>
    </div>
  );
}

export default function Page() { return <Suspense><Market /></Suspense>; }
