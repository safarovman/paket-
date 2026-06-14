import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#2A2A2A] bg-[#0E0E0E] mt-auto">
      <div className="gsection py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-orange-gradient flex items-center justify-center">
                <span className="text-white font-black">G</span>
              </div>
              <span className="font-black text-lg text-gradient">GBoost</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              O'zbekistonning eng ishonchli geyming bozori. Xavfsiz savdo — Escrow himoyasi.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Xizmatlar</h4>
            <ul className="space-y-2">
              {[["Akkaunt Sotish","/sell"],["Akkaunt Ijara","/rent"],["Boosting","/boosting"],["Bozor","/marketplace"]].map(([l,h]) => (
                <li key={h}>
                  <Link href={h} className="text-gray-500 hover:text-orange-400 text-sm transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">O'yinlar</h4>
            <ul className="space-y-2">
              {["MLBB 🗡️","PUBG 🎯","CS2 💣","Free Fire 🔥"].map(g => (
                <li key={g}><span className="text-gray-500 text-sm">{g}</span></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Aloqa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:gboost.uz@gmail.com" className="text-gray-500 hover:text-orange-400 transition-colors">📧 gboost.uz@gmail.com</a></li>
              <li><a href="#" className="text-gray-500 hover:text-orange-400 transition-colors">✈️ @gboost_uz</a></li>
              <li><a href="#" className="text-gray-500 hover:text-orange-400 transition-colors">🌐 gboost.uz</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2A2A2A] mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-600 text-xs">© 2024 GBoost. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-4">
            {["Foydalanish shartlari","Maxfiylik"].map(t => (
              <a key={t} href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
