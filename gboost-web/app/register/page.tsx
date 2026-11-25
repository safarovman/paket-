"use client";
import { useEffect } from "react";
export default function Register() {
  useEffect(() => { window.location.replace("/login"); }, []);
  return null;
}
