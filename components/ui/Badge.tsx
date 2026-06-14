import clsx from "clsx";
import { getKarmaClass, getKarmaLabel } from "@/lib/constants";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-full border", className)}>
      {children}
    </span>
  );
}

export function KarmaBadge({ karma }: { karma: number }) {
  return (
    <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 w-fit",
      karma >= 80 ? "bg-green/15 text-green border-green/30" :
      karma >= 40 ? "bg-gold/15 text-gold border-gold/30" :
                   "bg-red/15 text-red border-red/30"
    )}>
      ⭐ {karma} • {getKarmaLabel(karma)}
    </span>
  );
}

export function GameBadge({ game }: { game: string }) {
  const colors: Record<string, string> = {
    MLBB:        "bg-cyan/10 text-cyan border-cyan/30",
    PUBG:        "bg-gold/10 text-gold border-gold/30",
    "Free Fire": "bg-orange/10 text-orange border-orange/30",
    CS2:         "bg-purple/10 text-purple-light border-purple/30",
  };
  return (
    <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-full border", colors[game] || "bg-card text-text-gray border-border")}>
      {game}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:     { label: "⚡ Faol",       cls: "bg-cyan/15 text-cyan border-cyan/30" },
    completed:  { label: "✅ Tugadi",     cls: "bg-green/15 text-green border-green/30" },
    pending:    { label: "⏳ Kutilmoqda", cls: "bg-gold/15 text-gold border-gold/30" },
    cancelled:  { label: "❌ Bekor",      cls: "bg-red/15 text-red border-red/30" },
    sale:       { label: "🛒 Sotish",     cls: "bg-green/15 text-green border-green/30" },
    rent:       { label: "🔄 Ijara",      cls: "bg-gold/15 text-gold border-gold/30" },
  };
  const s = map[status] || { label: status, cls: "bg-card text-text-gray border-border" };
  return (
    <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-full border", s.cls)}>
      {s.label}
    </span>
  );
}
