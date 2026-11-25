"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/uzdrop";

interface Ctx { user: User | null; profile: Profile | null; loading: boolean; refresh: () => Promise<void>; }
const UserCtx = createContext<Ctx>({ user: null, profile: null, loading: true, refresh: async () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    if (!u) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from("profiles").select("id,username,balance,is_admin").eq("id", u.id).maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => load(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(async () => { await load(user); }, [load, user]);

  return <UserCtx.Provider value={{ user, profile, loading, refresh }}>{children}</UserCtx.Provider>;
}

export const useUser = () => useContext(UserCtx);
