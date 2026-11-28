// UzDrop — umumiy turlar va yordamchilar
export type AccountStatus = "pending" | "active" | "sold" | "pool" | "won" | "claimed" | "rejected";

export interface Account {
  id: string;
  game: string;
  title: string;
  description: string | null;
  rank: string | null;
  level: number | null;
  image_url: string | null;
  images: string[];
  public_no?: number | null;
  frame?: string | null;
  bindings?: Record<string, number> | null;
  origin?: string | null;
  admin_id?: string | null;
  price: number;
  asked_price: number | null;
  kind: "market" | "quick" | "site";
  status: AccountStatus;
  seller_id: string | null;
  owner_id: string | null;
  case_id: string | null;
  reject_note: string | null;
  created_at: string;
}

export interface Case {
  id: string;
  name: string;
  game: string;
  price: number;
  image_url: string | null;
  color: string;
  sort: number;
  active: boolean;
}

export interface Spin {
  id: string;
  username: string | null;
  case_name: string | null;
  title: string | null;
  game: string | null;
  value: number;
  created_at: string;
}

export interface Profile { id: string; public_id: number | null; username: string | null; email?: string | null; telegram?: string | null; balance: number; is_admin: boolean; }

export interface Delivery { id: string; code: string; account_id: string; source: "buy" | "spin"; price: number; status: "pending" | "waiting" | "delivered" | "cancelled"; admin_note: string | null; created_at: string; approved_at?: string | null; }

export const GAMES = [
  { id: "standoff2", name: "Standoff 2",      icon: "🔫", color: "#FFC83D" },
  { id: "pubg",      name: "PUBG Mobile",     icon: "🎯", color: "#F5A623" },
  { id: "mlbb",      name: "Mobile Legends",  icon: "🗡️", color: "#3DD9FF" },
  { id: "freefire",  name: "Free Fire",       icon: "🔥", color: "#FF7A3D" },
  { id: "cs2",       name: "CS2",             icon: "💣", color: "#A08BFF" },
  { id: "brawl",     name: "Brawl Stars",     icon: "⭐", color: "#FF4DD2" },
  { id: "other",     name: "Boshqa",          icon: "🎮", color: "#7F89B0" },
];
export const game = (id?: string | null) => GAMES.find(g => g.id === id) ?? GAMES[GAMES.length - 1];

export const PAY_METHODS = [
  { id: "click",  name: "Click"  },
  { id: "payme",  name: "Payme"  },
  { id: "uzcard", name: "Uzcard" },
  { id: "humo",   name: "Humo"   },
];

/** To'ldirish uchun karta (env orqali o'zgartiring) */
export const DEPOSIT_CARD = process.env.NEXT_PUBLIC_DEPOSIT_CARD || "8600 0000 0000 0000";
export const DEPOSIT_CARD_OWNER = process.env.NEXT_PUBLIC_DEPOSIT_CARD_OWNER || "UZDROP";

/** Sotuvchilar yozadigan admin Telegram username (@siz) */
export const TELEGRAM_ADMIN = (process.env.NEXT_PUBLIC_TELEGRAM_ADMIN || "perdeloto").replace(/^@/, "");
export const telegramLink = (text: string, username?: string | null) =>
  `https://t.me/${(username || TELEGRAM_ADMIN).replace(/^@/, "")}?text=${encodeURIComponent(text)}`;

export const accNo = (n?: number | null) => (n ? `#${n}` : "");

/** Akkaunt spin hozircha o'chiq — "Tez kunda". Yoqish: NEXT_PUBLIC_SPIN=1 */
export const SPIN_ENABLED = process.env.NEXT_PUBLIC_SPIN === "1";

/** Akkauntga ulanadigan platformalar (privyazkalar) */
export const BINDINGS: { id: string; name: string; icon: string }[] = [
  { id: "gmail", name: "Gmail / Google", icon: "📧" },
  { id: "facebook", name: "Facebook", icon: "📘" },
  { id: "vk", name: "VK", icon: "🟦" },
  { id: "twitter", name: "X (Twitter)", icon: "✖️" },
  { id: "apple", name: "Apple ID", icon: "🍏" },
  { id: "game_center", name: "Game Center", icon: "🎮" },
  { id: "google_play", name: "Google Play", icon: "▶️" },
  { id: "phone", name: "Telefon raqam", icon: "📱" },
  { id: "email", name: "Email (pochta)", icon: "✉️" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
  { id: "huawei", name: "Huawei ID", icon: "📲" },
  { id: "guest", name: "Mehmon (guest)", icon: "👤" },
];
export const binding = (id?: string | null) => BINDINGS.find(b => b.id === id);

/** Akkaunt rasmlarining yagona o'lchami (eni:bo'yi). Admin shu o'lchamda kesadi, kartalar shu o'lchamda ko'rsatadi. */
export const IMAGE_ASPECT = 16 / 9;
/** Kesilgan rasmning saqlanadigan eni (px): 1280x720 */
export const IMAGE_OUT_W = 1280;

export const COMMISSION = 0.10;

export const som = (n: number | null | undefined) =>
  (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";

/** Narxga qarab noyoblik rangi (bulldrop-uslubidagi glow uchun) */
export function rarity(price: number) {
  if (price >= 1_000_000) return { name: "Afsonaviy", color: "#FFC83D" };
  if (price >= 400_000)   return { name: "Epik",      color: "#FF4D6A" };
  if (price >= 150_000)   return { name: "Noyob",     color: "#A08BFF" };
  if (price >= 50_000)    return { name: "Kam",       color: "#3D8BFF" };
  return                          { name: "Oddiy",     color: "#7F89B0" };
}

/** Keys ichidagi ehtimollar — serverdagi formula bilan bir xil (og'irlik = 1/narx) */
export function chances(items: { price: number }[]) {
  const total = items.reduce((s, i) => s + 1 / i.price, 0);
  return items.map(i => (total ? (1 / i.price) / total : 0));
}

export const ago = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} daq`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat`;
  return `${Math.floor(s / 86400)} kun`;
};
