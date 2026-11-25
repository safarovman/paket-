"use client";
import { useState } from "react";
import { game, som, type Account, type Case } from "@/lib/uzdrop";
import ImageUploader from "@/components/ImageUploader";
import { AccNo, AdminLine, Empty, UserLine, num, type AccExtra, type AdminOpt, type Rpc, type UserInfo } from "./shared";

type Acc = Account & AccExtra;

export default function ListedTab({ accounts, cases, users, admins, adminById, me, busy, rpc }: {
  accounts: Account[]; cases: Case[]; users: Record<string, UserInfo>; admins: AdminOpt[]; adminById: Record<string, AdminOpt>;
  me: string; busy: boolean; rpc: Rpc;
}) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<string | null>(null);
  const s = q.trim().toLowerCase();
  const list = (accounts as Acc[]).filter(a => !s || a.title.toLowerCase().includes(s) ||
    (/^#?\d+$/.test(s) && String(a.public_no ?? "").includes(s.replace("#", ""))));
  const caseName = (id: string | null) => cases.find(c => c.id === id)?.name ?? "keys";

  return (
    <div className="space-y-3">
      <input className="input max-w-sm" placeholder="🔍 Sarlavha yoki #raqam" value={q} onChange={e => setQ(e.target.value)} />
      {list.length === 0 && <Empty text="Saytda akkaunt yo'q" />}
      {list.map(a => (
        <div key={a.id} className="panel p-3 sm:p-4">
          <div className="flex gap-3 items-center">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-panel2 grid place-items-center shrink-0">
              {a.image_url ? <img src={a.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">{game(a.game).icon}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold truncate"><AccNo n={a.public_no} /> {a.title}</p>
              <p className="text-xs text-muted">{game(a.game).icon} {game(a.game).name}{a.rank ? ` • ${a.rank}` : ""} • <b className="text-accent">{som(a.price)}</b></p>
              <div className="flex flex-wrap gap-2 items-center mt-1">
                <span className={a.status === "pool" ? "chip bg-violet/20 text-violet-light" : "chip bg-win/15 text-win"}>
                  {a.status === "pool" ? `🎰 ${caseName(a.case_id)}` : "🛒 Bozorda"}
                </span>
                {a.seller_id && <span className="text-xs">Sotuvchi: <UserLine u={users[a.seller_id]} /></span>}
              </div>
              <div className="flex flex-wrap gap-2 items-center mt-1">
                <AdminLine a={a.admin_id ? adminById[a.admin_id] ?? { id: a.admin_id, username: null, telegram: null } : null} me={me} />
                <select className="input !py-1 !px-2 !text-xs !w-auto" value="" disabled={busy}
                  onChange={e => { const v = e.target.value; if (v) rpc("admin_assign_account", { p_account: a.id, p_admin: v }, "Mas'ul admin o'zgartirildi"); }}>
                  <option value="">Adminni o&apos;zgartirish…</option>
                  {admins.filter(x => x.id !== a.admin_id).map(x => (
                    <option key={x.id} value={x.id}>{x.username || "—"}{x.telegram ? ` (@${x.telegram})` : ""}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="btn-ghost !py-2 !px-3" onClick={() => setEdit(edit === a.id ? null : a.id)}>{edit === a.id ? "Yopish" : "Tahrir"}</button>
              <button disabled={busy} className="btn-ghost !py-2 !px-3 !text-lose" onClick={() => {
                const note = prompt("Sotuvdan olib tashlash sababi (ixtiyoriy):");
                if (note !== null) rpc("admin_remove_account", { p_id: a.id, p_note: note || null }, "Sotuvdan olib tashlandi");
              }}>O&apos;chirish</button>
            </div>
          </div>
          {edit === a.id && <EditForm a={a} busy={busy} onSave={async args => { if (await rpc("admin_update_account", { p_id: a.id, ...args }, "Saqlandi")) setEdit(null); }} />}
        </div>
      ))}
    </div>
  );
}

function EditForm({ a, busy, onSave }: { a: Account; busy: boolean; onSave: (args: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ title: a.title, description: a.description ?? "", rank: a.rank ?? "", level: a.level != null ? String(a.level) : "", price: String(a.price) });
  const [images, setImages] = useState<string[]>(a.images?.length ? a.images : a.image_url ? [a.image_url] : []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="border-t border-line mt-3 pt-3 space-y-3">
      <div><label className="label">Sarlavha</label><input className="input" value={f.title} onChange={set("title")} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label">Rank</label><input className="input" value={f.rank} onChange={set("rank")} /></div>
        <div><label className="label">Level</label><input className="input" inputMode="numeric" value={f.level} onChange={set("level")} /></div>
        <div><label className="label">Narx</label><input className="input" inputMode="numeric" value={f.price} onChange={set("price")} /></div>
      </div>
      <div><label className="label">Tavsif</label><textarea className="input min-h-[70px]" value={f.description} onChange={set("description")} /></div>
      <div><label className="label">Rasmlar</label><ImageUploader value={images} onChange={setImages} /></div>
      <button disabled={busy || !f.title.trim() || !num(f.price)} className="btn-accent w-full" onClick={() => onSave({
        p_title: f.title, p_description: f.description, p_rank: f.rank, p_level: num(f.level), p_price: num(f.price), p_images: images,
      })}>Saqlash</button>
    </div>
  );
}
