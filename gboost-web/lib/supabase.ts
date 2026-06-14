import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Types ───────────────────────────────────────────────────

export interface Listing {
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
  created_at:  string;
}

export interface Order {
  id:         string;
  user_id:    string;
  user_name:  string;
  game:       string;
  service:    string;
  from_rank:  string;
  to_rank:    string;
  price:      number;
  status:     string;
  booster:    string;
  created_at: string;
}

export const fmt = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
