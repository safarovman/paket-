"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, GradientCard } from "@/components/ui/Card";
import { KarmaBadge } from "@/components/ui/Badge";
import clsx from "clsx";

const MENU_ITEMS = [
  { icon:"📦", label:"Buyurtmalar tarixi",        href:"/dashboard"    },
  { icon:"💰", label:"Hamyon va to'lovlar",        href:"/dashboard"    },
  { icon:"🛡️", label:"Escrow tarixi",              href:"/escrow"       },
  { icon:"⭐", label:"Karma tarixi",               href:"/karma"        },
  { icon:"🔔", label:"Bildirishnomalar",           href:"#"             },
  { icon:"🎮", label:"Mening akkauntlarim",        href:"/marketplace"  },
  { icon:"❓", label:"Yordam va qo'llab-quvvatlash",href:"#"            },
];

const CONTACT = [
  { icon:"📧", label:"gboost.uz@gmail.com",   href:"mailto:gboost.uz@gmail.com" },
  { icon:"✈️", label:"Telegram: @gboost_uz",  href:"#" },
  { icon:"🌐", label:"gboost.uz",              href:"#" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("Abdulloh Karimov");
  const [phone, setPhone] = useState("+998 90 123 45 67");

  const handleLogout = () => router.push("/login");

  return (
    <div className="gsection py-8 max-w-2xl mx-auto space-y-5">
      {/* Profile header */}
      <GradientCard gradient="from-purple/20 via-card to-cyan/10" className="border border-cyan/15">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-black text-3xl shadow-cyan">
              {name[0]}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green border-2 border-card" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-2 mb-3">
                <input value={name} onChange={e => setName(e.target.value)}
                  className="ginput text-sm w-full" placeholder="Ism familiya" />
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="ginput text-sm w-full" placeholder="Telefon" />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-black text-text-white mb-0.5">{name}</h1>
                <p className="text-text-gray text-sm mb-2">{phone}</p>
              </>
            )}
            <KarmaBadge karma={78} />
          </div>

          {/* Edit button */}
          <button onClick={() => setIsEditing(!isEditing)}
            className={clsx("shrink-0 text-sm px-4 py-2 rounded-xl border font-semibold transition-all",
              isEditing
                ? "border-green/50 bg-green/10 text-green hover:bg-green/20"
                : "border-border text-text-gray hover:bg-card hover:text-text-light")}>
            {isEditing ? "✅ Saqlash" : "✏️ Tahrirlash"}
          </button>
        </div>
      </GradientCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Buyurtmalar", value:"12",    color:"text-cyan",         icon:"📦" },
          { label:"Muvaffaqiyat",value:"10",    color:"text-green",        icon:"✅" },
          { label:"Karma",       value:"78/100",color:"text-gold",         icon:"⭐" },
        ].map(s => (
          <Card key={s.label} className="text-center py-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
            <p className="text-text-gray text-xs mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* VIP subscription */}
      <GradientCard gradient="from-gold/15 to-card" className="border border-gold/25">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <p className="font-bold text-gold">VIP Obuna</p>
              <p className="text-text-gray text-xs">Prioritet buyurtmalar, past komissiya</p>
            </div>
          </div>
          <button className="bg-gradient-gold text-bg font-bold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
            $5/oy — Faollashtirish
          </button>
        </div>
      </GradientCard>

      {/* Menu */}
      <Card padding="p-0 overflow-hidden">
        {MENU_ITEMS.map((item, i) => (
          <div key={item.label}>
            <Link href={item.href}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-border/20 transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-text-light text-sm font-medium">{item.label}</span>
              <span className="text-text-gray text-xs">→</span>
            </Link>
            {i < MENU_ITEMS.length - 1 && <div className="h-px bg-border mx-5" />}
          </div>
        ))}
      </Card>

      {/* Contact */}
      <Card padding="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-text-gray text-xs font-semibold uppercase tracking-wider">Aloqa</p>
        </div>
        {CONTACT.map((c, i) => (
          <div key={c.label}>
            <a href={c.href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-border/20 transition-colors">
              <span className="text-xl">{c.icon}</span>
              <span className="flex-1 text-text-light text-sm">{c.label}</span>
              <span className="text-text-gray text-xs">↗</span>
            </a>
            {i < CONTACT.length - 1 && <div className="h-px bg-border mx-5" />}
          </div>
        ))}
      </Card>

      {/* App info */}
      <div className="text-center text-text-gray text-xs space-y-1">
        <p>GBoost v1.0.0</p>
        <p>© 2024 GBoost. Barcha huquqlar himoyalangan.</p>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 border border-red/40 bg-red/8 text-red font-semibold rounded-xl py-3 hover:bg-red/15 transition-colors">
        🚪 Chiqish
      </button>
    </div>
  );
}
