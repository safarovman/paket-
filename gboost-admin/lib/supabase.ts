import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL     || "https://placeholder.supabase.co";
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY     || SUPABASE_ANON;

// Frontend uchun (anon key)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Backend uchun (service role — barcha RLS ni bypass qiladi)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Types ───────────────────────────────────────────────────

export interface DBAdmin {
  id:          string;
  name:        string;
  email:       string;
  password:    string;
  role:        "superadmin" | "admin";
  is_active:   boolean;
  permissions: string[];
  last_login:  string | null;
  created_at:  string;
  created_by:  string | null;
}

export interface DBUser {
  id:           string;
  name:         string;
  email:        string;
  phone:        string;
  role:         "client" | "booster";
  karma:        number;
  is_active:    boolean;
  is_banned:    boolean;
  ban_reason:   string | null;
  games:        string[];
  total_orders: number;
  total_spent:  number;
  created_at:   string;
}

export interface DBOrder {
  id:             string;
  user_id:        string;
  user_name:      string;
  game:           string;
  service:        string;
  from_rank:      string;
  to_rank:        string;
  price:          number;
  status:         "pending" | "approved" | "rejected" | "completed" | "disputed";
  booster:        string;
  note:           string | null;
  payment_method: string;
  created_at:     string;
  updated_at:     string;
}

export interface DBComplaint {
  id:           string;
  from_user:    string;
  from_user_id: string;
  against_user: string;
  order_id:     string;
  type:         "fraud" | "incomplete" | "other";
  description:  string;
  status:       "new" | "reviewing" | "resolved" | "rejected";
  resolved_by:  string | null;
  resolution:   string | null;
  created_at:   string;
  updated_at:   string;
}

export interface DBPayment {
  id:         string;
  user_id:    string;
  user_name:  string;
  type:       "deposit" | "withdrawal" | "escrow_hold" | "escrow_release" | "refund";
  amount:     number;
  method:     "click" | "payme" | "uzcard" | "humo";
  status:     "pending" | "completed" | "failed" | "frozen";
  order_id:   string | null;
  note:       string | null;
  created_at: string;
}

export interface DBListing {
  id:          string;
  user_id:     string;
  user_name:   string;
  game:        string;
  rank:        string;
  price:       number;
  type:        "sale" | "rent";
  status:      "pending" | "approved" | "rejected";
  description: string | null;
  win_rate:    number;
  matches:     number;
  verified:    boolean;
  reject_note: string | null;
  created_at:  string;
  updated_at:  string;
}

// ─── Helper Functions ─────────────────────────────────────────

export const fmt = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff} soniya oldin`;
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  return `${Math.floor(diff / 86400)} kun oldin`;
};
