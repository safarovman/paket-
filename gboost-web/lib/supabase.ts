import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "https://heohxnkmwodsnhzgixst.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlb2h4bmttd29kc25oemdpeHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjE2MTQsImV4cCI6MjA5Njk5NzYxNH0.60Wnh9PvI6MfEeDC70e8BDBeti22cjnOZTmxdVtfL7A";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
  },
});

export const fmt = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

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
