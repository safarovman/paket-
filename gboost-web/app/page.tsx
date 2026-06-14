"use client";
import Link from "next/link";
import { STATS, TOP_BOOSTERS, GAMES } from "@/lib/constants";
import { KarmaBadge } from "@/components/ui/Badge";
import { Card, GradientCard } from "@/components/ui/Card";

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-cyan/8 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple/5 blur-3xl pointer-events-none" />

      <div className="gsection w-full py-20">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span className="text-cyan text-sm font-semibold">O'zbekistonning #1 Geyming Platformasi</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            <span className="text-shimmer">GBoost</span>
            <br />
            <span className="text-text-white text-4xl sm:text-5xl lg:text-6xl">
              Xavfsiz O'yna
            </span>
          </h1>

          <p className="text-text-gray text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            MLBB, PUBG, Free Fire va CS2 uchun <span className="text-cyan font-semibold">ishonchli boosting</span>,
            akkaunt bozori va <span className="text-green font-semibold">3 kunlik Escrow himoyasi</span>.
            Uzcard, Humo, Click, Payme qabul qilinadi.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link href="/register" className="gbtn-primary text-base px-8 py-4 rounded-2xl text-lg font-bold shadow-cyan">
              🚀 Boshlash — Bepul
            </Link>
            <Link href="/boosting" className="gbtn-outline text-base px-8 py-4 rounded-2xl text-lg">
              ⚔️ Boosting narxlari
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col items-center">
                <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-text-gray text-xs mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Problem / Solution ───────────────────────────────────────────────────────
