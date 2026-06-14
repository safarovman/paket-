import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GBoost Admin Panel",
  description: "GBoost boshqaruv paneli — faqat adminlar uchun",
  robots: "noindex, nofollow", // Google'da chiqmasin!
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg text-text-light antialiased">{children}</body>
    </html>
  );
}
