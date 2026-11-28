import { accNo, game, rarity, som, type Account } from "@/lib/uzdrop";
import ImageCarousel from "@/components/ImageCarousel";
import GameFrame from "@/components/GameFrame";
import { GameIcon } from "@/components/Icon";

/**
 * Akkaunt kartasi = faqat ramkali skrinshot (ramka kartaning o'zi, ichida yana ramka yo'q).
 * Narx — pastki o'ng burchakda (kichik, to'q qizil), #ID va o'yin — chap pastda, nom — sichqoncha ustiga kelganda.
 * Belgilar ramka bezaklari ustiga tushmasligi uchun ichkariga (~7%) surilgan.
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
  const pad = "left-[7%] right-[7%]";

  return (
    <div className="group">
      <div onClick={onClick}
        className={`relative transition-transform duration-200 ${onClick ? "cursor-pointer hover:-translate-y-1" : ""}`}>
        <GameFrame game={a.game} frame={a.frame} className="rounded-xl overflow-hidden bg-bg">
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#2a1015] to-[#0b0606]">
            {imgs.length
              ? <ImageCarousel images={imgs} alt={a.title} />
              : <GameIcon game={a.game} className={compact ? "w-10 h-10" : "w-16 h-16"} />}
          </div>

          {/* Sichqoncha ustida — nom */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 z-[5] bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <p className={`absolute ${pad} bottom-[22%] z-20 text-xs sm:text-sm font-extrabold truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-shadow`}>
            {a.title}
          </p>

          {/* Narx — pastki o'ng burchak: kichik, ramkasiz, to'q qizil */}
          <span className="absolute right-[7%] bottom-[10%] z-20 rounded-md px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-black text-white bg-[#8B1515] shadow-lg whitespace-nowrap">
            {som(a.price)}
          </span>

          {/* Noyoblik — chap yuqori */}
          {!compact && (
            <span className="absolute left-[7%] top-[10%] z-20 chip !text-[9px] !px-1.5 bg-black/60 backdrop-blur-sm" style={{ color: r.color }}>
              {r.name}
            </span>
          )}

          {/* #ID va o'yin — chap past */}
          <span className="absolute left-[7%] bottom-[10%] z-20 chip !text-[10px] !px-1.5 bg-black/65 backdrop-blur-sm text-white">
            <GameIcon game={a.game} className="w-3.5 h-3.5" /> {a.public_no ? accNo(a.public_no) : g.name}
          </span>
        </GameFrame>
      </div>
      {footer && <div className="mt-2 relative z-20">{footer}</div>}
    </div>
  );
}
