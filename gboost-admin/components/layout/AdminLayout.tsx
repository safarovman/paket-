"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("gboost_admin_session");
    if (!s) { router.push("/login"); return; }
    const parsed = JSON.parse(s);
    if (Date.now() - parsed.loginTime > 8 * 60 * 60 * 1000) {
      localStorage.removeItem("gboost_admin_session");
      router.push("/login");
      return;
    }
    setReady(true);
  }, [pathname]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
