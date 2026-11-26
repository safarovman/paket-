// Faollik turlari — o'zbekcha nomlar
export const TX_LABEL: Record<string, string> = {
  buy: "🛒 Akkaunt sotib oldi",
  deposit: "💳 To'ldirildi",
  withdraw: "🏦 Yechish so'rovi",
  sale: "💰 Sotuvchiga tushdi",
  quick_sell: "⚡ Tez sotish",
  refund: "↩️ Qaytarildi",
  spin: "🎰 Spin",
  win_sell: "🎰 Yutuqni sotdi",
  admin: "🛠 Admin tuzatish",
};
export const txLabel = (t: string) => TX_LABEL[t] ?? t;

export const FILTERS: { id: string; label: string; types: string[] | null }[] = [
  { id: "all",      label: "Hammasi",    types: null },
  { id: "buy",      label: "Xaridlar",   types: ["buy", "spin"] },
  { id: "deposit",  label: "To'ldirish", types: ["deposit"] },
  { id: "withdraw", label: "Yechish",    types: ["withdraw"] },
  { id: "sale",     label: "Sotuvlar",   types: ["sale", "quick_sell", "win_sell"] },
];

export function rel(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} s oldin`;
  if (s < 3600) return `${Math.floor(s / 60)} daq oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  return `${Math.floor(s / 86400)} kun oldin`;
}
