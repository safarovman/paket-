import { accNo, game, rarity, som, type Account } from "@/lib/uzdrop";
import ImageCarousel from "@/components/ImageCarousel";
import GameFrame from "@/components/GameFrame";
import { GameIcon } from "@/components/Icon";

/**
 * Akkaunt kartasi = faqat ramkali skrinshot (ramka kartaning o'zi, ichida yana ramka yo'q).
 * Narx — pastki o'ng burchakda (kichik, to'q qizil), #ID va o'yin — chap pastda, nom — sichqoncha ustiga kelganda.
 * Belgilar rasm oynasi ichida joylashadi, ramka bezaklari ustiga tushmaydi.
 */
export default function AccountCard({ a, footer, onClick, compact }: {
  a: Pick<Account, "title" | "game" | "rank" | "image_url" | "price"> & {
    description?: string | null; public_no?: number | null; images?: string[] | null; frame?: string | null;
  };
  footer?: React.ReactNode; onClick?: () => void; compact?: boolean;
}) {
  const r = rarity(a.price);
  const g = game(a.game);
  const imgs = (a.images && a.images.length ? a.images : a.image_url ? [a.image_url] : []);
  // Ramkasiz kartada belgilar burchakka yaqinroq turadi
  const bare = a.frame === "none";
  // Belgilar rasm oynasining ichida (ramka bo'lsa ham, bo'lmasa ham) — burchaklarga yaqin
  const L = "left-2", R = "right-2", T = "top-2", B = "bottom-1.5";
  const pad = `${L} ${R}`;

  return (
    <div className="group">
      <div onClick={onClick}
        className={`relative transition-transform duration-200 ${onClick ? "cursor-pointer hover:-translate-y-1" : ""}`}>
        <GameFrame game={a.game} frame={a.frame} className={`rounded-xl overflow-hidden bg-bg ${bare ? "border border-white/10 group-hover:border-accent/50 transition-colors" : ""}`}>
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#2a1015] to-[#0b0606]">
            {imgs.length
              ? <ImageCarousel images={imgs} alt={a.title} />
              : <GameIcon game={a.game} className={compact ? "w-10 h-10" : "w-16 h-16"} />}
          </div>

          {/* Sichqoncha ustida — nom */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 z-[5] bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <p className={`absolute ${pad} ${bare ? "bottom-10" : "bottom-[22%]"} z-20 text-xs sm:text-sm font-extrabold truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-shadow`}>
            {a.title}
          </p>

          {/* Narx — rasmning pastki o'ng burchagiga tekis yopishgan, chap tomoni qiya (to'rtburchak, yumaloq emas) */}
          <span className="absolute right-0 bottom-0 z-20 flex items-baseline gap-1 bg-[#8B1515] text-white pl-5 sm:pl-6 pr-2.5 sm:pr-3 py-1 sm:py-1.5 whitespace-nowrap shadow-[0_-2px_12px_rgba(0,0,0,.35)]"
            style={{ clipPath: "polygon(14px 0, 100% 0, 100% 100%, 0 100%)" }}>
            <b className="text-xs sm:text-sm font-black tracking-tight tabular-nums">{a.price.toLocaleString("ru-RU").replace(/\u00a0/g, " ")}</b>
            <span className="text-[9px] sm:text-[10px] font-bold text-white/75">so&apos;m</span>
          </span>

          {/* Noyoblik — chap yuqori */}
          {!compact && (
            <span className={`absolute ${L} ${T} z-20 chip !text-[9px] !px-1.5 bg-black/60 backdrop-blur-sm`} style={{ color: r.color }}>
              {r.name}
            </span>
          )}

          {/* #ID va o'yin — chap past */}
          <span className={`absolute ${L} ${B} z-20 chip !text-[10px] !px-1.5 bg-black/65 backdrop-blur-sm text-white`}>
            <GameIcon game={a.game} className="w-3.5 h-3.5" /> {a.public_no ? accNo(a.public_no) : g.name}
          </span>
        </GameFrame>
      </div>
      {footer && <div className="mt-2 relative z-20">{footer}</div>}
    </div>
  );
}
