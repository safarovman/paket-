// ============================================================
// GBoost Admin — In-Memory Database (Demo)
// Real loyihada Supabase/PostgreSQL ga almashtiriladi
// ============================================================

export type Role = "superadmin" | "admin";

export interface Admin {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: Role;
  createdAt: string;
  isActive: boolean;
  lastPasswordChange: string;
  createdBy: string | null;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  game: string;
  service: string;
  fromRank: string;
  toRank: string;
  price: number;
  status: "pending" | "approved" | "rejected" | "completed" | "disputed";
  booster: string;
  createdAt: string;
  note?: string;
}

export interface Complaint {
  id: string;
  fromUser: string;
  againstUser: string;
  orderId: string;
  type: "fraud" | "incomplete" | "other";
  description: string;
  status: "new" | "reviewing" | "resolved" | "rejected";
  createdAt: string;
  resolvedBy?: string;
  resolution?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "client" | "booster";
  karma: number;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  type: "deposit" | "withdrawal" | "escrow_hold" | "escrow_release" | "refund";
  amount: number;
  method: "click" | "payme" | "uzcard" | "humo";
  status: "pending" | "completed" | "failed" | "frozen";
  createdAt: string;
  orderId?: string;
}

export interface AccountListing {
  id: string;
  userId: string;
  userName: string;
  game: string;
  rank: string;
  price: number;
  type: "sale" | "rent";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  description: string;
}

// ─── MOCK DATA ────────────────────────────────────────────

export const MOCK_ORDERS: Order[] = [
  { id:"ORD-001", userId:"u1", userName:"Jasur Karimov",   game:"MLBB",      service:"Solo Boosting", fromRank:"Epic",    toRank:"Legend",      price:138000, status:"pending",   booster:"ProGamer99", createdAt:"2024-01-15 10:23" },
  { id:"ORD-002", userId:"u2", userName:"Bobur Toshmatov", game:"PUBG",      service:"Duo Boosting",  fromRank:"Gold",    toRank:"Platinum",    price:96000,  status:"approved",  booster:"SniperKing", createdAt:"2024-01-14 15:40" },
  { id:"ORD-003", userId:"u3", userName:"Dilnoza Yusupova",game:"Free Fire", service:"Solo Boosting", fromRank:"Diamond", toRank:"Heroic",      price:72000,  status:"disputed",  booster:"FireLord",   createdAt:"2024-01-13 09:15" },
  { id:"ORD-004", userId:"u4", userName:"Sardor Rakhimov", game:"CS2",       service:"Duo Boosting",  fromRank:"Gold Nova I","toRank":"Master Guardian I",price:184000,status:"completed",booster:"CSPro",createdAt:"2024-01-12 14:20"},
  { id:"ORD-005", userId:"u5", userName:"Kamola Nazarova", game:"MLBB",      service:"Coaching",      fromRank:"Master",  toRank:"Grandmaster", price:120000, status:"pending",   booster:"MLBBKing",   createdAt:"2024-01-11 11:30" },
  { id:"ORD-006", userId:"u6", userName:"Umid Holiqov",    game:"PUBG",      service:"Solo Boosting", fromRank:"Bronze",  toRank:"Silver",      price:55000,  status:"rejected",  booster:"",           createdAt:"2024-01-10 16:45" },
];

export const MOCK_COMPLAINTS: Complaint[] = [
  { id:"CMP-001", fromUser:"Jasur Karimov",   againstUser:"ProGamer99",  orderId:"ORD-001", type:"incomplete", description:"Booster buyurtmani yarim qoldirib ketdi, reyting tushib ketdi.", status:"new",       createdAt:"2024-01-15 12:00" },
  { id:"CMP-002", fromUser:"Dilnoza Yusupova",againstUser:"FireLord",    orderId:"ORD-003", type:"fraud",      description:"Pul olib xizmat ko'rsatmadi, akkauntni bloklab qo'ydi.",       status:"reviewing", createdAt:"2024-01-13 10:30" },
  { id:"CMP-003", fromUser:"Bobur Toshmatov", againstUser:"SniperKing",  orderId:"ORD-002", type:"other",      description:"Kelishilgan vaqtdan 2 kun kech bajardi.",                       status:"resolved",  createdAt:"2024-01-14 18:00", resolvedBy:"Admin", resolution:"Boosterga ogohlantirish berildi, karma -5" },
];

