"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/UserProvider";

/** Admin sayti sarlavhasi — asosiy sayt menyusisiz */
export default function AdminHeader() {
  const { user, profile } = useUser();
  const router = useRouter();
  const logout = async () => { await supabase.auth.signOut(); router.push("/login/"); };

  return (
    <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur border-b border-line">
      <div className="wrap flex items-center h-14 gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-black text-[#1B1400]">U</span>
          <span className="font-black tracking-tight">Uzz<span className="text-accent">Drop</span> <span className="text-muted font-bold text-sm">Admin</span></span>
        </Link>
        {user && (
          <div className="ml-auto flex items-center gap-3 min-w-0">
            <div className="text-right min-w-0 hidden sm:block">
              <p className="text-sm font-bold truncate">
                {profile?.username || user.email}
                {profile?.telegram && <span className="text-muted font-normal"> • @{profile.telegram}</span>}
              </p>
              <p className="text-[11px] text-muted font-mono">ID {profile?.public_id ?? "—"}{profile?.is_admin ? " • admin" : ""}</p>
            </div>
            <button onClick={logout} className="btn-ghost !py-2 !px-3">Chiqish</button>
          </div>
        )}
      </div>
    </header>
  );
}
