"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";

const GAMES = [
  { id:"mlbb",     name:"MLBB",       icon:"🗡️", color:"#FF6B00",
    ranks:["Warrior","Elite","Master","Grandmaster","Epic","Legend","Mythic","Mythic Glory"] },
  { id:"pubg",     name:"PUBG",       icon:"🎯", color:"#FFD600",
    ranks:["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Conqueror"] },
  { id:"cs2",      name:"CS2",        icon:"💣", color:"#9B59B6",
    ranks:["Silver I","Silver II","Gold Nova I","Master Guardian","Legendary Eagle","Supreme","Global Elite"] },
  { id:"freefire", name:"Free Fire",  icon:"🔥", color:"#00C853",
    ranks:["Bronze","Silver","Gold","Platinum","Diamond","Heroic","Grandmaster"] },
];

const SELL_TYPES = [
  {
    id: "sell",
    icon: "💰",
    title: "Sotish",
    desc: "Akkauntingizni bir martalik soting. Pul 3 kundan keyin hisobingizga tushadi.",
    badge: "Tez",
  },
  {
    id: "buyout",
    icon: "⚡",
    title: "Tez Sotish (Bizga)",
    desc: "Akkauntni bizga soting — narxni biz qo'yamiz. Pul darhol! Biz boshqalarga sotamiz.",
    badge: "Darhol pul",
  },
  {
    id: "rent",
    icon: "🔄",
    title: "Ijaraga berish",
    desc: "Akkauntingizni vaqtincha ijaraga bering. Shartlarni o'zingiz belgilang.",
    badge: "Ko'proq pul",
  },
];

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function SellPage() {
  const router = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1|2|3>(1);
  const [sellType, setSellType] = useState("sell");
  const [game, setGame]         = useState("");
  const [rank, setRank]         = useState("");
  const [loginId, setLoginId]   = useState("");
  const [loginPw, setLoginPw]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice]       = useState("");
  const [images, setImages]     = useState<File[]>([]);
  const [video, setVideo]       = useState<File | null>(null);
  const [videoError, setVideoError] = useState("");
  const [connected, setConnected] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Rasm yuklash (max 4 ta)
  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = images.length + files.length;
    if (total > 4) { setError("Maksimum 4 ta rasm yuklash mumkin"); return; }
    setImages(p => [...p, ...files].slice(0, 4));
    setError("");
  };

  // Video yuklash (max 20 sek, 480p)
  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setVideoError("Video hajmi 50MB dan oshmasin"); return; }
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      if (vid.duration > 20) {
        setVideoError("Video 20 sekunddan oshmasin!");
        return;
      }
      setVideo(file);
      setVideoError("");
    };
    vid.src = URL.createObjectURL(file);
  };

  const removeImage = (i: number) => setImages(p => p.filter((_, idx) => idx !== i));

  // Step validations
  const validateStep1 = () => {
    if (!sellType) { setError("Sotish turini tanlang"); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (!game)      { setError("O'yinni tanlang"); return false; }
    if (!rank)      { setError("Rankni tanlang"); return false; }
    if (!loginId)   { setError("Login/UID kiriting"); return false; }
    if (!loginPw && sellType !== "rent") { setError("Parolni kiriting"); return false; }
    if (images.length === 0 && !video) { setError("Kamida 1 ta rasm yoki video yuklang"); return false; }
    return true;
  };
  const validateStep3 = () => {
    if (!price || Number(price) < 1000) { setError("Narxni kiriting (min 1,000 so'm)"); return false; }
    return true;
  };

  const goNext = () => {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  // Yuborish
  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true); setError("");

    const selectedGame = GAMES.find(g => g.id === game);

    const { error } = await supabase.from("listings").insert({
      user_name:   "Foydalanuvchi", // Keyinchalik auth dan
      game:        selectedGame?.name || game,
      rank,
      price:       Number(price),
      type:        sellType === "rent" ? "rent" : "sale",
      status:      "pending", // Admin tasdiqlagandan keyin ko'rinadi
      description: description || null,
      win_rate:    50,
      matches:     0,
      verified:    false,
    });

    if (error) {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
      setLoading(false);
      return;
    }

    router.push("/dashboard?listing=success");
  };

  const selectedGame = GAMES.find(g => g.id === game);

  const CONNECTED_OPTIONS = ["Steam", "Google", "Facebook", "Apple", "Email", "Telefon"];

  return (
    <div className="gsection py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">💰 Akkaunt Qo'shish</h1>
          <p className="text-gray-500">Akkauntingizni sotish yoki ijaraga berish uchun ma'lumotlarni kiriting</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {["Tur","Ma'lumotlar","Narx va yuborish"].map((lbl, i) => {
            const s = (i + 1) as 1|2|3;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                  step > s ? "bg-green-500 text-white" :
                  step === s ? "bg-orange-gradient text-white shadow-lg" :
                  "bg-[#2A2A2A] text-gray-500")}>
                  {step > s ? "✓" : s}
                </div>
                <div className="hidden sm:block ml-2 flex-1">
                  <p className={`text-xs font-medium ${step >= s ? "text-white" : "text-gray-500"}`}>{lbl}</p>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-green-500" : "bg-[#2A2A2A]"}`} />}
              </div>
            );
          })}
        </div>

        {/* ─── STEP 1: Sotish turi ─── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Qanday qilmoqchisiz?</h2>
            {SELL_TYPES.map(t => (
              <button key={t.id} onClick={() => setSellType(t.id)}
                className={clsx("w-full p-5 rounded-2xl border-2 text-left transition-all",
                  sellType === t.id ? "border-orange-500 bg-orange-500/10" : "border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A]")}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">{t.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-black text-base ${sellType === t.id ? "text-orange-400" : "text-white"}`}>{t.title}</span>
                      <span className="gbadge-orange text-xs">{t.badge}</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
                  </div>
                  {sellType === t.id && <span className="text-orange-400 text-xl shrink-0">✓</span>}
                </div>
              </button>
            ))}

            {/* Escrow eslatmasi */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 mt-4">
              <p className="text-orange-400 font-semibold text-sm mb-1">💡 Muhim eslatma:</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                Akkauntingiz sotilgandan keyin <strong className="text-white">3 kun</strong> ichida pul hisobingizga tushadi.
                Savdo davomida akkauntingizning <strong className="text-white">2 bosqichli tekshiruvini o'chirib qo'ying</strong> —
                biz uni tezda xaridorga berishimiz uchun.
              </p>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}
            <button onClick={goNext} className="gbtn w-full py-3 rounded-xl">Davom etish →</button>
          </div>
        )}

        {/* ─── STEP 2: Akkaunt ma'lumotlari ─── */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <button onClick={() => { setStep(1); setError(""); }}
              className="text-gray-500 text-sm flex items-center gap-1 hover:text-white transition-colors mb-2">
              ← Orqaga
            </button>

            {/* O'yin tanlash */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">🎮 O'yinni tanlang</label>
              <div className="grid grid-cols-2 gap-3">
                {GAMES.map(g => (
                  <button key={g.id} onClick={() => { setGame(g.id); setRank(""); }}
                    className={clsx("p-3 rounded-xl border text-left transition-all flex items-center gap-3",
                      game === g.id ? "border-orange-500/60 bg-orange-500/10" : "border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A]")}>
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: game === g.id ? g.color : "#fff" }}>{g.name}</p>
                      {game === g.id && <p className="text-green-400 text-xs">✓</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rank */}
            {selectedGame && (
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1.5 block">🏆 Rank</label>
                <select value={rank} onChange={e => setRank(e.target.value)} className="ginput">
                  <option value="">Rankni tanlang...</option>
                  {selectedGame.ranks.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            {/* Login */}
            <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <p className="text-white font-bold text-sm">🔐 Akkaunt kirish ma'lumotlari</p>
              <p className="text-gray-500 text-xs">Bu ma'lumotlar xaridorga beriladi va boshqalarga ko'rinmaydi</p>
              <div>
                <label className="text-gray-500 text-xs mb-1.5 block">Login / Email / UID</label>
                <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                  placeholder="Akkaunt logini yoki UID" className="ginput" />
              </div>
              <div>
                <label className="text-gray-500 text-xs mb-1.5 block">Parol</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={loginPw}
                    onChange={e => setLoginPw(e.target.value)}
                    placeholder="Akkaunt paroli" className="ginput pr-12" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm">
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>

            {/* Ulanganlar */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">🔗 Akkauntga nima ulangan?</label>
              <div className="flex flex-wrap gap-2">
                {CONNECTED_OPTIONS.map(c => (
                  <button key={c} type="button"
                    onClick={() => setConnected(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c])}
                    className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all",
                      connected.includes(c) ? "border-orange-500 bg-orange-500/15 text-orange-400" : "border-[#2A2A2A] text-gray-500 hover:border-[#3A3A3A]")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Rasm/Video yuklash */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-2 block">
                📸 Rasm yoki Video <span className="text-gray-600">(max 4 rasm yoki 1 video, 20 sek)</span>
              </label>

              {/* Images grid */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#2A2A2A]">
                    <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ✕
                    </button>
                  </div>
                ))}
                {images.length < 4 && !video && (
                  <button onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#2A2A2A] hover:border-orange-500/50 flex flex-col items-center justify-center gap-1 transition-all">
                    <span className="text-2xl text-gray-600">+</span>
                    <span className="text-gray-600 text-xs">Rasm</span>
                  </button>
                )}
              </div>

              {/* Video */}
              {!video && images.length === 0 && (
                <button onClick={() => videoRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#2A2A2A] hover:border-orange-500/50 rounded-xl p-4 flex items-center justify-center gap-3 transition-all">
                  <span className="text-2xl">🎬</span>
                  <div className="text-left">
                    <p className="text-gray-400 text-sm font-medium">Video yuklash</p>
                    <p className="text-gray-600 text-xs">Max 20 sek • 480p • 50MB</p>
                  </div>
                </button>
              )}
              {video && (
                <div className="flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
                  <span className="text-2xl">🎬</span>
                  <span className="text-white text-sm flex-1 truncate">{video.name}</span>
                  <button onClick={() => setVideo(null)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                </div>
              )}
              {videoError && <p className="text-red-400 text-xs mt-1">⚠️ {videoError}</p>}

              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />
            </div>

            {/* Description */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1.5 block">
                📝 Akkaunt haqida (ixtiyoriy)
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Akkauntda nima bor? Qanday skinlar, qahramonlar, silahlar..."
                rows={3} className="ginput resize-none" />
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}
            <button onClick={goNext} className="gbtn w-full py-3 rounded-xl">Davom etish →</button>
          </div>
        )}

        {/* ─── STEP 3: Narx va yuborish ─── */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <button onClick={() => { setStep(2); setError(""); }}
              className="text-gray-500 text-sm flex items-center gap-1 hover:text-white transition-colors mb-2">
              ← Orqaga
            </button>

            <h2 className="text-xl font-bold text-white">Narx belgilang</h2>

            {/* Narx input */}
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1.5 block">💰 Narx (so'm)</label>
              <div className="relative">
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="1 000 000" className="ginput pr-16 text-xl font-bold" min={1000} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">so'm</span>
              </div>
              {price && Number(price) > 0 && (
                <p className="text-orange-400 text-sm mt-1.5 font-semibold">
                  💰 {fmt(Number(price))} so'm
                </p>
              )}
            </div>

            {/* Xulosа */}
            <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-bold">📋 Xulosa</h3>
              {[
                ["O'yin",       selectedGame?.name || "—"],
                ["Rank",        rank || "—"],
                ["Sotish turi", SELL_TYPES.find(t => t.id === sellType)?.title || "—"],
                ["Narx",        price ? `${fmt(Number(price))} so'm` : "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-[#2A2A2A] pb-2">
                  <span className="text-gray-500">{l}:</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
              {connected.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ulangan:</span>
                  <span className="text-gray-400 text-xs">{connected.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Eslatmalar */}
            <div className="bg-[#1A1A1A] border border-orange-500/20 rounded-2xl p-4 space-y-2">
              <p className="text-orange-400 font-semibold text-sm">⚠️ Muhim eslatmalar:</p>
              <ul className="space-y-1.5 text-gray-500 text-xs">
                <li>• Akkaunt sotilgandan keyin pul <strong className="text-white">3 kundan keyin</strong> hisobingizga tushadi</li>
                <li>• <strong className="text-white">2 bosqichli tekshiruvni o'chirib qo'ying</strong> — biz xaridorga tez berishimiz uchun</li>
                <li>• Akkaunt ma'lumotlari admin tomonidan tekshiriladi</li>
                <li>• Noto'g'ri ma'lumot bersangiz hisob bloklanadi</li>
              </ul>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</p>}

            <button onClick={handleSubmit} disabled={loading}
              className="gbtn w-full py-3.5 rounded-xl text-base disabled:opacity-60">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuborilmoqda...</>
                : "✅ Admin Tekshiruviga Yuborish"}
            </button>

            <p className="text-gray-600 text-xs text-center">
              Admin tekshirib ko'rgach, akkauntingiz bozorda ko'rinadi
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