function ProblemSolution() {
  const problems = [
    { icon: "⚠️", title: "Telegram Firibgarliklari", desc: "Boost xizmatlarining 70%+ i firibgarlik — pul to'lanadi, xizmat ko'rsatilmaydi." },
    { icon: "😔", title: "Booster Topib Bo'lmaydi",  desc: "Ishonchli booster topish imkonsiz, reyting tushishi motivatsiyani yo'q qiladi." },
    { icon: "🚫", title: "Xalqaro Saytlar Ishlamaydi",desc: "FunPay, PlayerAuctions Uzcard/Humo qabul qilmaydi, o'zbek tili yo'q." },
  ];
  const solutions = [
    { icon: "🛡️", title: "Escrow Himoyasi",     desc: "3 kunlik xavfsiz savdo — pul faqat ikki tomon kelishganda o'tkaziladi.", color: "green"  },
    { icon: "⭐", title: "AI Karma Moduli",      desc: "Firibgarlikka nol tolerantlik — AI tizimi har bir tranzaksiyani kuzatadi.",  color: "cyan"   },
    { icon: "💳", title: "Milliy To'lovlar",     desc: "Uzcard, Humo, Click, Payme — O'zbek foydalanuvchilar uchun qulay.",          color: "gold"   },
    { icon: "🎮", title: "4 ta Asosiy O'yin",    desc: "MLBB, PUBG, Free Fire, CS2 — Solo va Duo Boosting xizmatlari.",              color: "purple" },
  ];

  return (
    <section className="py-20 bg-navy/30">
      <div className="gsection">
        {/* Problems */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-text-white mb-3">
            O'zbek Geymerlari <span className="text-red">Nimadan Aziyat</span> Chekmoqda?
          </h2>
          <p className="text-text-gray">Mavjud muammolar va ularning yechimi</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {problems.map(p => (
            <Card key={p.title} className="border-red/20">
              <div className="text-3xl mb-3">{p.icon}</div>
              <h3 className="text-text-white font-bold mb-2">{p.title}</h3>
              <p className="text-text-gray text-sm leading-relaxed">{p.desc}</p>
            </Card>
          ))}
        </div>

        {/* Arrow */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-col items-center gap-2">
            <div className="w-0.5 h-10 bg-gradient-to-b from-red/50 to-green/50" />
            <span className="text-3xl">⬇️</span>
            <h3 className="text-2xl font-black text-shimmer">GBoost Yechimi</h3>
            <div className="w-0.5 h-4 bg-green/50" />
          </div>
        </div>

        {/* Solutions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {solutions.map(s => {
            const border = { green:"border-green/30", cyan:"border-cyan/30", gold:"border-gold/30", purple:"border-purple/30" }[s.color];
            const txt    = { green:"text-green", cyan:"text-cyan", gold:"text-gold", purple:"text-purple-light" }[s.color];
            return (
              <Card key={s.title} className={`${border} hover:scale-[1.02] transition-transform`}>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className={`font-bold mb-2 ${txt}`}>{s.title}</h3>
                <p className="text-text-gray text-sm leading-relaxed">{s.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Games ────────────────────────────────────────────────────────────────────
function GamesSection() {
  return (
    <section className="py-20">
      <div className="gsection">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-text-white mb-3">
            Qo'llab-<span className="text-shimmer">Quvvatlanadigan</span> O'yinlar
          </h2>
          <p className="text-text-gray">Solo va Duo Boosting xizmatlari mavjud</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GAMES.map(g => (
            <Link key={g.id} href="/boosting">
              <Card hover className="group text-center py-8">
                <div className="text-5xl mb-4 group-hover:animate-float inline-block">{g.icon}</div>
                <h3 className="text-text-white font-bold text-lg mb-1" style={{ color: g.color }}>{g.short}</h3>
                <p className="text-text-gray text-xs mb-3">{g.name}</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <span className="text-xs bg-card border border-border rounded-full px-2.5 py-1 text-text-gray">
                    {g.ranks.length} rank
                  </span>
                  <span className="text-xs rounded-full px-2.5 py-1 font-semibold"
                    style={{ background: `${g.color}20`, color: g.color, border:`1px solid ${g.color}40` }}>
                    Boosting
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How Escrow Works ─────────────────────────────────────────────────────────
function EscrowSection() {
  const steps = [
    { n:"1", icon:"💰", title:"To'lov Muzlatiladi",  desc:"Xaridor to'laydi — pul GBoost hamyonida qulflangadi.",             color:"cyan"  },
    { n:"2", icon:"⚔️", title:"Xizmat Bajariladi",   desc:"Booster buyurtmani bajaradi yoki akkaunt topshiriladi.",           color:"purple"},
    { n:"3", icon:"🔍", title:"3 Kun Tekshiruv",     desc:"Xaridor tekshiradi, muammo bo'lmasa pul avtomatik o'tkaziladi.",   color:"green" },
    { n:"4", icon:"⚠️", title:"Muammo Chiqqanda",    desc:"Shikoyat bo'lsa moderator aralashadi, pul qaytarilishi mumkin.",   color:"gold"  },
  ];

  return (
    <section className="py-20 bg-navy/30">
      <div className="gsection">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green/10 border border-green/30 rounded-full px-4 py-1.5 mb-4">
            <span className="text-green text-sm font-semibold">🛡️ Sizni Himoya Qilamiz</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-text-white mb-3">
            3 Kunlik <span className="text-green">Xavfsiz Savdo</span> Tizimi
          </h2>
          <p className="text-text-gray max-w-xl mx-auto">
            Escrow — Xaridor va Sotuvchini ikkalasini ham himoya qiladi. Hech qanday firibgarlik imkoni yo'q.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => {
            const colors = { cyan:"border-cyan/30 text-cyan", purple:"border-purple/30 text-purple-light", green:"border-green/30 text-green", gold:"border-gold/30 text-gold" };
            const [border, txt] = colors[s.color as keyof typeof colors].split(" ");
            return (
              <div key={s.n} className="relative">
                <Card className={border}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mb-3 bg-current/10`}
                    style={{ background:`${["#00E5FF","#6C3FB5","#00C853","#FFD600"][i]}20`, color:["#00E5FF","#6C3FB5","#00C853","#FFD600"][i] }}>
                    {s.n}
                  </div>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className={`font-bold mb-2 ${txt}`}>{s.title}</h3>
                  <p className="text-text-gray text-sm leading-relaxed">{s.desc}</p>
                </Card>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-text-gray z-10">→</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Top Boosters ─────────────────────────────────────────────────────────────
function TopBoostersSection() {
  return (
    <section className="py-20">
      <div className="gsection">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-black text-text-white mb-1">
              Top <span className="text-shimmer">Boosterlar</span>
            </h2>
            <p className="text-text-gray text-sm">Platformamizdagi eng yaxshi va ishonchli boosterlar</p>
          </div>
          <Link href="/boosting" className="gbtn-outline text-sm px-4 py-2 rounded-xl">
            Barchasini ko'rish →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOP_BOOSTERS.map(b => (
            <Card key={b.name} hover className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-black text-xl shrink-0 shadow-cyan">
                {b.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-text-white font-bold text-sm truncate">{b.name}</span>
                  <span className="text-gold text-xs">{"★".repeat(Math.round(b.rating))}</span>
                </div>
                <span className="text-text-gray text-xs">{b.game}</span>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <KarmaBadge karma={b.karma} />
                  <span className="text-text-gray text-xs">{b.orders} buyurtma</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────────
function ComparisonSection() {
  const rows = [
    { label: "To'lov (Uzcard/Humo)", gboost: { val:"✅ To'liq", c:"text-green" }, tg: { val:"⚠️ Shaxsiy transfer", c:"text-gold" }, fp: { val:"❌ Yo'q", c:"text-red" } },
    { label: "Escrow Tizimi",        gboost: { val:"✅ 3 kun",   c:"text-green" }, tg: { val:"❌ Yo'q",             c:"text-red"  }, fp: { val:"⚠️ Cheklangan", c:"text-gold" } },
    { label: "O'zbek tili",          gboost: { val:"✅ To'liq",  c:"text-green" }, tg: { val:"⚠️ Guruh chati",      c:"text-gold" }, fp: { val:"❌ Yo'q",        c:"text-red"  } },
    { label: "AI Karma tizimi",      gboost: { val:"✅ Bor",     c:"text-green" }, tg: { val:"❌ Yo'q",             c:"text-red"  }, fp: { val:"⚠️ Cheklangan", c:"text-gold" } },
    { label: "Tezlik",               gboost: { val:"✅ Avtomatik",c:"text-green"}, tg: { val:"⚠️ Qo'lda",          c:"text-gold" }, fp: { val:"⚠️ 3-7 kun",    c:"text-gold" } },
  ];

  return (
    <section className="py-20 bg-navy/30">
      <div className="gsection">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-text-white mb-3">
            Nima Uchun <span className="text-shimmer">GBoost?</span>
          </h2>
          <p className="text-text-gray">Raqobatchilar bilan taqqoslash</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-text-gray text-sm font-semibold">Mezon</th>
                <th className="py-3 px-4 text-cyan font-bold text-sm bg-cyan/5 rounded-t-xl">GBoost 🏆</th>
                <th className="py-3 px-4 text-gold font-semibold text-sm">Telegram guruhlar</th>
                <th className="py-3 px-4 text-text-gray font-semibold text-sm">FunPay / PlayerAuctions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-card/30"}`}>
                  <td className="py-3 px-4 text-text-light text-sm font-medium">{r.label}</td>
                  <td className={`py-3 px-4 text-center text-sm font-semibold ${r.gboost.c} bg-cyan/5`}>{r.gboost.val}</td>
                  <td className={`py-3 px-4 text-center text-sm ${r.tg.c}`}>{r.tg.val}</td>
                  <td className={`py-3 px-4 text-center text-sm ${r.fp.c}`}>{r.fp.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-20">
      <div className="gsection">
        <GradientCard gradient="from-purple/20 via-card to-cyan/10" className="text-center py-16 border-cyan/20">
          <div className="text-5xl mb-6 animate-float inline-block">🚀</div>
          <h2 className="text-3xl sm:text-4xl font-black text-text-white mb-4">
            Bugun Boshlang!
          </h2>
          <p className="text-text-gray text-lg mb-8 max-w-xl mx-auto">
            O'zbekistondagi 4.5M+ geymerlar bilan qo'shiling. Reytingingizni ko'tarish endi xavfsiz va oson!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="gbtn-primary text-base px-8 py-4 rounded-2xl font-bold">
              🎮 Bepul Ro'yxatdan O'tish
            </Link>
            <Link href="/boosting" className="gbtn-outline text-base px-8 py-4 rounded-2xl">
              Narxlarni Ko'rish
            </Link>
          </div>
          <p className="text-text-gray text-xs mt-6">
            ✅ Ro'yxatdan o'tish bepul • 🛡️ Escrow himoyasi • 💳 O'zbek to'lov tizimlari
          </p>
        </GradientCard>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <GamesSection />
      <EscrowSection />
      <TopBoostersSection />
      <ComparisonSection />
      <CTASection />
    </>
  );
}
