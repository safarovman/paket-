import { GAMES } from "@/lib/uzdrop";

/**
 * Saytdagi barcha belgilar — bir xil uslubdagi chiziqli SVG ikonkalar (emoji/stiker o'rniga).
 * Rang `currentColor` dan olinadi, o'lcham className bilan beriladi.
 */
const P: Record<string, React.ReactNode> = {
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.7-7.3H6" /></>,
  gavel: <><path d="m14 4 6 6" /><path d="m11.5 6.5 6 6" /><path d="m10 8 6 6-2.5 2.5-6-6z" /><path d="M9.5 14.5 3 21" /><path d="M14 20h7" /></>,
  coins: <><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.6-2.4-2.9-5.5-3" /></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2.5" /><path d="M3 10h18" /><path d="M16 15h2" /><path d="M6 6V5a2 2 0 0 1 2-2h9" /></>,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" /></>,
  dice: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" /><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" /><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="m10 16-4-4 4-4" /><path d="M6 12h10" /></>,
  key: <><circle cx="8" cy="15" r="4.5" /><path d="m11.2 11.8 8.3-8.3" /><path d="m16.5 6.5 3 3" /><path d="m14 9 2 2" /></>,
  check: <><circle cx="12" cy="12" r="9.5" /><path d="m8 12.5 2.8 2.8L16.5 9.5" /></>,
  trophy: <><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11" /><path d="M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5" /></>,
  lock: <><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  shield: <><path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  send: <><path d="M21.5 3 2.5 10.5l7 2.5 2.5 7z" /><path d="m21.5 3-12 10" /></>,
  link: <><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" /></>,
  clock: <><circle cx="12" cy="12" r="9.5" /><path d="M12 7v5l3 2" /></>,
  box: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" /></>,
  x: <><circle cx="12" cy="12" r="9.5" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></>,
  ban: <><circle cx="12" cy="12" r="9.5" /><path d="m5.5 5.5 13 13" /></>,
  gamepad: <><path d="M6.5 7h11a4.5 4.5 0 0 1 4.4 5.5l-1 4.5a2.6 2.6 0 0 1-4.5 1.1L14.5 16h-5l-1.9 2.1a2.6 2.6 0 0 1-4.5-1.1l-1-4.5A4.5 4.5 0 0 1 6.5 7z" /><path d="M7.5 10.5v3M6 12h3" /><circle cx="15.5" cy="11" r=".8" fill="currentColor" /><circle cx="17.5" cy="13" r=".8" fill="currentColor" /></>,
  mail: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="m3 6.5 9 6.5 9-6.5" /></>,
  phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  facebook: <path d="M14 21v-8h3l.5-3.5H14V7.6c0-1 .3-1.6 1.7-1.6h1.9V3a24 24 0 0 0-2.7-.2C12.2 2.8 10.5 4.4 10.5 7.4v2.1H7.5V13h3v8" />,
  apple: <><path d="M16.5 13c0-2.5 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.3-3.5z" /><path d="M14.3 5.6c.7-.8 1.1-1.9 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" /></>,
  at: <><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></>,
  globe: <><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19" /><path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19z" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2.5" /><path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8" /></>,
  tag: <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.5" /></>,
  crop: <><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  filter: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
};

export type IconName = keyof typeof P;

export default function Icon({ name, className = "w-4 h-4", strokeWidth = 2 }: { name: IconName | string; className?: string; strokeWidth?: number }) {
  const body = P[name] ?? P.gamepad;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden className={`inline-block shrink-0 align-[-0.15em] ${className}`}>
      {body}
    </svg>
  );
}

/** O'yin belgisi — o'yin rangidagi geympad ikonkasi */
export function GameIcon({ game, className = "w-4 h-4" }: { game?: string | null; className?: string }) {
  const g = GAMES.find(x => x.id === game);
  return <span style={{ color: g?.color ?? "#A89494" }} className="inline-flex"><Icon name="gamepad" className={className} /></span>;
}
