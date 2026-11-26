"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { TELEGRAM_ADMIN, type Profile } from "@/lib/uzdrop";

interface Ban { banned: boolean; kind?: "account" | "ip"; reason?: string | null; }
interface Ctx { user: User | null; profile: Profile | null; loading: boolean; ban: Ban | null; refresh: () => Promise<void>; }
const UserCtx = createContext<Ctx>({ user: null, profile: null, loading: true, ban: null, refresh: async () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ban, setBan] = useState<Ban | null>(null);

  // Ban holatini tekshirish (akkaunt yoki IP). Funksiya hali bazada bo'lmasa — jim o'tib ketadi.
  const checkBan = useCallback(async () => {
    const { data, error } = await supabase.rpc("ban_status");
    if (!error && data) setBan(data as Ban);
  }, []);

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    checkBan();
    if (!u) { setProfile(null); setLoading(false); return; }
    const q = () => supabase.from("profiles").select("id,public_id,username,email,telegram,balance,is_admin").eq("id", u.id).maybeSingle();
    let { data, error } = await q();
    if (error) console.error("Profil o'qilmadi:", error.message);
    if (!data) {
      // Profil yo'q bo'lsa — yaratib, qayta o'qiymiz
      const r = await supabase.rpc("ensure_profile");
      if (r.error) console.error("Profil yaratilmadi:", r.error.message);
      ({ data } = await q());
    }
    setProfile(data as Profile | null);
    setLoading(false);
  }, [checkBan]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => load(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(async () => { await load(user); }, [load, user]);

  return (
    <UserCtx.Provider value={{ user, profile, loading, ban, refresh }}>
      {ban?.banned ? <BanScreen ban={ban} /> : children}
    </UserCtx.Provider>
  );
}

/** Bloklangan foydalanuvchi / IP uchun ekran */
function BanScreen({ ban }: { ban: Ban }) {
  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="panel max-w-md w-full p-8 text-center">
        <p className="text-5xl">🚫</p>
        <h1 className="h-title mt-3">{ban.kind === "ip" ? "Tarmog'ingiz bloklangan" : "Hisobingiz bloklangan"}</h1>
        <p className="text-muted text-sm mt-2">
          {ban.kind === "ip"
            ? "Sizning internet manzilingiz (IP) qoidabuzarlik sababli bloklangan."
            : "Hisobingiz sayt qoidalarini buzgani sababli bloklangan."}
        </p>
        {ban.reason && <p className="mt-3 text-sm"><span className="text-muted">Sabab:</span> <b>{ban.reason}</b></p>}
        <p className="text-xs text-muted mt-4">Xato deb o&apos;ylasangiz, admin bilan bog&apos;laning: <b className="text-accent">@{TELEGRAM_ADMIN}</b></p>
        {ban.kind === "account" && <button onClick={logout} className="btn-ghost w-full mt-5">Chiqish</button>}
      </div>
    </div>
  );
}

export const useUser = () => useContext(UserCtx);
