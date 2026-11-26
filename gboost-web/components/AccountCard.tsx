import { accNo, game, rarity, som, type Account } from "@/lib/uzdrop";

/** Bulldrop-uslubidagi karta: noyoblik rangida pastki chiziq va yorug'lik */
export default function AccountCard({ a, footer, onClick, compact }: {
  a: Pick<Account, "title" | "game" | "rank" | "image_url" | "price"> & { description?: string | null; public_no?: number | null };
  footer?: React.ReactNode; onClick?: () => void; compact?: boolean;
}) {
  const r = rarity(a.price);
  const g = game(a.game);
  return (
    <div onClick={onClick}
      className={`group relative panel overflow-hidden transition-transform ${onClick ? "cursor-pointer hover:-translate-y-1" : ""}`}>
      <div className="absolute inset-0 opacity-25 group-hover:opacity-40 transition-opacity"
        style={{ background: `radial-gradient(circle at 50% 30%, ${r.color}, transparent 65%)` }} />
      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: r.color }} />
      <div className={`relative ${compact ? "p-3" : "p-4"}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="chip bg-bg/60 text-muted">{g.icon} {g.name}</span>
          <span className="chip" style={{ color: r.color, background: r.color + "22" }}>{r.name}</span>
        </div>
        <div className={`${compact ? "h-20" : "h-28"} grid place-items-center rounded-lg overflow-hidden`}>
          {a.image_url
            ? <img src={a.image_url} alt="" loading="lazy" className="h-full w-full object-cover rounded-lg" />
            : <span className={`${compact ? "text-4xl" : "text-6xl"} drop-shadow-xl`}>{g.icon}</span>}
        </div>
        <p className="font-extrabold text-sm truncate mt-2">{a.title}</p>
        <p className="text-xs text-muted truncate">{a.public_no ? <b className="text-white/70 mr-1">{accNo(a.public_no)}</b> : null}{a.rank || "—"}</p>
        <p className="mt-1 font-black" style={{ color: r.color }}>{som(a.price)}</p>
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </div>
  );
}
