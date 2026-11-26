/** @type {import('next').NextConfig} */
// Bitta koddan ikki sayt yig'iladi (ikkalasi ham to'liq statik, Cloudflare Pages):
//   npm run build        → asosiy sayt (uzdrop.uz)      — faqat page.tsx / layout.tsx
//   npm run build:admin  → admin sayti (admin.uzdrop.uz) — faqat *.admin.tsx fayllar
// Shu sababli admin panel kodi asosiy saytga umuman kirmaydi.
const isAdmin = process.env.NEXT_PUBLIC_SITE === "admin";

// XAVFSIZLIK: brauzerga faqat OCHIQ (publishable / anon) kalit ketishi mumkin.
// Maxfiy kalit (sb_secret_... yoki service_role) kiritilsa — build to'xtatiladi,
// aks holda u sayt kodiga yozilib, hammaga oshkor bo'lardi.
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const looksSecret =
  anonKey.startsWith("sb_secret_") ||
  (() => {
    try {
      const payload = JSON.parse(Buffer.from(anonKey.split(".")[1] || "", "base64").toString());
      return payload.role === "service_role";
    } catch { return false; }
  })();
if (looksSecret) {
  throw new Error(
    "\n\n❌ NEXT_PUBLIC_SUPABASE_ANON_KEY ga MAXFIY kalit qo'yilgan!\n" +
    "   Supabase → Project Settings → API Keys → 'Publishable key' (sb_publishable_...) ni qo'ying.\n" +
    "   Maxfiy kalitni (sb_secret_...) darhol Supabase'da o'chiring va yangisini yarating.\n"
  );
}

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: isAdmin ? ["admin.tsx", "admin.ts"] : ["tsx", "ts"],  // admin: 2 ta element shart (Next 14 xatosi)
};
module.exports = nextConfig;
