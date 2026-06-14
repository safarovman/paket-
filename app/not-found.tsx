import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-center px-4">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-3xl font-black text-white mb-2">404 — Sahifa topilmadi</h1>
      <p className="text-text-gray mb-6">Bu sahifa mavjud emas yoki sizga ruxsat yo'q</p>
      <Link href="/dashboard" className="bg-gradient-to-r from-purple to-cyan text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
        ← Dashboardga qaytish
      </Link>
    </div>
  );
}