export const MOCK_USERS: User[] = [
  { id:"u1", name:"Jasur Karimov",    email:"jasur@gmail.com",   phone:"+998901234567", role:"client",  karma:85, isActive:true,  isBanned:false, createdAt:"2023-12-01", totalOrders:5,  totalSpent:450000 },
  { id:"u2", name:"Bobur Toshmatov",  email:"bobur@gmail.com",   phone:"+998902345678", role:"booster", karma:92, isActive:true,  isBanned:false, createdAt:"2023-11-15", totalOrders:47, totalSpent:0 },
  { id:"u3", name:"Dilnoza Yusupova", email:"dilnoza@gmail.com", phone:"+998903456789", role:"client",  karma:70, isActive:true,  isBanned:false, createdAt:"2023-12-10", totalOrders:3,  totalSpent:280000 },
  { id:"u4", name:"Sardor Rakhimov",  email:"sardor@gmail.com",  phone:"+998904567890", role:"booster", karma:78, isActive:false, isBanned:false, createdAt:"2023-10-20", totalOrders:12, totalSpent:0 },
  { id:"u5", name:"Kamola Nazarova",  email:"kamola@gmail.com",  phone:"+998905678901", role:"client",  karma:95, isActive:true,  isBanned:false, createdAt:"2024-01-01", totalOrders:8,  totalSpent:720000 },
  { id:"u6", name:"Umid Holiqov",     email:"umid@gmail.com",    phone:"+998906789012", role:"client",  karma:25, isActive:true,  isBanned:true,  createdAt:"2023-09-05", totalOrders:2,  totalSpent:55000 },
];

export const MOCK_PAYMENTS: Payment[] = [
  { id:"PAY-001", userId:"u1", userName:"Jasur Karimov",    type:"escrow_hold",    amount:138000, method:"click",  status:"frozen",    createdAt:"2024-01-15 10:25", orderId:"ORD-001" },
  { id:"PAY-002", userId:"u2", userName:"Bobur Toshmatov",  type:"escrow_release", amount:83520,  method:"humo",   status:"completed", createdAt:"2024-01-14 20:00", orderId:"ORD-002" },
  { id:"PAY-003", userId:"u3", userName:"Dilnoza Yusupova", type:"escrow_hold",    amount:72000,  method:"payme",  status:"frozen",    createdAt:"2024-01-13 09:20", orderId:"ORD-003" },
  { id:"PAY-004", userId:"u5", userName:"Kamola Nazarova",  type:"deposit",        amount:500000, method:"uzcard", status:"completed", createdAt:"2024-01-11 08:00" },
  { id:"PAY-005", userId:"u6", userName:"Umid Holiqov",     type:"refund",         amount:55000,  method:"click",  status:"pending",   createdAt:"2024-01-10 17:00", orderId:"ORD-006" },
];

export const MOCK_LISTINGS: AccountListing[] = [
  { id:"LST-001", userId:"u2", userName:"Bobur Toshmatov", game:"MLBB",      rank:"Mythic Glory", price:850000,  type:"sale", status:"pending",  createdAt:"2024-01-15", description:"3 yillik akkaunt, 87 qahramon" },
  { id:"LST-002", userId:"u4", userName:"Sardor Rakhimov", game:"CS2",       rank:"Global Elite", price:2500000, type:"sale", status:"pending",  createdAt:"2024-01-14", description:"2100 o'yin, 65% win rate" },
  { id:"LST-003", userId:"u2", userName:"Bobur Toshmatov", game:"PUBG",      rank:"Conqueror",    price:80000,   type:"rent", status:"approved", createdAt:"2024-01-10", description:"Kunlik ijara" },
];

export const STATS = {
  totalUsers:      1247,
  activeUsers:     891,
  totalOrders:     3842,
  pendingOrders:   23,
  totalRevenue:    48750000,
  frozenFunds:     12300000,
  openComplaints:  7,
  pendingListings: 12,
};
