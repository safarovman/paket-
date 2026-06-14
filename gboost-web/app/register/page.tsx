"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Card, GradientCard } from "@/components/ui/Card";
import { GAMES } from "@/lib/constants";
import clsx from "clsx";

type Role = "client" | "booster";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("client");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", phone:"", password:"", confirm:"" });
  const [show, setShow] = useState({ pw: false, cf: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleGame = (id: string) =>
    setSelectedGames(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())   e.name    = "Ism kiriting";
    if (!form.phone.trim())  e.phone   = "Telefon kiriting";
    if (form.password.length < 6) e.password = "Parol kamida 6 ta belgi";
    if (form.password !== form.confirm) e.confirm = "Parollar mos emas";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { if (validate()) setStep(2); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-cyan/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-purple/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-cyan mb-4">
            <span className="text-white font-black text-3xl">G</span>
          </div>
          <h1 className="text-2xl font-black text-shimmer mb-1">GBoost</h1>
          <p className="text-text-gray text-sm">Ro'yxatdan o'ting — Bepul</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 max-w-xs mx-auto">
          {[1, 2].map(s => (
            <div key={s} className={clsx("flex items-center gap-2 flex-1", s < 2 && "after:flex-1 after:h-px after:bg-border")}>
              <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                step >= s ? "bg-gradient-primary text-white" : "bg-card border border-border text-text-gray"
              )}>
                {step > s ? "✓" : s}
              </div>
              <span className={clsx("text-xs", step >= s ? "text-cyan" : "text-text-gray")}>
                {s === 1 ? "Ma'lumotlar" : "Rol & O'yin"}
              </span>
            </div>
          ))}
        </div>

        <GradientCard gradient="from-card to-navy" className="border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">

            {step === 1 ? (
              <>
                <Input label="👤 Ism va familiya" placeholder="Abdulloh Karimov"
                  value={form.name} onChange={e => setForm(p=>({...p, name:e.target.value}))} error={errors.name} />
                <Input label="📱 Telefon raqam" type="tel" placeholder="+998 90 123 45 67"
                  value={form.phone} onChange={e => setForm(p=>({...p, phone:e.target.value}))} error={errors.phone} />
                <Input label="🔒 Parol" type={show.pw?"text":"password"} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p=>({...p, password:e.target.value}))} error={errors.password}
                  suffix={<button type="button" onClick={() => setShow(p=>({...p,pw:!p.pw}))} className="text-text-gray hover:text-cyan text-sm">{show.pw?"🙈":"👁️"}</button>} />
                <Input label="🔒 Parolni tasdiqlang" type={show.cf?"text":"password"} placeholder="••••••••"
                  value={form.confirm} onChange={e => setForm(p=>({...p, confirm:e.target.value}))} error={errors.confirm}
                  suffix={<button type="button" onClick={() => setShow(p=>({...p,cf:!p.cf}))} className="text-text-gray hover:text-cyan text-sm">{show.cf?"🙈":"👁️"}</button>} />
                <Button type="submit" fullWidth>Davom etish →</Button>
              </>
            ) : (
              <>
                {/* Role selection */}
                <div>
                  <p className="text-text-gray text-sm font-medium mb-3">Siz kimSiz?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { id:"client",  icon:"🎮", title:"Mijoz",   sub:"Boosting sotib olish" },
                      { id:"booster", icon:"⚔️", title:"Booster", sub:"Xizmat ko'rsatish" },
                    ] as const).map(r => (
                      <button key={r.id} type="button" onClick={() => setRole(r.id)}
                        className={clsx("p-4 rounded-xl border text-center transition-all duration-150",
                          role === r.id ? "border-cyan bg-cyan/10 shadow-cyan" : "border-border bg-card hover:border-cyan/30")}>
                        <div className="text-3xl mb-2">{r.icon}</div>
                        <div className={clsx("font-bold text-sm", role===r.id?"text-cyan":"text-text-white")}>{r.title}</div>
                        <div className="text-text-gray text-xs mt-0.5">{r.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Games (booster only) */}
                {role === "booster" && (
                  <div>
                    <p className="text-text-gray text-sm font-medium mb-3">Ixtisoslashuv (kamida 1 ta):</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {GAMES.map(g => {
                        const sel = selectedGames.includes(g.id);
                        return (
                          <button key={g.id} type="button" onClick={() => toggleGame(g.id)}
                            className={clsx("flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all",
                              sel ? "border-current bg-current/10" : "border-border bg-card hover:border-current/30")}
                            style={{ color: sel ? g.color : "#90A4AE", borderColor: sel ? `${g.color}60` : undefined }}>
                            <span className="text-xl">{g.icon}</span>
                            <span className="font-semibold">{g.short}</span>
                            {sel && <span className="ml-auto">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5 accent-cyan w-4 h-4 rounded" />
                  <span className="text-text-gray text-xs leading-relaxed">
                    Men <span className="text-cyan">foydalanish shartlari</span> va{" "}
                    <span className="text-cyan">maxfiylik siyosati</span>ga roziman
                  </span>
                </label>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 border border-border rounded-xl py-3 text-text-gray hover:text-text-light hover:bg-card transition-colors text-sm">
                    ← Orqaga
                  </button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading
                      ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Yaratilmoqda...</span>
                      : "🚀 Hisob yaratish"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </GradientCard>

        <p className="text-center mt-5 text-text-gray text-sm">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="text-cyan font-semibold hover:underline">Kirish</Link>
        </p>
      </div>
    </div>
  );
}
