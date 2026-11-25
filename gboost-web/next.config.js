/** @type {import('next').NextConfig} */
// To'liq statik sayt — Cloudflare Pages (cheksiz bepul trafik) uchun.
// Barcha ma'lumot Supabase'da, rasmlar Cloudflare R2'da.
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};
module.exports = nextConfig;
