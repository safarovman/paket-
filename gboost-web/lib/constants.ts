export const GAMES = [
  {
    id: "mlbb",
    name: "Mobile Legends: Bang Bang",
    short: "MLBB",
    icon: "🗡️",
    color: "#00E5FF",
    tw: "cyan",
    ranks: ["Warrior","Elite","Master","Grandmaster","Epic","Legend","Mythic","Mythic Glory"],
    basePrice: 50000,
  },
  {
    id: "pubg",
    name: "PUBG Mobile",
    short: "PUBG",
    icon: "🎯",
    color: "#FFD600",
    tw: "gold",
    ranks: ["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Conqueror"],
    basePrice: 60000,
  },
  {
    id: "freefire",
    name: "Free Fire",
    short: "FF",
    icon: "🔥",
    color: "#FF8C00",
    tw: "orange",
    ranks: ["Bronze","Silver","Gold","Platinum","Diamond","Heroic","Grandmaster"],
    basePrice: 40000,
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    short: "CS2",
    icon: "💣",
    color: "#6C3FB5",
    tw: "purple",
    ranks: ["Silver I","Silver II","Gold Nova I","Gold Nova Master","Master Guardian I","Master Guardian Elite","Legendary Eagle","Global Elite"],
    basePrice: 80000,
  },
];

export const SERVICE_TYPES = [
  { id: "solo",     name: "Solo Boosting",  icon: "⚔️",  desc: "Booster sizning akkauntingizga kiradi",   discount: 0 },
  { id: "duo",      name: "Duo Boosting",   icon: "🤝",  desc: "Booster siz bilan birga o'ynaydi",       discount: 0.2 },
  { id: "coaching", name: "Coaching",       icon: "🎓",  desc: "Professional o'yinchi dars beradi",      discount: -0.5 },
];

export const PAYMENT_METHODS = [
  { id: "humo",   name: "Humo",   icon: "💳" },
  { id: "uzcard", name: "Uzcard", icon: "💳" },
  { id: "click",  name: "Click",  icon: "📱" },
  { id: "payme",  name: "Payme",  icon: "📲" },
];

export const COMMISSION = 0.13;

export const KARMA_LEVELS = [
  { min: 80, max: 100, label: "Yuqori",    color: "green",  perks: ["Prioritet buyurtmalar", "Past komissiya", "Tasdiqlanganlik belgisi ✅"] },
  { min: 40, max: 79,  label: "O'rtacha",  color: "gold",   perks: ["Standart buyurtmalar", "Oddiy ko'rinish"] },
  { min: 0,  max: 39,  label: "Past",      color: "red",    perks: ["Buyurtma cheklovi", "Ban xavfi ⚠️"] },
];

export const STATS = [
  { label: "O'zbek geymerlari",   value: "4.5M+",  color: "text-cyan"  },
  { label: "Xavfsiz tranzaksiya", value: "10K+",   color: "text-green" },
  { label: "Faol boosterlar",     value: "500+",   color: "text-gold"  },
  { label: "Muvaffaqiyat darajasi", value: "98%",  color: "text-purple-light" },
];

export const TOP_BOOSTERS = [
  { name: "ProGamer99",  game: "MLBB",      karma: 95, orders: 142, rating: 4.9 },
  { name: "SniperKing",  game: "PUBG",      karma: 88, orders: 97,  rating: 4.8 },
  { name: "FireLord",    game: "Free Fire", karma: 92, orders: 115, rating: 4.9 },
  { name: "CSPro",       game: "CS2",       karma: 85, orders: 63,  rating: 4.7 },
  { name: "MLBBKing",    game: "MLBB",      karma: 97, orders: 201, rating: 5.0 },
  { name: "PUBGMaster",  game: "PUBG",      karma: 91, orders: 134, rating: 4.8 },
];

export const MARKET_ACCOUNTS = [
  { id:"1", game:"MLBB",      icon:"🗡️", rank:"Mythic Glory", winRate:68, matches:1240, price:850000,  type:"sale", seller:"StarPlayer", karma:92, color:"cyan",   verified:true  },
  { id:"2", game:"PUBG Mobile",icon:"🎯",rank:"Conqueror",    winRate:72, matches:980,  price:1200000, type:"sale", seller:"TopSniper",  karma:88, color:"gold",   verified:true  },
  { id:"3", game:"MLBB",      icon:"🗡️", rank:"Legend",       winRate:58, matches:620,  price:80000,   type:"rent", seller:"MLBBPro",    karma:85, color:"cyan",   verified:false },
  { id:"4", game:"CS2",       icon:"💣", rank:"Global Elite", winRate:65, matches:2100, price:2500000, type:"sale", seller:"CSMaster",   karma:97, color:"purple", verified:true  },
  { id:"5", game:"Free Fire", icon:"🔥", rank:"Grandmaster",  winRate:61, matches:780,  price:350000,  type:"sale", seller:"FireKing",   karma:80, color:"orange", verified:false },
];

export const formatPrice = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const getKarmaClass = (k: number) =>
  k >= 80 ? "karma-high" : k >= 40 ? "karma-medium" : "karma-low";

export const getKarmaLabel = (k: number) =>
  k >= 80 ? "Yuqori" : k >= 40 ? "O'rtacha" : "Past";
