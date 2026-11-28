import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/components/UserProvider";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "UzDrop Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        {/* Sayt o'zi qorong'i — telefon "majburiy qorong'i rejimi" ranglarni buzmasin */}
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#070505" />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col">
        <UserProvider>
          <AdminHeader />
          <main className="flex-1">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
