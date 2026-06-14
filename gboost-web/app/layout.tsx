import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "GBoost — O'zbekistonning Birinchi Xavfsiz Geyming Ekotizimi",
  description: "MLBB, PUBG, Free Fire, CS2 uchun xavfsiz boosting, akkaunt bozori va Escrow tizimi. Uzcard, Humo, Click, Payme qabul qilinadi.",
  keywords: "gboost, boosting, mlbb, pubg, free fire, cs2, uzbekistan, geyming, escrow",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "GBoost — Xavfsiz Geyming Ekotizimi",
    description: "O'zbekiston geymerlari uchun eng ishonchli platforma",
    siteName: "GBoost",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg text-text-light flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
