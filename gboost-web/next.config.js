/** @type {import('next').NextConfig} */
// Bitta koddan ikki sayt yig'iladi (ikkalasi ham to'liq statik, Cloudflare Pages):
//   npm run build        → asosiy sayt (uzdrop.uz)      — faqat page.tsx / layout.tsx
//   npm run build:admin  → admin sayti (admin.uzdrop.uz) — faqat *.admin.tsx fayllar
// Shu sababli admin panel kodi asosiy saytga umuman kirmaydi.
const isAdmin = process.env.NEXT_PUBLIC_SITE === "admin";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: isAdmin ? ["admin.tsx", "admin.ts"] : ["tsx", "ts"],  // admin: 2 ta element shart (Next 14 xatosi)
};
module.exports = nextConfig;
