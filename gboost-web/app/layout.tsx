import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LiveFeed from "@/components/LiveFeed";
import { UserProvider } from "@/components/UserProvider";

export const metadata: Metadata = {
  title: "UzDrop — akkaunt sotish va akkaunt spin",
  description: "O'yin akkauntlarini sotib oling, soting yoki spin qilib yuting. Standoff 2, PUBG, MLBB, Free Fire.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        {/* Sayt o'zi qorong'i — telefon "majburiy qorong'i rejimi" ranglarni buzmasin */}
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#070505" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col pb-[calc(3rem+env(safe-area-inset-bottom))] md:pb-0">
        <UserProvider>
          <LiveFeed />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
