"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { GradientCard } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.phone)    e.phone    = "Telefon raqamni kiriting";
    if (!form.password || form.password.length < 6) e.password = "Parol kamida 6 ta belgi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-purple/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-cyan/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-cyan mb-4">
            <span className="text-white font-black text-3xl">G</span>
          </div>
          <h1 className="text-2xl font-black text-shimmer mb-1">GBoost</h1>
          <p className="text-text-gray text-sm">Hisobingizga kiring</p>
        </div>

        <GradientCard gradient="from-card to-navy" className="border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="📱 Telefon raqam"
              type="tel"
              placeholder="+998 90 123 45 67"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              error={errors.phone}
            />
            <div>
              <Input
                label="🔒 Parol"
                type={show ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                error={errors.password}
                suffix={
                  <button type="button" onClick={() => setShow(!show)} className="text-text-gray hover:text-cyan transition-colors text-sm">
                    {show ? "🙈" : "👁️"}
                  </button>
                }
              />
              <div className="flex justify-end mt-1.5">
                <button type="button" className="text-cyan text-xs hover:underline">
                  Parolni unutdingizmi?
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} fullWidth className="mt-2">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kirish...</span> : "Kirish →"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-gray text-xs">yoki</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Telegram login */}
          <button className="w-full flex items-center justify-center gap-2.5 border border-border rounded-xl py-3 text-text-light hover:bg-card transition-colors text-sm font-medium">
            <span className="text-xl">✈️</span> Telegram orqali kirish
          </button>
        </GradientCard>

        <p className="text-center mt-5 text-text-gray text-sm">
          Hisobingiz yo'qmi?{" "}
          <Link href="/register" className="text-cyan font-semibold hover:underline">
            Ro'yxatdan o'ting
          </Link>
        </p>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-6">
          {["🛡️ Escrow", "🔒 SSL", "💳 O'zbek To'lovlar"].map(t => (
            <span key={t} className="text-text-gray text-xs flex items-center gap-1">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
