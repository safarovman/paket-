"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";

const GAMES = [
  { id:"mlbb",     name:"MLBB",      icon:"🗡️", color:"#FF6B00", ranks:["Master","Grandmaster","Epic","Legend","Mythic","Mythic Glory"] },
  { id:"pubg",     name:"PUBG",      icon:"🎯", color:"#FFD600", ranks:["Gold","Platinum","Diamond","Crown","Ace","Conqueror"] },
  { id:"cs2",      name:"CS2",       icon:"💣", color:"#9B59B6", ranks:["Gold Nova","Master Guardian","Legendary Eagle","Global Elite"] },
  { id:"freefire", name:"Free Fire", icon:"🔥", color:"#00C853", ranks:["Gold","Diamond","Heroic","Grandmaster"] },
];

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function RentPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]         = useState<1|2|3>(1);
  const [game, setGame]         = useState("");
  const [rank, setRank]         = useState("");
  const [loginId, setLoginId]   = useState("");
  const [loginPw, setLoginPw]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]   = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [rules, setRules]       = useState("");
  const [images, setImages]     = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const selectedGame = GAMES.find(g => g.id === game);
  const days = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;
  const totalPrice = days * Number(pricePerDay || 0);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(p => [...p, ...files].slice(0, 4));
  };

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!game) { setError("O'yinni tanlang"); return false; }
      if (!rank) { setError("Rankni tanlang"); return false; }
    }
    if (s === 2) {
      if (!loginId) { setError("Login kiriting"); return false; }
      if (!loginPw) { setError("Parol kiriting"); return false; }
      if (!startDate || !endDate) { setError("Vaqtni tanlang"); return false; }
      if (days < 1) { setError("Tugash sanasi boshlanishdan keiyn bo'lishi kerak"); return false; }
      if (!pricePerDay || Number(pricePerDay) < 1000) { setError("Kunlik narx kiriting (min 1,000)"); return false; }
    }
    return true;
  };

  const goNext = () => {
    setError("");
    if (step === 1 && validateStep(1)) setStep(2);
    else if (step === 2 && validateStep(2)) setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.from("listings").insert({
      user_name:   "Foydalanuvchi",
      game:        selectedGame?.name || game,
      rank,
      price:       Number(pricePerDay),
      type:        "rent",
      status:      "pending",
      description: `📅 ${startDate} dan ${endDate} gacha\n💰 ${fmt(Number(pricePerDay))} so'm/kun\n\n📋 Qoidalar:\n${rules || "Belgilanmagan"}\n\n${description || ""}`,
      win_rate:    50,
      matches:     0,
    });
    if (error) { setError("Xatolik yuz berdi"); setLoading(false); return; }
    router.push("/dashboard?listing=success");
  };

  return (
    <div className="gsection py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">🔄 Ijaraga Berish</h1>
          <p className="text-gray-500">Akkauntingizni vaqtincha ijaraga bering va pul ishlang</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {["O'yin","Vaqt va narx","Tasdiqlash"].map((lbl, i) => {
            const s = (i+1) as 1|2|3;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  step > s ? "bg-green-500 text-white" : step === s ? "bg-orange-gradient text-white" : "bg-[#2A2A2A] text-gray-500")}>
                  {step > s ? "✓" : s}
                </div>
                <span className={clsx("hidden sm:block ml-2 text-xs flex-1", step >= s ? "text-white" : "text-gray-600")}>{lbl}</span>
                {i < 2 && <div className={clsx("flex-1 h-0.5 mx-2", step > s ? "bg-green-500" : "bg-[#2A2A2A]")} />}
              </div>
            );
          })}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">🎮 O'yin</label>
              <div className="grid grid-cols-2 gap-3">
                {GAMES.map(g => (
                  <button key={g.id} onClick={() => { setGame(g.id); setRank(""); }}
                    className={clsx("p-3 rounded-xl border flex items-center gap-3 transition-all",
                      game === g.id ? "border-orange-500/60 bg-orange-500/10" : "border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A]")}>
                    <span className="text-2xl">{g.icon}</span>
                    <p className="font-bold text-sm" style={{ color: game === g.id ? g.color : "#fff" }}>{g.name}</p>
                  </button>
                ))}
              </div>
            </div>
            {selectedGame && (
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">🏆 Rank</label>
                <select value={rank} onChange={e => setRank(e.target.value)} className="ginput">
                  <option value="">Rankni tanlang...</option>
                  {selectedGame.ranks.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1.5 block">📝 Akkaunt tavsifi</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Akkauntda nima bor, qanday o'ynaladi..." rows={3} className="ginput resize-none" />
            </div>
            {/* Rasm */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">📸 Rasmlar (max 4 ta)</label>
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#2A2A2A]">
                    <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setImages(p => p.filter((_,j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✕</button>
                  </div>
                ))}
                {images.length < 4 && (
                  <button onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#2A2A2A] hover:border-orange-500/50 flex flex-col items-center justify-center transition-all">
                    <span className="text-2xl text-gray-600">+</span>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}
            <button onClick={goNext} className="gbtn w-full py-3 rounded-xl">Davom etish →</button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <button onClick={() => { setStep(1); setError(""); }}
              className="text-gray-500 text-sm flex items-center gap-1 hover:text-white">← Orqaga</button>

            {/* Login/Parol */}
            <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <p className="text-white font-bold text-sm">🔐 Kirish ma'lumotlari</p>
              <div>
                <label className="text-gray-500 text-xs mb-1.5 block">Login / Email</label>
                <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                  placeholder="Login yoki email" className="ginput" />
              </div>
              <div>
                <label className="text-gray-500 text-xs mb-1.5 block">Parol</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={loginPw}
                    onChange={e => setLoginPw(e.target.value)} placeholder="Parol" className="ginput pr-12" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{showPw ? "🙈" : "👁️"}</button>
                </div>
              </div>
            </div>

            {/* Vaqt */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">📅 Ijara vaqti</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 text-xs mb-1 block">Boshlanish</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]} className="ginput" />
                </div>
                <div>
                  <label className="text-gray-600 text-xs mb-1 block">Tugash</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]} className="ginput" />
                </div>
              </div>
              {days > 0 && (
                <p className="text-orange-400 text-sm mt-2 font-semibold">📅 {days} kun ijara</p>
              )}
            </div>

            {/* Kunlik narx */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1.5 block">💰 Kunlik narx (so'm)</label>
              <div className="relative">
                <input type="number" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)}
                  placeholder="50 000" className="ginput pr-16 text-lg font-bold" min={1000} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">so'm/kun</span>
              </div>
              {days > 0 && pricePerDay && (
                <div className="mt-2 p-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{days} kun × {fmt(Number(pricePerDay))} so'm</span>
                    <span className="text-orange-400 font-black">{fmt(totalPrice)} so'm</span>
                  </div>
                </div>
              )}
            </div>

            {/* Qoidalar */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1.5 block">
                📋 Qoidalar <span className="text-gray-600">(nimaga tegmaslik kerak)</span>
              </label>
              <textarea value={rules} onChange={e => setRules(e.target.value)}
                placeholder={`Masalan:\n• Akkaunt parolini o'zgartirmang\n• Email/telefonni o'zgartirmang\n• Kirish ma'lumotlarini boshqalarga bermang`}
                rows={4} className="ginput resize-none" />
            </div>

            {/* Ban eslatmasi */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-400 font-semibold text-sm mb-1">⚠️ Ijara buzilsa nima bo'ladi?</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                Agar ijara olgan shaxs qoidani buzsa — ijara vaqti tugamasdan{" "}
                <strong className="text-white">pul sizga qaytariladi</strong> va
                u foydalanuvchi{" "}
                <strong className="text-white">bloklanadi (ban 102)</strong>.
              </p>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}
            <button onClick={goNext} className="gbtn w-full py-3 rounded-xl">Davom etish →</button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <button onClick={() => { setStep(2); setError(""); }}
              className="text-gray-500 text-sm flex items-center gap-1 hover:text-white">← Orqaga</button>

            <h2 className="text-xl font-bold text-white">Tasdiqlash</h2>

            <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
              {[
                ["O'yin",       selectedGame?.name || "—"],
                ["Rank",        rank || "—"],
                ["Boshlanish",  startDate || "—"],
                ["Tugash",      endDate || "—"],
                ["Davomiyligi", days > 0 ? `${days} kun` : "—"],
                ["Kunlik narx", pricePerDay ? `${fmt(Number(pricePerDay))} so'm` : "—"],
                ["Jami",        totalPrice > 0 ? `${fmt(totalPrice)} so'm` : "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-[#2A2A2A] pb-2">
                  <span className="text-gray-500">{l}:</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#1A1A1A] border border-orange-500/20 rounded-2xl p-4">
              <p className="text-orange-400 font-semibold text-sm mb-2">💡 Eslatma:</p>
              <ul className="text-gray-500 text-xs space-y-1">
                <li>• <strong className="text-white">2 bosqichli tekshiruvni o'chiring</strong> — ijara oldidan</li>
                <li>• Admin tekshirganidan keyin e'lon bozorda ko'rinadi</li>
                <li>• Qoidabuzarlik bo'lsa pul avtomatik qaytariladi</li>
              </ul>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}

            <button onClick={handleSubmit} disabled={loading} className="gbtn w-full py-3.5 rounded-xl disabled:opacity-60">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuborilmoqda...</>
                : "✅ Admin Tekshiruviga Yuborish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
