"use client";
import { useEffect } from "react";

// Eski havolalar uchun: parametr va hash'ni saqlab /login/done ga yo'naltiradi
export default function Callback() {
  useEffect(() => { window.location.replace(`/login/done${window.location.search}${window.location.hash}`); }, []);
  return <div className="wrap py-24 text-center text-muted">Kirilmoqda…</div>;
}
