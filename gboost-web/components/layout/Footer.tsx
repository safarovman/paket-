import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-navy mt-auto">
      <div className="gsection py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-black">G</span>
              </div>
              <span className="font-black text-lg text-shimmer">GBoost</span>
            </div>
            <p className="text-text-gray text-sm leading-relaxed">
              O'zbekistonning birinchi xavfsiz geyming ekotizimi. Reytingni ko'tar, xavfsiz o'yna!
            </p>
            <div className="flex gap-3 mt-4">
              {["Telegram", "Instagram", "YouTube"].map(s => (
                <a key={s} href="#" className="text-text-gray hover:text-cyan text-xs transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-text-white font-bold text-sm mb-3">Xizmatlar</h4>
            <ul className="space-y-2">
              {[["Boosting","/boosting"],["Akkaunt Bozori","/marketplace"],["Escrow","/escrow"],["Karma","/karma"]].map(([l,h]) => (
                <li key={h}>
                  <Link href={h} className="text-text-gray hover:text-cyan text-sm transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-text-white font-bold text-sm mb-3">O'yinlar</h4>
            <ul className="space-y-2">
              {["MLBB 🗡️","PUBG Mobile 🎯","Free Fire 🔥","CS2 💣"].map(g => (
                <li key={g}>
                  <span className="text-text-gray text-sm">{g}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-text-white font-bold text-sm mb-3">Aloqa</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:gboost.uz@gmail.com" className="text-text-gray hover:text-cyan transition-colors flex items-center gap-1.5">
                  📧 gboost.uz@gmail.com
                </a>
              </li>
              <li>
                <a href="#" className="text-text-gray hover:text-cyan transition-colors flex items-center gap-1.5">
                  ✈️ @gboost_uz
                </a>
              </li>
              <li>
                <a href="#" className="text-text-gray hover:text-cyan transition-colors flex items-center gap-1.5">
                  🌐 gboost.uz
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-text-gray text-xs">© 2024 GBoost. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-4">
            {["Foydalanish shartlari","Maxfiylik"].map(t => (
              <a key={t} href="#" className="text-text-gray hover:text-cyan text-xs transition-colors">{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
